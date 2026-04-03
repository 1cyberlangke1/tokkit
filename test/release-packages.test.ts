import { describe, expect, it, vi } from "vitest"

import {
  extractFailedPackages,
  isAlreadyPublishedVersionError,
  isRateLimitedPublishError,
  mapChangedFilesToWorkspaceDirs,
  publishWorkspacePackage,
  sortPackagesForPublish,
} from "../scripts/release-packages.mjs"

describe("release-packages", () => {
  it("识别 npm 已发布版本导致的 403", () => {
    const output = `
🦋  info Publishing "@cyberlangke/tokkit-pleias" at "1.11.0"
🦋  error an error occurred while publishing @cyberlangke/tokkit-pleias: E403 403 Forbidden - PUT https://registry.npmjs.org/@cyberlangke%2ftokkit-pleias - You cannot publish over the previously published versions: 1.11.0.
🦋  error packages failed to publish:
🦋  @cyberlangke/tokkit-pleias@1.11.0
`

    expect(isAlreadyPublishedVersionError(output)).toBe(true)
    expect(extractFailedPackages(output)).toEqual([
      { name: "@cyberlangke/tokkit-pleias", version: "1.11.0" },
    ])
  })

  it("识别 npm 限流导致的发布失败", () => {
    const output = `
🦋  error an error occurred while publishing @cyberlangke/tokkit-swiss-ai: E429 429 Too Many Requests - PUT https://registry.npmjs.org/@cyberlangke%2ftokkit-swiss-ai - Could not publish, as user undefined: rate limited exceeded
🦋  error packages failed to publish:
🦋  @cyberlangke/tokkit-swiss-ai@1.11.0
`

    expect(isRateLimitedPublishError(output)).toBe(true)
    expect(extractFailedPackages(output)).toEqual([
      { name: "@cyberlangke/tokkit-swiss-ai", version: "1.11.0" },
    ])
  })

  it("没有失败摘要时返回空列表", () => {
    const output = `
🦋  info nothing to publish
`

    expect(extractFailedPackages(output)).toEqual([])
  })

  it("把变更文件映射到 workspace 目录", () => {
    expect(
      mapChangedFilesToWorkspaceDirs([
        "README.md",
        "packages/baidu/src/index.ts",
        "packages/all/src/index.ts",
        "packages/baidu/package.json",
        "test/workspace.test.ts",
      ]),
    ).toEqual(["all", "baidu"])
  })

  it("按内部依赖顺序发布 workspace 包", () => {
    const ordered = sortPackagesForPublish([
      {
        dirName: "all",
        name: "@cyberlangke/tokkit",
        version: "1.11.0",
        internalDependencies: ["@cyberlangke/tokkit-baidu", "@cyberlangke/tokkit-core"],
      },
      {
        dirName: "core",
        name: "@cyberlangke/tokkit-core",
        version: "1.11.0",
        internalDependencies: [],
      },
      {
        dirName: "baidu",
        name: "@cyberlangke/tokkit-baidu",
        version: "1.11.0",
        internalDependencies: ["@cyberlangke/tokkit-core"],
      },
    ])

    expect(ordered.map((entry) => entry.name)).toEqual([
      "@cyberlangke/tokkit-core",
      "@cyberlangke/tokkit-baidu",
      "@cyberlangke/tokkit",
    ])
  })

  it("单包发布遇到限流时会等待并重试", async () => {
    const limitedOutput = `
🦋  error an error occurred while publishing @cyberlangke/tokkit-swiss-ai: E429 429 Too Many Requests - PUT https://registry.npmjs.org/@cyberlangke%2ftokkit-swiss-ai - Could not publish, as user undefined: rate limited exceeded
🦋  error packages failed to publish:
🦋  @cyberlangke/tokkit-swiss-ai@1.11.0
`
    const sleepCalls: number[] = []
    const runNpm = vi
      .fn()
      .mockResolvedValueOnce({ code: 1, output: limitedOutput })
      .mockResolvedValueOnce({ code: 0, output: "published" })

    const result = await publishWorkspacePackage(
      {
        dirName: "swiss-ai",
        name: "@cyberlangke/tokkit-swiss-ai",
        version: "1.11.0",
        internalDependencies: [],
      },
      {
        runNpm,
        rateLimitAttempts: 3,
        rateLimitDelayMs: 1234,
        sleep: async (ms: number) => {
          sleepCalls.push(ms)
        },
      },
    )

    expect(result.ok).toBe(true)
    expect(runNpm).toHaveBeenCalledTimes(2)
    expect(sleepCalls).toEqual([1234])
  })

  it("单包发布遇到已发布冲突时会做可见性确认", async () => {
    const output = `
🦋  error an error occurred while publishing @cyberlangke/tokkit-pleias: E403 403 Forbidden - PUT https://registry.npmjs.org/@cyberlangke%2ftokkit-pleias - You cannot publish over the previously published versions: 1.11.0.
🦋  error packages failed to publish:
🦋  @cyberlangke/tokkit-pleias@1.11.0
`
    const verifyPublished = vi.fn().mockResolvedValue(true)

    const result = await publishWorkspacePackage(
      {
        dirName: "pleias",
        name: "@cyberlangke/tokkit-pleias",
        version: "1.11.0",
        internalDependencies: [],
      },
      {
        runNpm: vi.fn().mockResolvedValue({ code: 1, output }),
        verifyPublished,
        sleep: async () => {},
      },
    )

    expect(result.ok).toBe(true)
    expect(verifyPublished).toHaveBeenCalledWith([
      {
        dirName: "pleias",
        name: "@cyberlangke/tokkit-pleias",
        version: "1.11.0",
        internalDependencies: [],
      },
    ])
  })
})
