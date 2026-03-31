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

/**
 * 单个 workspace 包的期望元数据。
 * 输入：包目录、包名、协议、聚合归属和额外发布文件要求。
 * 输出：供结构测试复用的统一断言配置。
 */
type ExpectedPackage = {
  directory: string
  packageName: string
  license: string
  includedInAll: boolean
  requiredFiles?: readonly string[]
}

/** 期望存在的 workspace 子包定义。 */
const EXPECTED_PACKAGES = [
  {
    directory: "core",
    packageName: "@cyberlangke/tokkit-core",
    license: "MIT",
    includedInAll: false,
  },
  {
    directory: "01-ai",
    packageName: "@cyberlangke/tokkit-01-ai",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "minimax",
    packageName: "@cyberlangke/tokkit-minimax",
    license: "SEE LICENSE IN LICENSE",
    includedInAll: false,
    requiredFiles: ["COPYRIGHT", "LICENSE", "NOTICE"],
  },
  {
    directory: "tiiuae",
    packageName: "@cyberlangke/tokkit-tiiuae",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "eleutherai",
    packageName: "@cyberlangke/tokkit-eleutherai",
    license: "SEE LICENSE IN LICENSE",
    includedInAll: true,
    requiredFiles: ["COPYRIGHT", "LICENSE"],
  },
  {
    directory: "meituan-longcat",
    packageName: "@cyberlangke/tokkit-meituan-longcat",
    license: "MIT",
    includedInAll: true,
  },
  {
    directory: "xiaomi-mimo",
    packageName: "@cyberlangke/tokkit-xiaomi-mimo",
    license: "MIT",
    includedInAll: true,
  },
  {
    directory: "microsoft",
    packageName: "@cyberlangke/tokkit-microsoft",
    license: "MIT",
    includedInAll: true,
  },
  {
    directory: "mistral",
    packageName: "@cyberlangke/tokkit-mistral",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "huggingface-tb",
    packageName: "@cyberlangke/tokkit-huggingface-tb",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "allenai",
    packageName: "@cyberlangke/tokkit-allenai",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "ibm-granite",
    packageName: "@cyberlangke/tokkit-ibm-granite",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "h2oai",
    packageName: "@cyberlangke/tokkit-h2oai",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "upstage",
    packageName: "@cyberlangke/tokkit-upstage",
    license: "SEE LICENSE IN LICENSE",
    includedInAll: true,
    requiredFiles: ["COPYRIGHT", "LICENSE"],
  },
  {
    directory: "openai",
    packageName: "@cyberlangke/tokkit-openai",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "gsai-ml",
    packageName: "@cyberlangke/tokkit-gsai-ml",
    license: "SEE LICENSE IN LICENSE",
    includedInAll: true,
    requiredFiles: ["COPYRIGHT", "LICENSE"],
  },
  {
    directory: "bytedance-seed",
    packageName: "@cyberlangke/tokkit-bytedance-seed",
    license: "SEE LICENSE IN LICENSE",
    includedInAll: true,
    requiredFiles: ["COPYRIGHT", "LICENSE"],
  },
  {
    directory: "openbmb",
    packageName: "@cyberlangke/tokkit-openbmb",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "qwen",
    packageName: "@cyberlangke/tokkit-qwen",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "deepseek",
    packageName: "@cyberlangke/tokkit-deepseek",
    license: "MIT",
    includedInAll: true,
  },
  {
    directory: "glm",
    packageName: "@cyberlangke/tokkit-glm",
    license: "MIT",
    includedInAll: true,
  },
  {
    directory: "step",
    packageName: "@cyberlangke/tokkit-step",
    license: "Apache-2.0",
    includedInAll: true,
  },
  {
    directory: "all",
    packageName: "@cyberlangke/tokkit",
    license: "MIT",
    includedInAll: false,
  },
] satisfies readonly ExpectedPackage[]

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

  it("根 package.json 提供 FineWeb2 真实数据对拍脚本", () => {
    const packageJsonPath = resolve(REPO_ROOT, "package.json")
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>
    }
    const compareScriptPath = resolve(REPO_ROOT, "scripts", "fineweb2-compare.mjs")

    expect(packageJson.scripts?.["test:fineweb2"]).toBe("node scripts/fineweb2-compare.mjs")
    expect(packageJson.scripts?.["test:fineweb2:smoke"]).toBe(
      "node scripts/fineweb2-compare.mjs --limit 64 --maxChars 4096 --continueOnMismatch --jobs 8 --referenceBackend python"
    )
    expect(packageJson.scripts?.["test:fineweb2:decode:smoke"]).toBe(
      "node scripts/fineweb2-compare.mjs --limit 32 --maxChars 4096 --continueOnMismatch --checkDecode --jobs 8 --referenceBackend python"
    )
    expect(existsSync(compareScriptPath)).toBe(true)
  })

  it("core 包构建配置会排除测试源码，避免把测试产物发到 npm", () => {
    const tsupConfigPath = resolve(REPO_ROOT, "packages", "core", "tsup.config.ts")
    const tsupConfig = readFileSync(tsupConfigPath, "utf8")

    expect(tsupConfig).toContain("!src/**/*.test.ts")
  })

  it("存在 core、family、all 子包，并且包名、协议与版权文件正确", () => {
    for (const { directory, packageName, license, requiredFiles } of EXPECTED_PACKAGES) {
      const packageRoot = resolve(REPO_ROOT, "packages", directory)
      const packageJsonPath = resolve(packageRoot, "package.json")
      const readmePath = resolve(packageRoot, "README.md")
      const licensePath = resolve(packageRoot, "LICENSE")
      const copyrightPath = resolve(packageRoot, "COPYRIGHT")
      const noticePath = resolve(packageRoot, "NOTICE")

      expect(existsSync(packageRoot)).toBe(true)
      expect(existsSync(packageJsonPath)).toBe(true)
      expect(existsSync(readmePath)).toBe(true)
      expect(existsSync(licensePath)).toBe(true)
      expect(existsSync(copyrightPath)).toBe(true)

      if (requiredFiles?.includes("NOTICE")) {
        expect(existsSync(noticePath)).toBe(true)
      }

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
      expect(packageJson.files).toEqual(
        expect.arrayContaining(["dist", ...(requiredFiles ?? ["COPYRIGHT"])])
      )
      expect(packageJson.publishConfig?.access).toBe("public")
    }
  })

  it("package-lock.json 与当前 workspace 子包和全量包依赖保持同步", () => {
    const packageLockPath = resolve(REPO_ROOT, "package-lock.json")
    const packageLock = JSON.parse(readFileSync(packageLockPath, "utf8")) as {
      packages?: Record<
        string,
        {
          name?: string
          dependencies?: Record<string, string>
        }
      >
    }
    const lockedPackages = packageLock.packages ?? {}
    const allPackageDependencies = lockedPackages["packages/all"]?.dependencies ?? {}

    for (const { directory, packageName, includedInAll } of EXPECTED_PACKAGES) {
      const workspaceKey = `packages/${directory}`
      const packageJsonPath = resolve(REPO_ROOT, workspaceKey, "package.json")
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        version?: string
      }

      expect(lockedPackages[workspaceKey]?.name).toBe(packageName)

      if (includedInAll) {
        expect(allPackageDependencies[packageName]).toBe(packageJson.version)
      }
    }
  })
})
