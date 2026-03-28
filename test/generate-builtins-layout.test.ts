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
        expect.objectContaining({ family: "qwen3.5", packageName: "qwen" }),
        expect.objectContaining({ family: "qwen3-coder-next", packageName: "qwen" }),
        expect.objectContaining({ family: "deepseek-v3.1", packageName: "deepseek" }),
        expect.objectContaining({ family: "deepseek-v3.2", packageName: "deepseek" }),
        expect.objectContaining({ family: "glm-4.7", packageName: "glm" }),
        expect.objectContaining({ family: "glm-5", packageName: "glm" }),
        expect.objectContaining({ family: "step-3.5-flash", packageName: "step" }),
      ])
    )

    expect(module.resolveOutputModulePath("qwen", "qwen3_5")).toBe(
      "packages/qwen/src/generated/qwen3_5.ts"
    )
    expect(module.resolveOutputModulePath("deepseek", "deepseek_v3_1")).toBe(
      "packages/deepseek/src/generated/deepseek_v3_1.ts"
    )
    expect(module.resolveOutputModulePath("glm", "glm_5")).toBe("packages/glm/src/generated/glm_5.ts")
    expect(module.resolveOutputModulePath("step", "step_3_5_flash")).toBe(
      "packages/step/src/generated/step_3_5_flash.ts"
    )
  })
})
