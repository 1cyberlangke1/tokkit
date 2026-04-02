export interface LongTextEncodingConfig {
  type: "split-whitespaces-or-nonwhitespaces"
  maxEncodeChars: number
  maxConsecutiveSliceLen: number
}

export interface FinewebSample {
  lineNumber: number
  id: string | null
  text: string
}

export interface FinewebCompareCliOptions {
  filePath: string
  families: string[] | null
  start: number
  limit: number
  maxChars: number
  json: boolean
  continueOnMismatch: boolean
  checkDecode: boolean
  jobs: number
  referenceBackend: "js" | "python"
  packageDir: string
}

export interface FinewebMismatch {
  kind?: string
  family?: string
  lineNumber?: number
  id?: string | null
  inputLength?: number
  textPreview?: string
  firstMismatchIndex?: number
  actualToken?: number | null
  expectedToken?: number | null
  actualLength?: number
  expectedLength?: number
}

export interface FinewebCompareResult {
  ok: boolean
  family: string
  checkedSamples: number
  totalExpectedTokens: number
  durationMs: number
  mismatchCount: number
  cacheHits: number
  cacheMisses: number
  mismatch: FinewebMismatch | null
}

export function parseCliArgs(argv: string[]): FinewebCompareCliOptions
export function collectFinewebSamples(
  filePath: string,
  options?: {
    start?: number
    limit?: number
    maxChars?: number
  }
): Promise<{
  samples: FinewebSample[]
  skippedTooLong: number
  totalLines: number
}>
export function compareFamilyAgainstSamples(options: {
  family: string
  samples: FinewebSample[]
  tokkitEncode: (input: string) => Promise<number[]> | number[]
  referenceEncode: (input: string) => Promise<number[]> | number[]
  tokkitDecode?: (ids: number[]) => Promise<string> | string
  referenceDecode?: (ids: number[]) => Promise<string> | string
  stopOnFirstMismatch?: boolean
  referenceCache?: {
    get(lineNumber: number): { encodeLength: number; encodeHash: string; decodeHash: string | null } | null
    set(
      lineNumber: number,
      record: { encodeLength: number; encodeHash: string; decodeHash: string | null }
    ): void
  }
}): Promise<FinewebCompareResult>
export function decodeReferenceText(
  reference: { decode(ids: number[], options: Record<string, unknown>): string },
  ids: number[]
): string
export function encodeReferenceText(
  reference: { encode(text: string, options: Record<string, unknown>): number[] },
  text: string,
  options: Record<string, unknown>,
  longTextEncoding?: LongTextEncodingConfig | null
): number[]
export function normalizeReferenceAssetForJavaScript(
  asset: Record<string, unknown>
): Record<string, unknown>
export function resolveFamilySpecs(
  supportedFamilies: Set<string>,
  selectedFamilies?: string[] | null,
  packageDir?: string
): Array<Record<string, unknown>>
export function main(argv?: string[]): Promise<Record<string, unknown>>
