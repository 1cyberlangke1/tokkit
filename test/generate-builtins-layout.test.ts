/**
 * generate:builtins 输出布局测试。
 * 输入：scripts/generate-builtins.mjs 暴露的 family 清单与输出路径函数。
 * 输出：验证每个 family 都会写入对应子包，而不是根目录旧路径。
 */

import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

describe("generate:builtins layout", () => {
  it("把每个 family 输出到对应的 workspace 子包", async () => {
    // @ts-expect-error 这里直接导入构建脚本模块，测试只关心其运行时导出形状。
    const module = await import("../scripts/generate-builtins.mjs")

    expect(module.FAMILY_SPECS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ family: "minimax-m1", packageName: "minimax" }),
        expect.objectContaining({ family: "minimax-m2", packageName: "minimax" }),
        expect.objectContaining({ family: "minimax-text-01", packageName: "minimax" }),
        expect.objectContaining({ family: "open-calm", packageName: "cyberagent" }),
        expect.objectContaining({ family: "calm2", packageName: "cyberagent" }),
        expect.objectContaining({ family: "calm3", packageName: "cyberagent" }),
        expect.objectContaining({ family: "apertus", packageName: "swiss-ai" }),
        expect.objectContaining({ family: "apertus-instruct", packageName: "swiss-ai" }),
        expect.objectContaining({ family: "yi", packageName: "01-ai" }),
        expect.objectContaining({ family: "yi-1.5-9b-chat", packageName: "01-ai" }),
        expect.objectContaining({ family: "yi-coder", packageName: "01-ai" }),
        expect.objectContaining({ family: "yi-coder-chat", packageName: "01-ai" }),
        expect.objectContaining({ family: "falcon-rw-1b", packageName: "tiiuae" }),
        expect.objectContaining({ family: "falcon-7b", packageName: "tiiuae" }),
        expect.objectContaining({ family: "polyglot-ko", packageName: "eleutherai" }),
        expect.objectContaining({ family: "polyglot-ko-12.8", packageName: "eleutherai" }),
        expect.objectContaining({ family: "gpt-neo", packageName: "eleutherai" }),
        expect.objectContaining({ family: "pythia", packageName: "eleutherai" }),
        expect.objectContaining({
          family: "longcat-flash-chat",
          packageName: "meituan-longcat",
        }),
        expect.objectContaining({
          family: "longcat-flash-lite",
          packageName: "meituan-longcat",
        }),
        expect.objectContaining({
          family: "longcat-flash-thinking",
          packageName: "meituan-longcat",
        }),
        expect.objectContaining({ family: "mimo", packageName: "xiaomi-mimo" }),
        expect.objectContaining({ family: "mimo-7b-rl-0530", packageName: "xiaomi-mimo" }),
        expect.objectContaining({ family: "mimo-v2-flash", packageName: "xiaomi-mimo" }),
        expect.objectContaining({
          family: "bitnet-b1.58-2b-4t",
          packageName: "microsoft",
        }),
        expect.objectContaining({ family: "nextcoder", packageName: "microsoft" }),
        expect.objectContaining({ family: "phi-1", packageName: "microsoft" }),
        expect.objectContaining({ family: "phi-3-mini", packageName: "microsoft" }),
        expect.objectContaining({ family: "phi-3-medium", packageName: "microsoft" }),
        expect.objectContaining({ family: "phi-3.5", packageName: "microsoft" }),
        expect.objectContaining({ family: "phi-4", packageName: "microsoft" }),
        expect.objectContaining({ family: "phi-4-mini", packageName: "microsoft" }),
        expect.objectContaining({ family: "phi-4-mini-flash", packageName: "microsoft" }),
        expect.objectContaining({
          family: "phi-4-mini-reasoning",
          packageName: "microsoft",
        }),
        expect.objectContaining({ family: "phi-4-reasoning", packageName: "microsoft" }),
        expect.objectContaining({ family: "phi-moe", packageName: "microsoft" }),
        expect.objectContaining({ family: "devstral-small-2", packageName: "mistral" }),
        expect.objectContaining({ family: "devstral-small-2505", packageName: "mistral" }),
        expect.objectContaining({ family: "leanstral-2603", packageName: "mistral" }),
        expect.objectContaining({ family: "mathstral-7b", packageName: "mistral" }),
        expect.objectContaining({ family: "mamba-codestral-7b", packageName: "mistral" }),
        expect.objectContaining({ family: "magistral-small-2507", packageName: "mistral" }),
        expect.objectContaining({ family: "ministral-3", packageName: "mistral" }),
        expect.objectContaining({ family: "mistral-7b-v0.1", packageName: "mistral" }),
        expect.objectContaining({ family: "mistral-7b-v0.3", packageName: "mistral" }),
        expect.objectContaining({ family: "mistral-nemo", packageName: "mistral" }),
        expect.objectContaining({ family: "mistral-small-3.2", packageName: "mistral" }),
        expect.objectContaining({ family: "mistral-small-24b", packageName: "mistral" }),
        expect.objectContaining({ family: "mixtral-8x7b", packageName: "mistral" }),
        expect.objectContaining({ family: "cosmo-1b", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "smollm", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "smollm-1.7b", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "smollm2-16k", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "smollm3", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "smollm3-base", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "olmo", packageName: "allenai" }),
        expect.objectContaining({ family: "olmo-1", packageName: "allenai" }),
        expect.objectContaining({ family: "olmo-0424", packageName: "allenai" }),
        expect.objectContaining({ family: "olmo-2", packageName: "allenai" }),
        expect.objectContaining({ family: "olmo-3-instruct", packageName: "allenai" }),
        expect.objectContaining({ family: "olmo-hybrid", packageName: "allenai" }),
        expect.objectContaining({ family: "olmo-hybrid-think", packageName: "allenai" }),
        expect.objectContaining({ family: "olmoe", packageName: "allenai" }),
        expect.objectContaining({ family: "olmoe-instruct", packageName: "allenai" }),
        expect.objectContaining({ family: "olmoe-0125", packageName: "allenai" }),
        expect.objectContaining({ family: "olmoe-0125-instruct", packageName: "allenai" }),
        expect.objectContaining({
          family: "granite-3-instruct",
          packageName: "ibm-granite",
        }),
        expect.objectContaining({
          family: "granite-3.3-base",
          packageName: "ibm-granite",
        }),
        expect.objectContaining({
          family: "granite-3.3-instruct",
          packageName: "ibm-granite",
        }),
        expect.objectContaining({
          family: "granite-7b-base",
          packageName: "ibm-granite",
        }),
        expect.objectContaining({
          family: "granite-7b-instruct",
          packageName: "ibm-granite",
        }),
        expect.objectContaining({
          family: "granite-code-base",
          packageName: "ibm-granite",
        }),
        expect.objectContaining({ family: "granite-4", packageName: "ibm-granite" }),
        expect.objectContaining({
          family: "granite-4-tiny-base-preview",
          packageName: "ibm-granite",
        }),
        expect.objectContaining({
          family: "granite-4-tiny-preview",
          packageName: "ibm-granite",
        }),
        expect.objectContaining({ family: "danube", packageName: "h2oai" }),
        expect.objectContaining({ family: "danube2", packageName: "h2oai" }),
        expect.objectContaining({
          family: "danube3-500m-chat",
          packageName: "h2oai",
        }),
        expect.objectContaining({
          family: "danube3-4b-chat",
          packageName: "h2oai",
        }),
        expect.objectContaining({
          family: "danube3.1-4b-chat",
          packageName: "h2oai",
        }),
        expect.objectContaining({ family: "nanbeige4", packageName: "nanbeige" }),
        expect.objectContaining({
          family: "nanbeige4-base",
          packageName: "nanbeige",
        }),
        expect.objectContaining({ family: "solar", packageName: "upstage" }),
        expect.objectContaining({ family: "solar-pro", packageName: "upstage" }),
        expect.objectContaining({ family: "gpt-oss", packageName: "openai" }),
        expect.objectContaining({ family: "llada", packageName: "gsai-ml" }),
        expect.objectContaining({ family: "llada-base", packageName: "gsai-ml" }),
        expect.objectContaining({ family: "refusion", packageName: "gsai-ml" }),
        expect.objectContaining({
          family: "academic-ds",
          packageName: "bytedance-seed",
        }),
        expect.objectContaining({
          family: "seed-oss",
          packageName: "bytedance-seed",
        }),
        expect.objectContaining({
          family: "seed-coder",
          packageName: "bytedance-seed",
        }),
        expect.objectContaining({
          family: "stable-diffcoder",
          packageName: "bytedance-seed",
        }),
        expect.objectContaining({ family: "agentcpm-explore", packageName: "openbmb" }),
        expect.objectContaining({ family: "minicpm-s-1b", packageName: "openbmb" }),
        expect.objectContaining({ family: "minicpm-sala", packageName: "openbmb" }),
        expect.objectContaining({ family: "minicpm3", packageName: "openbmb" }),
        expect.objectContaining({ family: "minicpm4", packageName: "openbmb" }),
        expect.objectContaining({ family: "minicpm-moe", packageName: "openbmb" }),
        expect.objectContaining({ family: "codegen", packageName: "salesforce" }),
        expect.objectContaining({ family: "codegen-nl", packageName: "salesforce" }),
        expect.objectContaining({ family: "codegen2", packageName: "salesforce" }),
        expect.objectContaining({ family: "cerebras-gpt", packageName: "cerebras" }),
        expect.objectContaining({
          family: "btlm-3b-8k-chat",
          packageName: "cerebras",
        }),
        expect.objectContaining({ family: "llada2", packageName: "inclusionai" }),
        expect.objectContaining({ family: "ring-2.5-1t", packageName: "inclusionai" }),
        expect.objectContaining({ family: "ling-2", packageName: "inclusionai" }),
        expect.objectContaining({ family: "ring-mini-2.0", packageName: "inclusionai" }),
        expect.objectContaining({ family: "ring-flash-2.0", packageName: "inclusionai" }),
        expect.objectContaining({ family: "ring-1t", packageName: "inclusionai" }),
        expect.objectContaining({ family: "pleias-350m", packageName: "pleias" }),
        expect.objectContaining({ family: "pleias-1.2b", packageName: "pleias" }),
        expect.objectContaining({ family: "pleias-3b", packageName: "pleias" }),
        expect.objectContaining({ family: "pleias-pico", packageName: "pleias" }),
        expect.objectContaining({ family: "baguettotron", packageName: "pleias" }),
        expect.objectContaining({ family: "monad", packageName: "pleias" }),
        expect.objectContaining({ family: "qwen2", packageName: "qwen" }),
        expect.objectContaining({ family: "qwen2.5", packageName: "qwen" }),
        expect.objectContaining({ family: "qwen3", packageName: "qwen" }),
        expect.objectContaining({ family: "qwen3.5", packageName: "qwen" }),
        expect.objectContaining({ family: "qwen3.5-base", packageName: "qwen" }),
        expect.objectContaining({ family: "qwen3-coder-next", packageName: "qwen" }),
        expect.objectContaining({ family: "deepseek-v3", packageName: "deepseek" }),
        expect.objectContaining({ family: "deepseek-r1", packageName: "deepseek" }),
        expect.objectContaining({ family: "deepseek-v3.1", packageName: "deepseek" }),
        expect.objectContaining({ family: "deepseek-v3.2", packageName: "deepseek" }),
        expect.objectContaining({ family: "glm-4.7", packageName: "glm" }),
        expect.objectContaining({ family: "glm-5", packageName: "glm" }),
        expect.objectContaining({ family: "step-3.5-flash", packageName: "step" }),
      ])
    )

    expect(module.resolveOutputModulePath("01-ai", "yi_coder_chat")).toBe(
      "packages/01-ai/src/generated/yi_coder_chat.ts"
    )
    expect(module.resolveOutputModulePath("minimax", "minimax_m2")).toBe(
      "packages/minimax/src/generated/minimax_m2.ts"
    )
    expect(module.resolveOutputModulePath("tiiuae", "falcon_rw_1b")).toBe(
      "packages/tiiuae/src/generated/falcon_rw_1b.ts"
    )
    expect(module.resolveOutputModulePath("microsoft", "phi_4_mini_reasoning")).toBe(
      "packages/microsoft/src/generated/phi_4_mini_reasoning.ts"
    )
    expect(module.resolveOutputModulePath("huggingface-tb", "smollm3")).toBe(
      "packages/huggingface-tb/src/generated/smollm3.ts"
    )
    expect(module.resolveOutputModulePath("mistral", "mistral_small_3_2")).toBe(
      "packages/mistral/src/generated/mistral_small_3_2.ts"
    )
    expect(module.resolveOutputModulePath("allenai", "olmo_hybrid")).toBe(
      "packages/allenai/src/generated/olmo_hybrid.ts"
    )
    expect(module.resolveOutputModulePath("ibm-granite", "granite_4")).toBe(
      "packages/ibm-granite/src/generated/granite_4.ts"
    )
    expect(module.resolveOutputModulePath("h2oai", "danube3_1_4b_chat")).toBe(
      "packages/h2oai/src/generated/danube3_1_4b_chat.ts"
    )
    expect(module.resolveOutputModulePath("nanbeige", "nanbeige4_base")).toBe(
      "packages/nanbeige/src/generated/nanbeige4_base.ts"
    )
    expect(module.resolveOutputModulePath("upstage", "solar_pro")).toBe(
      "packages/upstage/src/generated/solar_pro.ts"
    )
    expect(module.resolveOutputModulePath("openai", "gpt_oss")).toBe(
      "packages/openai/src/generated/gpt_oss.ts"
    )
    expect(module.resolveOutputModulePath("gsai-ml", "llada_base")).toBe(
      "packages/gsai-ml/src/generated/llada_base.ts"
    )
    expect(module.resolveOutputModulePath("bytedance-seed", "seed_oss")).toBe(
      "packages/bytedance-seed/src/generated/seed_oss.ts"
    )
    expect(module.resolveOutputModulePath("openbmb", "agentcpm_explore")).toBe(
      "packages/openbmb/src/generated/agentcpm_explore.ts"
    )
    expect(module.resolveOutputModulePath("openbmb", "minicpm4")).toBe(
      "packages/openbmb/src/generated/minicpm4.ts"
    )
    expect(module.resolveOutputModulePath("cerebras", "cerebras_gpt")).toBe(
      "packages/cerebras/src/generated/cerebras_gpt.ts"
    )
    expect(module.resolveOutputModulePath("inclusionai", "llada2")).toBe(
      "packages/inclusionai/src/generated/llada2.ts"
    )
    expect(module.resolveOutputModulePath("pleias", "pleias_350m")).toBe(
      "packages/pleias/src/generated/pleias_350m.ts"
    )
    expect(module.resolveOutputModulePath("qwen", "qwen3_5_base")).toBe(
      "packages/qwen/src/generated/qwen3_5_base.ts"
    )
    expect(module.resolveOutputModulePath("deepseek", "deepseek_r1")).toBe(
      "packages/deepseek/src/generated/deepseek_r1.ts"
    )
  })

  it("保留以 # 开头的真实 merge 规则，只跳过 #version 注释", async () => {
    // @ts-expect-error 这里直接导入构建脚本模块，测试只关心其运行时导出形状。
    const module = await import("../scripts/generate-builtins.mjs")
    const tokenToId = new Map([
      ["#", 1],
      ["##", 2],
      ["###", 3],
      ["\n", 4],
      ["###\n", 5],
    ])

    expect(
      module.normalizeMergeTokenIdPairs(
        ["#version: 0.2", "# #", "## #", "### \n"],
        tokenToId
      )
    ).toEqual([1, 1, 2, 1, 3, 4])
  })

  it("每个子包注册的 canonical family 都在 FAMILY_SPECS 里有生成条目", async () => {
    // @ts-expect-error 这里直接导入构建脚本模块，测试只关心其运行时导出形状。
    const module = await import("../scripts/generate-builtins.mjs")
    const specFamiliesByPackage = new Map<string, Set<string>>()

    for (const spec of module.FAMILY_SPECS as Array<{ family: string; packageName: string }>) {
      const families = specFamiliesByPackage.get(spec.packageName) ?? new Set<string>()
      families.add(spec.family)
      specFamiliesByPackage.set(spec.packageName, families)
    }

    const packagesDir = resolve(process.cwd(), "packages")
    const packageNames = readdirSync(packagesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => name !== "all" && name !== "core")

    for (const packageName of packageNames) {
      const indexPath = resolve(packagesDir, packageName, "src", "index.ts")
      const source = readFileSync(indexPath, "utf8")
      const registeredFamilies = [...source.matchAll(/family:\s*"([^"]+)"/g)].map(
        (match) => match[1]
      )

      if (registeredFamilies.length === 0) {
        continue
      }

      const missingFamilies = registeredFamilies.filter(
        (family) => !specFamiliesByPackage.get(packageName)?.has(family)
      )

      expect(
        missingFamilies,
        `${packageName} 缺少 FAMILY_SPECS 条目: ${missingFamilies.join(", ")}`
      ).toEqual([])
    }
  })

  it("生成脚本遇到未变化内容时不会重写文件", async () => {
    // @ts-expect-error 这里直接导入构建脚本模块，测试只关心其运行时导出形状。
    const module = await import("../scripts/generate-builtins.mjs")
    const fixtureDir = resolve(process.cwd(), "tmp", "generate-builtins-layout-test")
    const fixturePath = resolve(fixtureDir, "fixture.ts")

    rmSync(fixtureDir, { recursive: true, force: true })
    mkdirSync(fixtureDir, { recursive: true })
    writeFileSync(fixturePath, "same-content\n")

    const before = statSync(fixturePath).mtimeMs
    const firstWriteChanged = module.writeFileIfChanged(fixturePath, "same-content\n")
    const afterSameContent = statSync(fixturePath).mtimeMs
    const secondWriteChanged = module.writeFileIfChanged(fixturePath, "new-content\n")
    const afterChangedContent = statSync(fixturePath).mtimeMs

    expect(firstWriteChanged).toBe(false)
    expect(afterSameContent).toBe(before)
    expect(secondWriteChanged).toBe(true)
    expect(afterChangedContent).toBeGreaterThanOrEqual(afterSameContent)
    expect(readFileSync(fixturePath, "utf8")).toBe("new-content\n")

    rmSync(fixtureDir, { recursive: true, force: true })
  })

  it("支持按 family 和包名过滤生成范围", async () => {
    // @ts-expect-error 这里直接导入构建脚本模块，测试只关心其运行时导出形状。
    const module = await import("../scripts/generate-builtins.mjs")

    const byFamily = module.filterFamilySpecs(module.FAMILY_SPECS, {
      families: ["pleias-350m", "monad"],
    })
    const byPackage = module.filterFamilySpecs(module.FAMILY_SPECS, {
      packageNames: ["pleias"],
    })

    expect(byFamily.map((spec: { family: string }) => spec.family)).toEqual([
      "pleias-350m",
      "monad",
    ])
    expect(
      new Set(byPackage.map((spec: { packageName: string }) => spec.packageName))
    ).toEqual(new Set(["pleias"]))
    expect(
      byPackage.some((spec: { family: string }) => spec.family === "qwen3")
    ).toBe(false)
  })
})
