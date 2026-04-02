/**
 * FineWeb2 真实数据对拍脚本。
 * 输入：仓库内的 FineWeb2 JSONL 样本、`packages/all` dist 产物和 vendor tokenizer 快照。
 * 输出：逐个 family 对拍官方 tokenizer 与当前实现的 encode / decode 结果，并打印摘要或 mismatch 报告。
 *
 * 预期行为：
 * - 不进入默认 `npm run test:run`。
 * - 默认只跑受控样本量，避免把 86MB 样本直接塞进常规测试链。
 * - 若缺少 `packages/all/dist`，会明确提示先运行 `npm run build`。
 */

import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { createInterface } from "node:readline"
import { execFileSync, spawn } from "node:child_process"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { brotliDecompressSync } from "node:zlib"
import { createHash } from "node:crypto"
import { PreTrainedTokenizer } from "@huggingface/transformers"

import { FAMILY_SPECS } from "./generate-builtins.mjs"

/** 仓库根目录。 */
const REPO_ROOT = process.cwd()

/** 默认 FineWeb2 样本路径。 */
const DEFAULT_FINEWEB2_PATH = resolve(REPO_ROOT, "test", "fineweb2_sample_10per.jsonl")

/** 默认起始行偏移。 */
const DEFAULT_START = 0

/** 默认采样条数。 */
const DEFAULT_LIMIT = 20

/** 默认允许参与对拍的最大文本长度，0 表示不设上限。 */
const DEFAULT_MAX_CHARS = 16384

/** mismatch 周围回显的 token 窗口大小。 */
const TOKEN_CONTEXT_RADIUS = 4

/** 默认是否在首个 mismatch 后立即停止。 */
const DEFAULT_CONTINUE_ON_MISMATCH = false

/** 默认是否执行 decode 对拍。 */
const DEFAULT_CHECK_DECODE = false

/** 默认并行 job 数量。 */
const DEFAULT_JOBS = 1

/** 默认 official reference backend。 */
const DEFAULT_REFERENCE_BACKEND = "js"

/** 默认目标 workspace 子包。 */
const DEFAULT_PACKAGE_DIR = "all"

/** Arcee Trinity 里用于 510 长度保护的数字分块 regex。 */
const DIGIT_CHUNK_510_PATTERN =
  String.raw`\p{Nd}{1,510}(?=(?>\p{Nd}{510})*(?:\P{Nd}|$))|\G\p{Nd}{510}`

/** Arcee Trinity 里用于千分组前导余数的 regex。 */
const DIGIT_LEADING_GROUP_PATTERN = String.raw`\A\p{Nd}{1,2}(?=\p{Nd}{3}+\z)`

/** Arcee Trinity 里用于连续三位数字分组的 regex。 */
const DIGIT_TRIPLE_GROUP_PATTERN = String.raw`\A\p{Nd}{3}|\G\p{Nd}{3}`

/** Python fast reference cache helper。 */
const PYTHON_REFERENCE_CACHE_SCRIPT = resolve(REPO_ROOT, "scripts", "fineweb2-reference-cache.py")

/** Python 可执行文件命令。 */
const PYTHON_EXECUTABLE = process.env.TOKKIT_REFERENCE_PYTHON || "python"

/** FineWeb2 reference 摘要缓存目录。 */
const DEFAULT_CACHE_DIRECTORY = resolve(REPO_ROOT, "tmp", "fineweb2-cache")

/** reference 摘要缓存格式版本。 */
const REFERENCE_CACHE_VERSION = 1

/**
 * 解析脚本 CLI 参数。
 * 输入：`process.argv.slice(2)` 形式的参数数组。
 * 输出：脚本运行所需的标准化配置对象。
 */
export function parseCliArgs(argv) {
  const options = {
    filePath: DEFAULT_FINEWEB2_PATH,
    families: null,
    start: DEFAULT_START,
    limit: DEFAULT_LIMIT,
    maxChars: DEFAULT_MAX_CHARS,
    json: false,
    continueOnMismatch: DEFAULT_CONTINUE_ON_MISMATCH,
    checkDecode: DEFAULT_CHECK_DECODE,
    jobs: DEFAULT_JOBS,
    referenceBackend: DEFAULT_REFERENCE_BACKEND,
    packageDir: DEFAULT_PACKAGE_DIR,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === "--file") {
      options.filePath = resolve(REPO_ROOT, readRequiredValue(argv, ++index, "--file"))
      continue
    }

    if (argument === "--families") {
      options.families = splitCsv(readRequiredValue(argv, ++index, "--families"))
      continue
    }

    if (argument === "--package") {
      options.packageDir = readRequiredValue(argv, ++index, "--package").trim()
      continue
    }

    if (argument === "--start") {
      options.start = parseNonNegativeInteger(readRequiredValue(argv, ++index, "--start"), "--start")
      continue
    }

    if (argument === "--limit") {
      options.limit = parseNonNegativeInteger(readRequiredValue(argv, ++index, "--limit"), "--limit")
      continue
    }

    if (argument === "--maxChars") {
      options.maxChars = parseNonNegativeInteger(
        readRequiredValue(argv, ++index, "--maxChars"),
        "--maxChars"
      )
      continue
    }

    if (argument === "--json") {
      options.json = true
      continue
    }

    if (argument === "--continueOnMismatch") {
      options.continueOnMismatch = true
      continue
    }

    if (argument === "--checkDecode") {
      options.checkDecode = true
      continue
    }

    if (argument === "--jobs") {
      options.jobs = parsePositiveInteger(readRequiredValue(argv, ++index, "--jobs"), "--jobs")
      continue
    }

    if (argument === "--referenceBackend") {
      options.referenceBackend = parseReferenceBackend(
        readRequiredValue(argv, ++index, "--referenceBackend"),
        "--referenceBackend"
      )
      continue
    }

    if (argument === "--help") {
      throw new Error(createHelpMessage())
    }

    throw new Error(`unknown argument: ${argument}`)
  }

  return options
}

/**
 * 从 FineWeb2 JSONL 收集受控样本。
 * 输入：JSONL 路径和采样配置。
 * 输出：包含样本列表、总行数和超长跳过计数的结果对象。
 */
export async function collectFinewebSamples(
  filePath,
  { start = DEFAULT_START, limit = DEFAULT_LIMIT, maxChars = DEFAULT_MAX_CHARS } = {}
) {
  const samples = []
  let totalLines = 0
  let skippedTooLong = 0
  let passedStart = 0
  const stream = createReadStream(filePath, { encoding: "utf8" })
  const lines = createInterface({
    input: stream,
    crlfDelay: Infinity,
  })

  try {
    for await (const line of lines) {
      totalLines += 1

      if (!line.trim()) {
        continue
      }

      if (totalLines <= start) {
        continue
      }

      const record = parseJsonlRecord(line, totalLines)

      if (maxChars > 0 && record.text.length > maxChars) {
        skippedTooLong += 1
        continue
      }

      samples.push({
        lineNumber: totalLines,
        id: record.id,
        text: record.text,
      })
      passedStart += 1

      if (limit > 0 && passedStart >= limit) {
        break
      }
    }
  } finally {
    lines.close()
    stream.destroy()
  }

  return {
    samples,
    skippedTooLong,
    totalLines,
  }
}

/**
 * 逐个样本对拍单个 family。
 * 输入：family 名称、样本列表与 encode/decode 回调。
 * 输出：包含通过摘要或首个 mismatch 细节的结果对象。
 */
export async function compareFamilyAgainstSamples({
  family,
  samples,
  tokkitEncode,
  referenceEncode,
  tokkitDecode,
  referenceDecode,
  stopOnFirstMismatch = true,
  referenceCache,
}) {
  const startedAt = performance.now()
  let checkedSamples = 0
  let totalExpectedTokens = 0
  let mismatchCount = 0
  let firstMismatch = null
  let cacheHits = 0
  let cacheMisses = 0

  for (const sample of samples) {
    const actualIds = await tokkitEncode(sample.text)
    const actualSummary = summarizeTokenIds(actualIds)
    const cachedRecord = referenceCache?.get(sample.lineNumber) ?? null
    let expectedIds = null
    let encodeMatchedByCache = false

    if (
      cachedRecord &&
      cachedRecord.encodeLength === actualSummary.encodeLength &&
      cachedRecord.encodeHash === actualSummary.encodeHash
    ) {
      encodeMatchedByCache = true
      cacheHits += 1
      totalExpectedTokens += cachedRecord.encodeLength
    } else {
      cacheMisses += 1
      expectedIds = referenceEncode(sample.text)
      totalExpectedTokens += expectedIds.length
      const mismatch = findTokenMismatch(actualIds, expectedIds)
      const expectedSummary = summarizeTokenIds(expectedIds)

      referenceCache?.set(sample.lineNumber, {
        encodeLength: expectedSummary.encodeLength,
        encodeHash: expectedSummary.encodeHash,
        decodeHash: cachedRecord?.decodeHash ?? null,
      })

      if (mismatch) {
        mismatchCount += 1
        firstMismatch ??= createEncodeMismatchReport(family, sample, actualIds, expectedIds, mismatch)

        if (stopOnFirstMismatch) {
          return {
            ok: false,
            family,
            checkedSamples: checkedSamples + 1,
            totalExpectedTokens,
            durationMs: roundNumber(performance.now() - startedAt),
            mismatchCount,
            cacheHits,
            cacheMisses,
            mismatch: firstMismatch,
          }
        }

        checkedSamples += 1
        continue
      }
    }

    checkedSamples += 1

    if (tokkitDecode && referenceDecode) {
      const actualText = await tokkitDecode(actualIds)
      const actualDecodeHash = hashText(actualText)
      const cachedDecodeHash = cachedRecord?.decodeHash ?? null

      if (encodeMatchedByCache && cachedDecodeHash && cachedDecodeHash === actualDecodeHash) {
        continue
      }

      const expectedText = referenceDecode(expectedIds ?? actualIds)
      const expectedDecodeHash = hashText(expectedText)

      referenceCache?.set(sample.lineNumber, {
        encodeLength: actualSummary.encodeLength,
        encodeHash: actualSummary.encodeHash,
        decodeHash: expectedDecodeHash,
      })

      if (actualText !== expectedText) {
        mismatchCount += 1
        firstMismatch ??= createDecodeMismatchReport(family, sample, actualText, expectedText)

        if (stopOnFirstMismatch) {
          return {
            ok: false,
            family,
            checkedSamples,
            totalExpectedTokens,
            durationMs: roundNumber(performance.now() - startedAt),
            mismatchCount,
            cacheHits,
            cacheMisses,
            mismatch: firstMismatch,
          }
        }
      }
    }
  }

  return {
    ok: mismatchCount === 0,
    family,
    checkedSamples,
    totalExpectedTokens,
    durationMs: roundNumber(performance.now() - startedAt),
    mismatchCount,
    cacheHits,
    cacheMisses,
    mismatch: firstMismatch,
  }
}

/**
 * 调用 Hugging Face 参考 tokenizer 的原始 decode。
 * 输入：参考 tokenizer 实例和 token ids。
 * 输出：关闭空格清理后的 decode 文本。
 */
export function decodeReferenceText(reference, ids) {
  return reference.decode(ids, {
    skip_special_tokens: false,
    clean_up_tokenization_spaces: false,
  })
}

/**
 * 运行脚本主流程。
 * 输入：CLI 参数数组。
 * 输出：最终摘要对象；若发现 mismatch 则抛错并在 stdout/stderr 打印报告。
 */
export async function main(argv = process.argv.slice(2)) {
  const options = parseCliArgs(argv)
  const tokkit = await importWorkspacePackageModule(options.packageDir)
  const supportedFamilies = new Set(tokkit.listSupportedFamilies())
  const familySpecs = resolveFamilySpecs(supportedFamilies, options.families, options.packageDir)
  const summary =
    options.jobs > 1 && familySpecs.length > 1
      ? await runParallelComparison(options, familySpecs)
      : await runSerialComparison(options, familySpecs, tokkit)

  emitSummary(summary, options.json)

  if (summary.results.some((result) => !result.ok)) {
    throw new Error("fineweb2 parity failed")
  }

  return summary
}

if (isDirectExecution()) {
  try {
    await main()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}

/**
 * 读取缺失值时报错。
 * 输入：参数数组、目标索引和 flag 名称。
 * 输出：flag 后面的值字符串。
 */
function readRequiredValue(argv, index, flagName) {
  const value = argv[index]

  if (value === undefined) {
    throw new Error(`missing value for ${flagName}`)
  }

  return value
}

/**
 * 把逗号分隔的 family 参数切成数组。
 * 输入：例如 `qwen3.5,glm-5` 这样的字符串。
 * 输出：去空白后的 family 名称数组。
 */
function splitCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * 解析非负整数参数。
 * 输入：参数值字符串和 flag 名称。
 * 输出：非负整数。
 */
function parseNonNegativeInteger(value, flagName) {
  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flagName} must be a non-negative integer`)
  }

  return parsed
}

/**
 * 解析正整数参数。
 * 输入：参数值字符串和 flag 名称。
 * 输出：大于等于 1 的整数。
 */
function parsePositiveInteger(value, flagName) {
  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${flagName} must be a positive integer`)
  }

  return parsed
}

/**
 * 解析单行 FineWeb2 JSONL 记录。
 * 输入：原始 JSONL 行内容和真实行号。
 * 输出：标准化后的 `{ id, text }` 记录对象。
 */
function parseJsonlRecord(line, lineNumber) {
  const parsed = JSON.parse(line)

  if (typeof parsed?.text !== "string") {
    throw new Error(`line ${lineNumber} does not contain a string text field`)
  }

  return {
    id: typeof parsed.id === "string" ? parsed.id : null,
    text: parsed.text,
  }
}

/**
 * 定位 token 序列的首个差异位置。
 * 输入：实际 ids 和参考 ids。
 * 输出：首个差异索引和对应 token；若完全一致则返回 null。
 */
function findTokenMismatch(actualIds, expectedIds) {
  const maxIndex = Math.max(actualIds.length, expectedIds.length)

  for (let index = 0; index < maxIndex; index += 1) {
    if (actualIds[index] !== expectedIds[index]) {
      return {
        firstMismatchIndex: index,
        actualToken: actualIds[index] ?? null,
        expectedToken: expectedIds[index] ?? null,
      }
    }
  }

  return null
}

/**
 * 生成 encode 差异报告。
 * 输入：family、样本、实际 ids、参考 ids 和首个差异描述。
 * 输出：便于定位问题的 encode mismatch 对象。
 */
function createEncodeMismatchReport(family, sample, actualIds, expectedIds, mismatch) {
  const windowStart = Math.max(0, mismatch.firstMismatchIndex - TOKEN_CONTEXT_RADIUS)
  const windowEnd = mismatch.firstMismatchIndex + TOKEN_CONTEXT_RADIUS + 1

  return {
    kind: "encode",
    family,
    lineNumber: sample.lineNumber,
    id: sample.id,
    inputLength: sample.text.length,
    textPreview: createTextPreview(sample.text),
    firstMismatchIndex: mismatch.firstMismatchIndex,
    actualToken: mismatch.actualToken,
    expectedToken: mismatch.expectedToken,
    actualLength: actualIds.length,
    expectedLength: expectedIds.length,
    actualWindow: actualIds.slice(windowStart, windowEnd),
    expectedWindow: expectedIds.slice(windowStart, windowEnd),
  }
}

/**
 * 生成 decode 差异报告。
 * 输入：family、样本和 decode 后的两侧文本。
 * 输出：便于定位问题的 decode mismatch 对象。
 */
function createDecodeMismatchReport(family, sample, actualText, expectedText) {
  return {
    kind: "decode",
    family,
    lineNumber: sample.lineNumber,
    id: sample.id,
    inputLength: sample.text.length,
    textPreview: createTextPreview(sample.text),
    actualDecodedPreview: createTextPreview(actualText),
    expectedDecodedPreview: createTextPreview(expectedText),
  }
}

/**
 * 把长文本压成适合日志查看的单行预览。
 * 输入：原始文本。
 * 输出：压缩空白并截断后的短预览字符串。
 */
function createTextPreview(text) {
  const normalized = text.replace(/\s+/g, " ").trim()
  return normalized.length <= 160 ? normalized : `${normalized.slice(0, 157)}...`
}

/**
 * 加载 `packages/all` 的 dist 入口。
 * 输入：无。
 * 输出：全量包 dist 模块。
 */
async function importWorkspacePackageModule(packageDir) {
  const entryPath = resolve(REPO_ROOT, "packages", packageDir, "dist", "index.js")

  if (!existsSync(entryPath)) {
    throw new Error(`missing build output: ${entryPath}; run npm run build first`)
  }

  return import(pathToFileURL(entryPath).href)
}

/**
 * 从 vendor 快照构造 Hugging Face 参考 tokenizer。
 * 输入：相对仓库根目录的 `.json.br` 路径。
 * 输出：可直接用于 encode / decode 的 `PreTrainedTokenizer`。
 */
function loadReferenceTokenizer(sourcePath) {
  const compressed = readFileSync(resolve(REPO_ROOT, sourcePath))
  const asset = normalizeReferenceAssetForJavaScript(
    JSON.parse(brotliDecompressSync(compressed).toString("utf8"))
  )
  return new PreTrainedTokenizer(
    {
      ...asset,
      normalizer: asset.normalizer ?? null,
      pre_tokenizer: asset.pre_tokenizer ?? null,
      post_processor: asset.post_processor ?? null,
      decoder: asset.decoder ?? null,
    },
    {}
  )
}

/**
 * 把参考 tokenizer 里的 Rust regex 方言降级成 JS 可解析的等价形式。
 * 输入：原始 tokenizer 资产。
 * 输出：可交给 `@huggingface/transformers` JS 参考实现装载的兼容资产。
 */
function normalizeReferenceAssetForJavaScript(asset) {
  return normalizeReferenceValue(asset)
}

/**
 * 递归归一化参考资产里的 regex 方言。
 * 输入：任意 JSON 值。
 * 输出：替换了特殊 regex 的等价新值。
 */
function normalizeReferenceValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeReferenceValue(entry))
  }

  if (!value || typeof value !== "object") {
    return value
  }

  const normalizedEntries = Object.entries(value).map(([key, entry]) => {
    if (key === "Regex" && typeof entry === "string") {
      return [key, normalizeReferenceRegex(entry)]
    }

    return [key, normalizeReferenceValue(entry)]
  })

  return Object.fromEntries(normalizedEntries)
}

/**
 * 把 JS 不支持的 Rust regex 改写成当前参考测试可接受的等价形式。
 * 输入：原始 regex 字符串。
 * 输出：JS 可解析的 regex 字符串。
 */
function normalizeReferenceRegex(pattern) {
  if (pattern === DIGIT_CHUNK_510_PATTERN) {
    return "$^"
  }

  if (pattern === DIGIT_LEADING_GROUP_PATTERN) {
    return String.raw`^\p{Nd}{1,2}(?=(?:\p{Nd}{3})+$)`
  }

  if (pattern === DIGIT_TRIPLE_GROUP_PATTERN) {
    return String.raw`\p{Nd}{3}`
  }

  return pattern.replace(/\(\?>/g, "(?:").replace(/\\A/g, "^").replace(/\\z/g, "$")
}

/**
 * 串行执行给定 family 清单的对拍。
 * 输入：CLI 选项、目标 family specs 和已加载的全量包模块。
 * 输出：当前这批 family 的汇总摘要。
 */
async function runSerialComparison(options, familySpecs, tokkit) {
  const { samples, skippedTooLong, totalLines } = await collectFinewebSamples(options.filePath, options)

  if (samples.length === 0) {
    throw new Error("no FineWeb2 samples selected; adjust --start, --limit or --maxChars")
  }

  const results = []

  for (const spec of familySpecs) {
    const referenceCache = createReferenceCacheStore({
      family: spec.family,
      sourcePath: spec.source,
      sampleFilePath: options.filePath,
    })
    prewarmReferenceCache({
      options,
      spec,
      samples,
      referenceCache,
    })
    let lazyReference = null
    const getReference = () => {
      if (!lazyReference) {
        lazyReference = loadReferenceTokenizer(spec.source)
      }

      return lazyReference
    }
    const familyResult = await compareFamilyAgainstSamples({
      family: spec.family,
      samples,
      tokkitEncode: (input) =>
        tokkit.encode(input, spec.family, {
          addSpecialTokens: false,
        }),
      referenceEncode: (input) => getReference().encode(input, { add_special_tokens: false }),
      tokkitDecode: options.checkDecode ? (ids) => tokkit.decode(ids, spec.family) : undefined,
      referenceDecode: options.checkDecode ? (ids) => decodeReferenceText(getReference(), ids) : undefined,
      stopOnFirstMismatch: !options.continueOnMismatch,
      referenceCache,
    })
    referenceCache.save()

    results.push(familyResult)

    if (!familyResult.ok && !options.continueOnMismatch) {
      break
    }
  }

  return buildSummary(options, {
    sampledLines: {
      totalLines,
      selected: samples.length,
      skippedTooLong,
    },
    familySpecs,
    results,
  })
}

/**
 * 并行执行给定 family 清单的对拍。
 * 输入：CLI 选项和目标 family specs。
 * 输出：合并所有子进程摘要后的总摘要。
 */
async function runParallelComparison(options, familySpecs) {
  const groups = splitFamilySpecs(familySpecs, Math.min(options.jobs, familySpecs.length))
  const childSummaries = await Promise.all(
    groups.map((group) => runChildComparison(options, group.map((spec) => spec.family)))
  )
  const sampledLines = childSummaries[0]?.sampledLines

  if (!sampledLines) {
    throw new Error("parallel comparison produced no child summaries")
  }

  const resultByFamily = new Map()

  for (const childSummary of childSummaries) {
    if (!hasSameSampleWindow(sampledLines, childSummary.sampledLines)) {
      throw new Error("parallel comparison children produced different sample windows")
    }

    for (const result of childSummary.results) {
      resultByFamily.set(result.family, result)
    }
  }

  const results = familySpecs.map((spec) => resultByFamily.get(spec.family)).filter(Boolean)

  return buildSummary(options, {
    sampledLines,
    familySpecs,
    results,
  })
}

/**
 * 启动单个子进程执行一组 family 对拍。
 * 输入：父进程选项和当前分组的 family 名称列表。
 * 输出：子进程产出的 JSON 摘要对象。
 */
function runChildComparison(options, families) {
  const scriptPath = resolve(REPO_ROOT, "scripts", "fineweb2-compare.mjs")
  const args = [
    scriptPath,
    "--file",
    options.filePath,
    "--start",
    String(options.start),
    "--limit",
    String(options.limit),
    "--maxChars",
    String(options.maxChars),
    "--families",
    families.join(","),
    "--json",
  ]

  if (options.continueOnMismatch) {
    args.push("--continueOnMismatch")
  }

  if (options.checkDecode) {
    args.push("--checkDecode")
  }

  if (options.referenceBackend !== DEFAULT_REFERENCE_BACKEND) {
    args.push("--referenceBackend", options.referenceBackend)
  }

  if (options.packageDir !== DEFAULT_PACKAGE_DIR) {
    args.push("--package", options.packageDir)
  }

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, args, {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })
    child.on("error", rejectPromise)
    child.on("close", (code) => {
      if (!stdout.trim()) {
        rejectPromise(
          new Error(`parallel child produced no JSON summary (exit ${code ?? "null"}): ${stderr}`)
        )
        return
      }

      try {
        resolvePromise(JSON.parse(stdout))
      } catch (error) {
        rejectPromise(
          new Error(
            `failed to parse parallel child summary: ${
              error instanceof Error ? error.message : String(error)
            }\n${stderr}`
          )
        )
      }
    })
  })
}

/**
 * 把 family specs 均匀拆成多个分组。
 * 输入：family specs 数组和目标 job 数。
 * 输出：按轮询分配的 family 分组数组。
 */
function splitFamilySpecs(familySpecs, jobs) {
  const groups = Array.from({ length: jobs }, () => [])

  for (let index = 0; index < familySpecs.length; index += 1) {
    groups[index % jobs].push(familySpecs[index])
  }

  return groups.filter((group) => group.length > 0)
}

/**
 * 构造统一的摘要对象。
 * 输入：CLI 选项和局部执行结果。
 * 输出：标准化后的完整摘要。
 */
function buildSummary(options, { sampledLines, familySpecs, results }) {
  return {
    filePath: options.filePath,
    sampledLines,
    options: {
      packageDir: options.packageDir,
      start: options.start,
      limit: options.limit,
      maxChars: options.maxChars,
        continueOnMismatch: options.continueOnMismatch,
        checkDecode: options.checkDecode,
        jobs: options.jobs,
        referenceBackend: options.referenceBackend,
      },
      comparedFamilies: familySpecs.map((spec) => spec.family),
      results,
  }
}

/**
 * 判断两个摘要的采样窗口是否一致。
 * 输入：两份 sampledLines 摘要。
 * 输出：一致时返回 true。
 */
function hasSameSampleWindow(left, right) {
  return (
    left.totalLines === right.totalLines &&
    left.selected === right.selected &&
    left.skippedTooLong === right.skippedTooLong
  )
}

/**
 * 基于总包当前实际支持的 family 解析本轮要对拍的清单。
 * 输入：总包支持的 family 集合和可选的 CLI family 过滤。
 * 输出：当前轮次需要对拍的 `FAMILY_SPECS` 子集。
 */
export function resolveFamilySpecs(supportedFamilies, selectedFamilies, packageDir = DEFAULT_PACKAGE_DIR) {
  const requested = selectedFamilies ? new Set(selectedFamilies) : null
  const specs = FAMILY_SPECS.filter((spec) => {
    if (!supportedFamilies.has(spec.family)) {
      return false
    }

    return requested ? requested.has(spec.family) : true
  })

  if (requested) {
    for (const family of requested) {
      if (!supportedFamilies.has(family)) {
        throw new Error(`unsupported family for packages/${packageDir}: ${family}`)
      }
    }
  }

  if (specs.length === 0) {
    throw new Error("no family specs selected for comparison")
  }

  return specs
}

/**
 * 按输出模式打印摘要。
 * 输入：摘要对象和是否使用 JSON 输出。
 * 输出：打印到 stdout。
 */
function emitSummary(summary, asJson) {
  if (asJson) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  console.log(
    [
      `FineWeb2 parity checked ${summary.results.length} families`,
      `samples=${summary.sampledLines.selected}`,
      `skippedTooLong=${summary.sampledLines.skippedTooLong}`,
      `start=${summary.options.start}`,
      `limit=${summary.options.limit}`,
      `maxChars=${summary.options.maxChars}`,
      `package=${summary.options.packageDir}`,
      `continueOnMismatch=${summary.options.continueOnMismatch}`,
      `checkDecode=${summary.options.checkDecode}`,
      `jobs=${summary.options.jobs}`,
    ].join(" | ")
  )

  for (const result of summary.results) {
    if (result.ok) {
      console.log(
        `OK ${result.family} samples=${result.checkedSamples} tokens=${result.totalExpectedTokens} durationMs=${result.durationMs} cacheHits=${result.cacheHits} cacheMisses=${result.cacheMisses}`
      )
      continue
    }

    console.log(
      `FAIL ${result.family} mismatches=${result.mismatchCount} kind=${result.mismatch?.kind} line=${result.mismatch?.lineNumber} id=${result.mismatch?.id ?? "null"} cacheHits=${result.cacheHits} cacheMisses=${result.cacheMisses}`
    )
    console.log(JSON.stringify(result.mismatch, null, 2))
  }
}

/**
 * 把数字统一保留两位小数。
 * 输入：任意 number。
 * 输出：保留两位小数后的 number。
 */
function roundNumber(value) {
  return Number(value.toFixed(2))
}

/**
 * 对 token id 序列做稳定摘要。
 * 输入：token id 数组。
 * 输出：用于 cache 命中的长度与哈希。
 */
function summarizeTokenIds(ids) {
  return {
    encodeLength: ids.length,
    encodeHash: hashTokenIds(ids),
  }
}

/**
 * 计算 token id 数组的稳定哈希。
 * 输入：token id 数组。
 * 输出：基于二进制 Uint32 表示的 SHA-256 字符串。
 */
function hashTokenIds(ids) {
  return createHash("sha256")
    .update(Buffer.from(Uint32Array.from(ids).buffer))
    .digest("hex")
}

/**
 * 计算文本内容的稳定哈希。
 * 输入：任意字符串。
 * 输出：UTF-8 文本的 SHA-256 字符串。
 */
function hashText(text) {
  return createHash("sha256").update(text, "utf8").digest("hex")
}

/**
 * 创建单个 family 的 reference 摘要缓存。
 * 输入：family 名称、source 快照路径和样本文件路径。
 * 输出：可读写并可落盘的缓存对象。
 */
function createReferenceCacheStore({ family, sourcePath, sampleFilePath }) {
  mkdirSync(DEFAULT_CACHE_DIRECTORY, { recursive: true })

  const sourceFingerprint = fingerprintFileState(resolve(REPO_ROOT, sourcePath))
  const sampleFingerprint = fingerprintFileState(sampleFilePath)
  const cachePath = resolve(
    DEFAULT_CACHE_DIRECTORY,
    `${sanitizeCacheSegment(family)}-${sourceFingerprint}-${sampleFingerprint}.json`
  )
  const payload = {
    version: REFERENCE_CACHE_VERSION,
    family,
    sourcePath,
    sampleFilePath,
    records: {},
  }

  if (existsSync(cachePath)) {
    try {
      const parsed = JSON.parse(readFileSync(cachePath, "utf8"))
      if (parsed?.version === REFERENCE_CACHE_VERSION && parsed?.records) {
        payload.records = parsed.records
      }
    } catch {
      // 缓存损坏时直接丢弃并重建，不影响本轮对拍。
    }
  }

  let dirty = false

  return {
    get(lineNumber) {
      return payload.records[String(lineNumber)] ?? null
    },
    set(lineNumber, record) {
      const key = String(lineNumber)
      const previous = payload.records[key]
      if (
        previous?.encodeLength === record.encodeLength &&
        previous?.encodeHash === record.encodeHash &&
        previous?.decodeHash === record.decodeHash
      ) {
        return
      }

      payload.records[key] = record
      dirty = true
    },
    save() {
      if (!dirty) {
        return
      }

      writeFileSync(cachePath, JSON.stringify(payload), "utf8")
      dirty = false
    },
  }
}

/**
 * 当使用 Python fast backend 时，先把 reference 摘要缓存预热到本地。
 * 输入：CLI 选项、目标 family spec、当前样本和缓存对象。
 * 输出：无；必要时同步写入缓存。
 */
function prewarmReferenceCache({ options, spec, samples, referenceCache }) {
  if (options.referenceBackend !== "python") {
    return
  }

  if (samples.every((sample) => hasCompleteReferenceCacheRecord(referenceCache.get(sample.lineNumber), options))) {
    return
  }

  const stdout = execFileSync(
    PYTHON_EXECUTABLE,
    [
      PYTHON_REFERENCE_CACHE_SCRIPT,
      "--source",
      spec.source,
      "--file",
      options.filePath,
      "--start",
      String(options.start),
      "--limit",
      String(options.limit),
      "--maxChars",
      String(options.maxChars),
      ...(options.checkDecode ? ["--checkDecode"] : []),
    ],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }
  )
  const payload = JSON.parse(stdout)

  for (const [lineNumber, record] of Object.entries(payload.records ?? {})) {
    referenceCache.set(Number(lineNumber), {
      encodeLength: record.encodeLength,
      encodeHash: record.encodeHash,
      decodeHash: record.decodeHash,
    })
  }

  referenceCache.save()
}

/**
 * 判断单条缓存记录是否足够覆盖当前对拍模式。
 * 输入：缓存记录和 CLI 选项。
 * 输出：足够时返回 true。
 */
function hasCompleteReferenceCacheRecord(record, options) {
  return Boolean(
    record &&
      typeof record.encodeLength === "number" &&
      typeof record.encodeHash === "string" &&
      (!options.checkDecode || typeof record.decodeHash === "string")
  )
}

/**
 * 为缓存文件生成稳定的文件状态指纹。
 * 输入：本地文件路径。
 * 输出：基于路径、大小和修改时间的短哈希。
 */
function fingerprintFileState(filePath) {
  const stat = statSync(filePath)
  return createHash("sha1")
    .update(
      JSON.stringify({
        filePath: resolve(filePath),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      })
    )
    .digest("hex")
    .slice(0, 12)
}

/**
 * 把 cache 文件名片段规整成安全字符串。
 * 输入：family 名称等任意标识。
 * 输出：只包含文件名安全字符的片段。
 */
function sanitizeCacheSegment(value) {
  return String(value).replace(/[^A-Za-z0-9._-]+/g, "_")
}

/**
 * 生成帮助信息。
 * 输入：无。
 * 输出：脚本用法说明字符串。
 */
function createHelpMessage() {
  return [
    "Usage: node scripts/fineweb2-compare.mjs [options]",
    "",
    "Options:",
    "  --file <path>         FineWeb2 JSONL path",
    "  --package <name>      Workspace package dir under packages/, default: all",
    "  --families <csv>      Comma-separated family list",
    "  --start <n>           Raw line offset to start from",
    "  --limit <n>           Max number of samples to compare; 0 means unlimited",
    "  --maxChars <n>        Skip samples longer than n chars; 0 means unlimited",
    "  --json                Print machine-readable JSON summary",
    "  --continueOnMismatch  Keep scanning all families and samples after mismatches",
    "  --checkDecode         Also compare decode output after encode parity passes",
    "  --jobs <n>            Split families across n child processes",
    "  --referenceBackend    Official reference backend: js | python",
    "  --help                Show this help message",
  ].join("\n")
}

/**
 * 解析 official reference backend。
 * 输入：用户传入的 backend 字符串。
 * 输出：标准化后的 backend 名称。
 */
function parseReferenceBackend(value, argumentName) {
  if (value === "js" || value === "python") {
    return value
  }

  throw new Error(`${argumentName} must be one of: js, python`)
}

/**
 * 判断脚本是否被直接执行。
 * 输入：无。
 * 输出：直接运行脚本时返回 true。
 */
function isDirectExecution() {
  return process.argv[1] ? resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false
}
