/**
 * Family 子包行为测试。
 * 输入：packages 下各子包的 src/index.ts 模块。
 * 输出：验证各 family 包只注册自己的模型，全家桶包注册全部模型。
 */

import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

/** 当前测试文件所在目录。 */
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))

/** 仓库根目录。 */
const REPO_ROOT = resolve(CURRENT_DIR, "..")

/**
 * 动态导入本地 TypeScript 模块。
 * 输入：相对仓库根目录的模块路径。
 * 输出：对应模块的导出对象。
 */
async function importModule(relativePath: string) {
  const fullPath = resolve(REPO_ROOT, relativePath)
  expect(existsSync(fullPath)).toBe(true)
  return import(pathToFileURL(fullPath).href)
}

describe("family packages", () => {
  it("qwen 包只注册 qwen 系列 family", async () => {
    const core = await importModule("packages/core/src/index.ts")
    const qwen = await importModule("packages/qwen/src/index.ts")

    core.resetRegistry()
    qwen.registerBuiltins()

    expect(core.listSupportedFamilies().sort()).toEqual(["qwen3-coder-next", "qwen3.5"].sort())
    expect(core.listSupportedModels()).toEqual(
      expect.arrayContaining([
        "Qwen/Qwen3.5-0.8B",
        "Qwen/Qwen3.5-27B",
        "Qwen/Qwen3.5-397B-A17B",
        "Qwen/Qwen3-Coder-Next",
      ])
    )
  })

  it("deepseek 包只注册 deepseek 系列 family", async () => {
    const core = await importModule("packages/core/src/index.ts")
    const deepseek = await importModule("packages/deepseek/src/index.ts")

    core.resetRegistry()
    deepseek.registerBuiltins()

    expect(core.listSupportedFamilies().sort()).toEqual(["deepseek-v3.1", "deepseek-v3.2"].sort())
    expect(core.listSupportedModels()).toEqual(
      expect.arrayContaining(["deepseek-ai/DeepSeek-V3.1", "deepseek-ai/DeepSeek-V3.2"])
    )
  })

  it("全家桶包注册全部内置 family", async () => {
    const all = await importModule("packages/all/src/index.ts")

    all.resetRegistry()
    all.registerBuiltins()

    expect(all.listSupportedFamilies().sort()).toEqual(
      [
        "deepseek-v3.1",
        "deepseek-v3.2",
        "glm-4.7",
        "glm-5",
        "qwen3-coder-next",
        "qwen3.5",
        "step-3.5-flash",
      ].sort()
    )
  })
})
