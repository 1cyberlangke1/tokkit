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
  { directory: "core", packageName: "@cyberlangke/tokkit-core", license: "MIT" },
  { directory: "tiiuae", packageName: "@cyberlangke/tokkit-tiiuae", license: "Apache-2.0" },
  { directory: "eleutherai", packageName: "@cyberlangke/tokkit-eleutherai", license: "Apache-2.0" },
  {
    directory: "meituan-longcat",
    packageName: "@cyberlangke/tokkit-meituan-longcat",
    license: "MIT",
  },
  { directory: "xiaomi-mimo", packageName: "@cyberlangke/tokkit-xiaomi-mimo", license: "MIT" },
  { directory: "microsoft", packageName: "@cyberlangke/tokkit-microsoft", license: "MIT" },
  { directory: "mistral", packageName: "@cyberlangke/tokkit-mistral", license: "Apache-2.0" },
  { directory: "allenai", packageName: "@cyberlangke/tokkit-allenai", license: "Apache-2.0" },
  {
    directory: "ibm-granite",
    packageName: "@cyberlangke/tokkit-ibm-granite",
    license: "Apache-2.0",
  },
  { directory: "openbmb", packageName: "@cyberlangke/tokkit-openbmb", license: "Apache-2.0" },
  { directory: "qwen", packageName: "@cyberlangke/tokkit-qwen", license: "Apache-2.0" },
  { directory: "deepseek", packageName: "@cyberlangke/tokkit-deepseek", license: "MIT" },
  { directory: "glm", packageName: "@cyberlangke/tokkit-glm", license: "MIT" },
  { directory: "step", packageName: "@cyberlangke/tokkit-step", license: "Apache-2.0" },
  { directory: "all", packageName: "@cyberlangke/tokkit", license: "MIT" },
] as const

describe("workspace layout", () => {
  it("根 package.json 已切到 npm workspaces", () => {
    const packageJsonPath = resolve(REPO_ROOT, "package.json")
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      private?: boolean
      workspaces?: string[]
      scripts?: Record<string, string>
    }

    expect(packageJson.private).toBe(true)
    expect(packageJson.workspaces).toEqual(["packages/*"])
  })

  it("根 package.json 提供 Hugging Face 对拍 benchmark 脚本", () => {
    const packageJsonPath = resolve(REPO_ROOT, "package.json")
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>
    }
    const benchmarkScriptPath = resolve(REPO_ROOT, "scripts", "benchmark-hf.mjs")

    expect(packageJson.scripts?.["benchmark:hf"]).toBe("node scripts/benchmark-hf.mjs")
    expect(existsSync(benchmarkScriptPath)).toBe(true)
  })

  it("存在 core、family、all 子包，并且包名、协议与版权文件正确", () => {
    for (const { directory, packageName, license } of EXPECTED_PACKAGES) {
      const packageRoot = resolve(REPO_ROOT, "packages", directory)
      const packageJsonPath = resolve(packageRoot, "package.json")
      const readmePath = resolve(packageRoot, "README.md")
      const licensePath = resolve(packageRoot, "LICENSE")
      const copyrightPath = resolve(packageRoot, "COPYRIGHT")

      expect(existsSync(packageRoot)).toBe(true)
      expect(existsSync(packageJsonPath)).toBe(true)
      expect(existsSync(readmePath)).toBe(true)
      expect(existsSync(licensePath)).toBe(true)
      expect(existsSync(copyrightPath)).toBe(true)

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        name?: string
        license?: string
        files?: string[]
        publishConfig?: {
          access?: string
        }
      }

      expect(packageJson.name).toBe(packageName)
      expect(packageJson.license).toBe(license)
      expect(packageJson.files).toEqual(expect.arrayContaining(["dist", "COPYRIGHT"]))
      expect(packageJson.publishConfig?.access).toBe("public")
    }
  })
})
