import { describe, expect, it } from "vitest"

import {
  extractFailedPackages,
  isAlreadyPublishedVersionError,
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

  it("忽略和已发布版本无关的失败", () => {
    const output = `
🦋  error an error occurred while publishing @cyberlangke/tokkit-pleias: E404 Not Found
🦋  error packages failed to publish:
🦋  @cyberlangke/tokkit-pleias@1.11.0
`

    expect(isAlreadyPublishedVersionError(output)).toBe(false)
  })

  it("没有失败摘要时返回空列表", () => {
    const output = `
🦋  info nothing to publish
`

    expect(extractFailedPackages(output)).toEqual([])
  })
})
