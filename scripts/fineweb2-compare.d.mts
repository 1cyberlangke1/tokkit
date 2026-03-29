/**
 * FineWeb2 对拍脚本类型声明。
 * 输入：供 TypeScript 测试文件消费的脚本导出定义。
 * 输出：让 `tsc --noEmit` 能正确理解 `scripts/fineweb2-compare.mjs` 的导出形状。
 */

/** FineWeb2 对拍 CLI 选项。 */
export type FinewebCompareOptions = {
  filePath: string
  packageDir: string
  families: string[] | null
  start: number
  limit: number
  maxChars: number
  json: boolean
  continueOnMismatch: boolean
  checkDecode: boolean
  jobs: number
  referenceBackend: "js" | "python"
}

/** 单条 FineWeb2 采样记录。 */
export type FinewebSample = {
  lineNumber: number
  id: string | null
  text: string
}

/** 采样阶段的汇总结果。 */
export type FinewebSampleCollection = {
  samples: FinewebSample[]
  skippedTooLong: number
  totalLines: number
}

/** encode 差异报告。 */
export type EncodeMismatchReport = {
  kind: "encode"
  family: string
  lineNumber: number
  id: string | null
  inputLength: number
  textPreview: string
  firstMismatchIndex: number
  actualToken: number | null
  expectedToken: number | null
  actualLength: number
  expectedLength: number
  actualWindow: number[]
  expectedWindow: number[]
}

/** decode 差异报告。 */
export type DecodeMismatchReport = {
  kind: "decode"
  family: string
  lineNumber: number
  id: string | null
  inputLength: number
  textPreview: string
  actualDecodedPreview: string
  expectedDecodedPreview: string
}

/** 对拍差异联合类型。 */
export type FinewebMismatchReport = EncodeMismatchReport | DecodeMismatchReport

/** 单个 family 的对拍结果。 */
export type FinewebFamilyCompareResult = {
  ok: boolean
  family: string
  checkedSamples: number
  totalExpectedTokens: number
  durationMs: number
  mismatchCount: number
  cacheHits: number
  cacheMisses: number
  mismatch: FinewebMismatchReport | null
}

/** FineWeb2 reference 摘要缓存记录。 */
export type FinewebReferenceCacheRecord = {
  encodeLength: number
  encodeHash: string
  decodeHash: string | null
}

/** FineWeb2 reference 摘要缓存最小接口。 */
export type FinewebReferenceCache = {
  get(lineNumber: number): FinewebReferenceCacheRecord | null
  set(lineNumber: number, record: FinewebReferenceCacheRecord): void
}

/** 原始 reference tokenizer 的最小 decode 形状。 */
export type ReferenceDecoder = {
  decode(
    ids: number[],
    options: {
      skip_special_tokens: false
      clean_up_tokenization_spaces: false
    }
  ): string
}

/** 解析 CLI 参数。 */
export function parseCliArgs(argv: string[]): FinewebCompareOptions

/** 收集受控 FineWeb2 样本。 */
export function collectFinewebSamples(
  filePath: string,
  options?: Partial<Pick<FinewebCompareOptions, "start" | "limit" | "maxChars">>
): Promise<FinewebSampleCollection>

/** 对拍单个 family。 */
export function compareFamilyAgainstSamples(input: {
  family: string
  samples: FinewebSample[]
  tokkitEncode: (input: string) => Promise<number[]> | number[]
  referenceEncode: (input: string) => number[]
  tokkitDecode?: (ids: number[]) => Promise<string> | string
  referenceDecode?: (ids: number[]) => string
  stopOnFirstMismatch?: boolean
  referenceCache?: FinewebReferenceCache
}): Promise<FinewebFamilyCompareResult>

/** 调用关闭空格清理后的 reference decode。 */
export function decodeReferenceText(reference: ReferenceDecoder, ids: number[]): string

/** 执行脚本主流程。 */
export function main(argv?: string[]): Promise<unknown>
