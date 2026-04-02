/**
 * 多包发布流配置测试。
 * 输入：Changesets 配置文件、根 package.json 与 GitHub Actions workflow。
 * 输出：验证仓库使用 Changesets + NPM_TOKEN 做多包发布。
 */

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

describe("publish workflow", () => {
  it("存在 changesets 配置并启用多包发布", () => {
    const configPath = resolve(".changeset/config.json")
    expect(existsSync(configPath)).toBe(true)

    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      access?: string
      baseBranch?: string
      updateInternalDependencies?: string
    }

    expect(config.access).toBe("public")
    expect(config.baseBranch).toBe("main")
    expect(config.updateInternalDependencies).toBe("patch")
  })

  it("根脚本暴露 changesets 版本与发布命令", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as {
      scripts?: Record<string, string>
    }

    expect(packageJson.scripts?.changeset).toBe("changeset")
    expect(packageJson.scripts?.["version:packages"]).toBe("changeset version")
    expect(packageJson.scripts?.release).toBe("changeset publish")
    expect(packageJson.scripts?.["release:ci"]).toBe("node scripts/release-packages.mjs")
  })

  it("GitHub Actions 使用 NPM_TOKEN 和 changesets/action", () => {
    const workflowPath = resolve(".github/workflows/publish.yml")
    expect(existsSync(workflowPath)).toBe(true)

    const workflow = readFileSync(workflowPath, "utf8")

    expect(workflow).toContain("changesets/action")
    expect(workflow).toContain("NPM_TOKEN")
    expect(workflow).toContain("_authToken")
    expect(workflow).toContain("npm whoami")
    expect(workflow).not.toContain("<<'EOF'")
    expect(workflow).toContain("publish: npm run release:ci")
    expect(workflow).toContain("FORCE_JAVASCRIPT_ACTIONS_TO_NODE24")
  })
})
