/**
 * FineWeb2 对拍工具测试。
 * 输入：CLI 参数、临时 JSONL 样本和伪造的 encode 结果。
 * 输出：验证参数解析、样本收集和 mismatch 报告行为。
 */

import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import {
  collectFinewebSamples,
  compareFamilyAgainstSamples,
  decodeReferenceText,
  parseCliArgs,
} from "../scripts/fineweb2-compare.mjs"

/** 测试期间创建的临时目录列表。 */
const TEMP_DIRECTORIES: string[] = []

afterEach(() => {
  for (const directory of TEMP_DIRECTORIES.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe("fineweb2 compare helpers", () => {
  it("解析 CLI 参数并应用默认值", () => {
    const options = parseCliArgs([
      "--families",
      "qwen3.5,glm-5",
      "--start",
      "10",
      "--limit",
      "3",
      "--maxChars",
      "2048",
      "--json",
    ])

    expect(options.families).toEqual(["qwen3.5", "glm-5"])
    expect(options.start).toBe(10)
    expect(options.limit).toBe(3)
    expect(options.maxChars).toBe(2048)
    expect(options.json).toBe(true)
    expect(options.continueOnMismatch).toBe(false)
    expect(options.checkDecode).toBe(false)
    expect(options.jobs).toBe(1)
    expect(options).toMatchObject({
      referenceBackend: "js",
    })
    expect(options.filePath).toContain("fineweb2_sample_10per.jsonl")
  })

  it("支持显式开启 decode 对拍", () => {
    const options = parseCliArgs(["--checkDecode"])

    expect(options.checkDecode).toBe(true)
  })

  it("支持显式指定 Python reference backend", () => {
    const options = parseCliArgs(["--referenceBackend", "python"])

    expect(options).toMatchObject({
      referenceBackend: "python",
    })
  })

  it("支持显式指定目标 workspace 子包", () => {
    const options = parseCliArgs(["--package", "minimax"])

    expect(options).toMatchObject({
      packageDir: "minimax",
    })
  })

  it("支持显式指定并行 job 数量", () => {
    const options = parseCliArgs(["--jobs", "3"])

    expect(options.jobs).toBe(3)
  })

  it("收集 JSONL 样本时会跳过超长文本并保留行号与 id", async () => {
    const tempDirectory = mkdtempSync(resolve(tmpdir(), "tokkit-fineweb2-"))
    const fixturePath = resolve(tempDirectory, "fixture.jsonl")

    TEMP_DIRECTORIES.push(tempDirectory)

    writeFileSync(
      fixturePath,
      [
        JSON.stringify({ id: "skip-me", text: "0123456789" }),
        JSON.stringify({ id: "keep-1", text: "hello" }),
        JSON.stringify({ id: "keep-2", text: "world" }),
      ].join("\n"),
      "utf8"
    )

    const result = await collectFinewebSamples(fixturePath, {
      start: 0,
      limit: 2,
      maxChars: 5,
    })

    expect(result.samples).toEqual([
      {
        lineNumber: 2,
        id: "keep-1",
        text: "hello",
      },
      {
        lineNumber: 3,
        id: "keep-2",
        text: "world",
      },
    ])
    expect(result.skippedTooLong).toBe(1)
    expect(result.totalLines).toBe(3)
  })

  it("对拍出现差异时会返回首个 mismatch 的定位信息", async () => {
    const result = await compareFamilyAgainstSamples({
      family: "toy-family",
      samples: [
        {
          lineNumber: 7,
          id: "sample-7",
          text: "hello world",
        },
      ],
      tokkitEncode: async () => [11, 22, 44],
      referenceEncode: () => [11, 22, 33],
    })

    expect(result.ok).toBe(false)
    expect(result.checkedSamples).toBe(1)
    expect(result.mismatch).toMatchObject({
      family: "toy-family",
      lineNumber: 7,
      id: "sample-7",
      inputLength: 11,
      firstMismatchIndex: 2,
      actualToken: 44,
      expectedToken: 33,
      actualLength: 3,
      expectedLength: 3,
    })
    expect(result.mismatch?.textPreview).toContain("hello world")
  })

  it("官方 reference decode 会关闭 clean_up_tokenization_spaces，避免把原始空格误清理掉", () => {
    const calls: unknown[] = []
    const reference = {
      decode(ids: number[], options: Record<string, unknown>) {
        calls.push({
          ids,
          options,
        })
        return "decoded"
      },
    }

    const decoded = decodeReferenceText(reference as never, [1, 2, 3])

    expect(decoded).toBe("decoded")
    expect(calls).toEqual([
      {
        ids: [1, 2, 3],
        options: {
          skip_special_tokens: false,
          clean_up_tokenization_spaces: false,
        },
      },
    ])
  })

  it("允许继续扫描后续样本并累计 mismatch 数量", async () => {
    const result = await compareFamilyAgainstSamples({
      family: "toy-family",
      stopOnFirstMismatch: false,
      samples: [
        {
          lineNumber: 1,
          id: "sample-1",
          text: "first",
        },
        {
          lineNumber: 2,
          id: "sample-2",
          text: "second",
        },
      ],
      tokkitEncode: async (input) => (input === "first" ? [1, 2] : [3, 4]),
      referenceEncode: (input) => (input === "first" ? [1, 9] : [3, 4]),
    })

    expect(result.ok).toBe(false)
    expect(result.checkedSamples).toBe(2)
    expect(result.mismatchCount).toBe(1)
    expect(result.mismatch).toMatchObject({
      lineNumber: 1,
      firstMismatchIndex: 1,
      actualToken: 2,
      expectedToken: 9,
    })
  })

  it("命中 reference 摘要缓存后不会再次调用官方 encode", async () => {
    const cacheRecords = new Map<number, { encodeLength: number; encodeHash: string; decodeHash: string | null }>()
    let referenceCalls = 0

    const first = await compareFamilyAgainstSamples({
      family: "toy-family",
      samples: [
        {
          lineNumber: 5,
          id: "sample-5",
          text: "cached",
        },
      ],
      tokkitEncode: async () => [7, 8, 9],
      referenceEncode: () => {
        referenceCalls += 1
        return [7, 8, 9]
      },
      referenceCache: {
        get(lineNumber: number) {
          return cacheRecords.get(lineNumber) ?? null
        },
        set(lineNumber: number, record: { encodeLength: number; encodeHash: string; decodeHash: string | null }) {
          cacheRecords.set(lineNumber, record)
        },
      },
    })

    const second = await compareFamilyAgainstSamples({
      family: "toy-family",
      samples: [
        {
          lineNumber: 5,
          id: "sample-5",
          text: "cached",
        },
      ],
      tokkitEncode: async () => [7, 8, 9],
      referenceEncode: () => {
        referenceCalls += 1
        return [7, 8, 9]
      },
      referenceCache: {
        get(lineNumber: number) {
          return cacheRecords.get(lineNumber) ?? null
        },
        set(lineNumber: number, record: { encodeLength: number; encodeHash: string; decodeHash: string | null }) {
          cacheRecords.set(lineNumber, record)
        },
      },
    })

    expect(first.ok).toBe(true)
    expect(first.cacheHits).toBe(0)
    expect(first.cacheMisses).toBe(1)
    expect(second.ok).toBe(true)
    expect(second.cacheHits).toBe(1)
    expect(second.cacheMisses).toBe(0)
    expect(referenceCalls).toBe(1)
  })
})
