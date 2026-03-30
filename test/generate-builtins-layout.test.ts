/**
 * generate:builtins 输出布局测试。
 * 输入：scripts/generate-builtins.mjs 暴露的 family 清单与输出路径函数。
 * 输出：验证每个 family 都会写入对应子包，而不是根目录旧路径。
 */

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
        expect.objectContaining({ family: "ministral-8b", packageName: "mistral" }),
        expect.objectContaining({ family: "mistral-7b-v0.1", packageName: "mistral" }),
        expect.objectContaining({ family: "mistral-7b-v0.3", packageName: "mistral" }),
        expect.objectContaining({ family: "mistral-small-3.1", packageName: "mistral" }),
        expect.objectContaining({ family: "mixtral-8x7b", packageName: "mistral" }),
        expect.objectContaining({ family: "smollm", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "cosmo-1b", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "smollm-1.7b", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "smollm2-16k", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "smollm3", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "smollm3-base", packageName: "huggingface-tb" }),
        expect.objectContaining({ family: "olmo-1", packageName: "allenai" }),
        expect.objectContaining({ family: "olmo-2", packageName: "allenai" }),
        expect.objectContaining({ family: "olmo-3-instruct", packageName: "allenai" }),
        expect.objectContaining({ family: "olmo-hybrid", packageName: "allenai" }),
        expect.objectContaining({ family: "olmoe", packageName: "allenai" }),
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
        expect.objectContaining({ family: "minicpm-s-1b", packageName: "openbmb" }),
        expect.objectContaining({ family: "minicpm-sala", packageName: "openbmb" }),
        expect.objectContaining({ family: "minicpm3", packageName: "openbmb" }),
        expect.objectContaining({ family: "minicpm4", packageName: "openbmb" }),
        expect.objectContaining({ family: "qwen3.5", packageName: "qwen" }),
        expect.objectContaining({ family: "qwen3-coder-next", packageName: "qwen" }),
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
    expect(module.resolveOutputModulePath("huggingface-tb", "cosmo_1b")).toBe(
      "packages/huggingface-tb/src/generated/cosmo_1b.ts"
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
    expect(module.resolveOutputModulePath("ibm-granite", "granite_code_base")).toBe(
      "packages/ibm-granite/src/generated/granite_code_base.ts"
    )
    expect(module.resolveOutputModulePath("bytedance-seed", "seed_oss")).toBe(
      "packages/bytedance-seed/src/generated/seed_oss.ts"
    )
    expect(module.resolveOutputModulePath("openbmb", "minicpm4")).toBe(
      "packages/openbmb/src/generated/minicpm4.ts"
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
})
