/**
 * Hugging Face 对拍 benchmark 脚本。
 * 输入：本地已构建的 vendor dist 产物与仓库内提交的 `.json.br` tokenizer 快照。
 * 输出：打印 tokkit 与 `@huggingface/transformers` 的 encode 吞吐对比结果。
 *
 * 预期行为：
 * - 只使用仓库内已有快照，不下载远端资产。
 * - 先验证 encode 结果一致，再比较热态吞吐。
 * - 若缺少 dist 构建产物，会明确提示先运行 `npm run build`。
 */

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { brotliDecompressSync } from "node:zlib"
import { PreTrainedTokenizer } from "@huggingface/transformers"

/** 仓库根目录。 */
const REPO_ROOT = process.cwd()

/** 每轮 benchmark 的迭代次数。 */
const BENCH_ITERATIONS = Number.parseInt(process.env.TOKKIT_BENCH_ITERATIONS ?? "80", 10)

/** 热态 benchmark 前的预热次数。 */
const WARMUP_ITERATIONS = Number.parseInt(process.env.TOKKIT_BENCH_WARMUP ?? "8", 10)

/** 所有案例默认使用的长文本样本。 */
const DEFAULT_SAMPLE =
  [
    "Hello, world!",
    "你好，世界！",
    "A+B=42",
    "Mixing English, 中文, and symbols <>[]{} keeps byte-level and metaspace paths hot.",
    "line1\nline2\nline3",
  ].join(" ") + " ".repeat(8)

/** 最小 benchmark 覆盖的代表性 family。 */
const BENCHMARK_CASES = [
  {
    family: "qwen3.5",
    packageDir: "qwen",
    source: "vendor/tokenizers/Qwen__Qwen3.5-0.8B__tokenizer.json.br",
  },
  {
    family: "glm-5",
    packageDir: "glm",
    source: "vendor/tokenizers/zai-org__GLM-5__tokenizer.json.br",
  },
  {
    family: "mistral-7b-v0.1",
    packageDir: "mistral",
    source: "vendor/tokenizers/mistralai__Mistral-7B-v0.1__tokenizer.json.br",
  },
  {
    family: "phi-4",
    packageDir: "microsoft",
    source: "vendor/tokenizers/microsoft__phi-4__tokenizer.json.br",
  },
]

/**
 * 加载单个 vendor 子包的 dist 入口。
 * 输入：子包目录名。
 * 输出：包含 encode API 的模块对象。
 */
async function importVendorModule(packageDir) {
  const entryPath = resolve(REPO_ROOT, "packages", packageDir, "dist", "index.js")
  if (!existsSync(entryPath)) {
    throw new Error(`missing build output: ${entryPath}; run npm run build first`)
  }

  return import(pathToFileURL(entryPath).href)
}

/**
 * 从仓库内提交的 `.json.br` 快照构造 HF 参考 tokenizer。
 * 输入：快照相对路径。
 * 输出：可直接 encode 的 `PreTrainedTokenizer` 实例。
 */
function loadReferenceTokenizer(sourcePath) {
  const compressed = readFileSync(resolve(REPO_ROOT, sourcePath))
  const asset = JSON.parse(brotliDecompressSync(compressed).toString("utf8"))
  return new PreTrainedTokenizer(asset, {})
}

/**
 * 运行指定次数的 encode 测量。
 * 输入：要测量的 encode 函数、样本文本和迭代次数。
 * 输出：总耗时毫秒数。
 */
async function measureEncode(encodeOnce, sample, iterations) {
  const startedAt = performance.now()

  for (let index = 0; index < iterations; index += 1) {
    await encodeOnce(sample)
  }

  return performance.now() - startedAt
}

/**
 * 统一做一次 encode 结果一致性校验。
 * 输入：tokkit encode、HF encode 与样本文本。
 * 输出：不返回；若结果不一致则直接抛错。
 */
async function assertEncodingParity(tokkitEncode, referenceEncode, sample, family) {
  const actualIds = await tokkitEncode(sample)
  const expectedIds = referenceEncode(sample)

  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error(`benchmark parity failed for ${family}`)
  }
}

/**
 * 把测量结果换算成便于阅读的吞吐指标。
 * 输入：总耗时、迭代次数与单次 token 数。
 * 输出：包含 ops/s 与 tokens/s 的结果对象。
 */
function summarizeThroughput(durationMs, iterations, tokensPerIteration) {
  const seconds = durationMs / 1000
  return {
    durationMs: Number(durationMs.toFixed(2)),
    opsPerSecond: Number((iterations / seconds).toFixed(2)),
    tokensPerSecond: Number(((iterations * tokensPerIteration) / seconds).toFixed(2)),
  }
}

const moduleCache = new Map()
const results = []

for (const benchCase of BENCHMARK_CASES) {
  let vendorModule = moduleCache.get(benchCase.packageDir)
  if (!vendorModule) {
    vendorModule = await importVendorModule(benchCase.packageDir)
    moduleCache.set(benchCase.packageDir, vendorModule)
  }

  const reference = loadReferenceTokenizer(benchCase.source)
  const sample = DEFAULT_SAMPLE.repeat(80)
  const referenceEncode = (input) => reference.encode(input, { add_special_tokens: false })
  const tokkitEncode = (input) =>
    vendorModule.encode(input, benchCase.family, {
      addSpecialTokens: false,
    })

  await assertEncodingParity(tokkitEncode, referenceEncode, sample, benchCase.family)

  for (let index = 0; index < WARMUP_ITERATIONS; index += 1) {
    await tokkitEncode(sample)
    referenceEncode(sample)
  }

  const expectedIds = referenceEncode(sample)
  const tokkitDurationMs = await measureEncode(tokkitEncode, sample, BENCH_ITERATIONS)
  const hfDurationMs = await measureEncode(referenceEncode, sample, BENCH_ITERATIONS)

  results.push({
    family: benchCase.family,
    tokensPerIteration: expectedIds.length,
    iterations: BENCH_ITERATIONS,
    tokkit: summarizeThroughput(tokkitDurationMs, BENCH_ITERATIONS, expectedIds.length),
    transformers: summarizeThroughput(hfDurationMs, BENCH_ITERATIONS, expectedIds.length),
    speedupVsTransformers: Number((hfDurationMs / tokkitDurationMs).toFixed(2)),
  })
}

console.log(
  JSON.stringify(
    {
      warmupIterations: WARMUP_ITERATIONS,
      benchmarkIterations: BENCH_ITERATIONS,
      cases: results,
    },
    null,
    2
  )
)
