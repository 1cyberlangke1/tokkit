/**
 * Monorepo workspace 结构测试。
 * 输入：仓库根目录下的 package 配置与 packages 目录结构。
 * 输出：验证多包 workspace 和各子包 manifest 是否存在且命名正确。
 */

import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

/** 当前测试文件所在目录。 */
const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))

/** 仓库根目录。 */
const REPO_ROOT = resolve(CURRENT_DIR, "..")

/** 期望存在的 workspace 子包定义。 */
const EXPECTED_PACKAGES = [
  ["core", "@cyberlangke/tokkit-core"],
  ["qwen", "@cyberlangke/tokkit-qwen"],
  ["deepseek", "@cyberlangke/tokkit-deepseek"],
  ["glm", "@cyberlangke/tokkit-glm"],
  ["step", "@cyberlangke/tokkit-step"],
  ["all", "@cyberlangke/tokkit"],
] as const

describe("workspace layout", () => {
  it("根 package.json 已切到 npm workspaces", () => {
    const packageJsonPath = resolve(REPO_ROOT, "package.json")
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      private?: boolean
      workspaces?: string[]
    }

    expect(packageJson.private).toBe(true)
    expect(packageJson.workspaces).toEqual(["packages/*"])
  })

  it("存在 core、family、all 子包，并且包名正确", () => {
    for (const [directory, packageName] of EXPECTED_PACKAGES) {
      const packageRoot = resolve(REPO_ROOT, "packages", directory)
      const packageJsonPath = resolve(packageRoot, "package.json")
      const readmePath = resolve(packageRoot, "README.md")

      expect(existsSync(packageRoot)).toBe(true)
      expect(existsSync(packageJsonPath)).toBe(true)
      expect(existsSync(readmePath)).toBe(true)

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        name?: string
        publishConfig?: {
          access?: string
        }
      }

      expect(packageJson.name).toBe(packageName)
      expect(packageJson.publishConfig?.access).toBe("public")
    }
  })
})
