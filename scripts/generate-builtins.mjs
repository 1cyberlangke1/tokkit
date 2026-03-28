/**
 * 生成内置 tokenizer family 模块。
 * 输入：vendor/tokenizers/ 下提交到仓库的压缩 tokenizer 快照。
 * 输出：packages 下各 family 子包里的 packed TypeScript 模块。
 *
 * 预期行为：
 * - 运行时模块不再直接内联巨大的 vocab / merges 对象字面量。
 * - 先把 HF tokenizer.json 归一化，再把 merges 转成 token id 对，并用 brotli + base64 压缩。
 * - 该脚本只读取仓库内的压缩快照，不会下载任何模型权重。
 */

import {
  brotliCompressSync,
  brotliDecompressSync,
  constants as zlibConstants,
} from "node:zlib"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, extname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * 需要内置的 family 清单。
 * 输入：family 名称、目标子包、输出模块名和压缩 tokenizer 快照路径。
 * 输出：用于批量生成目标模块的稳定配置。
 */
export const FAMILY_SPECS = [
  {
    family: "qwen3.5",
    packageName: "qwen",
    moduleName: "qwen3_5",
    source: "vendor/tokenizers/Qwen__Qwen3.5-0.8B__tokenizer.json.br",
  },
  {
    family: "qwen3-coder-next",
    packageName: "qwen",
    moduleName: "qwen3_coder_next",
    source: "vendor/tokenizers/Qwen__Qwen3-Coder-Next__tokenizer.json.br",
  },
  {
    family: "deepseek-v3.1",
    packageName: "deepseek",
    moduleName: "deepseek_v3_1",
    source: "vendor/tokenizers/deepseek-ai__DeepSeek-V3.1__tokenizer.json.br",
  },
  {
    family: "deepseek-v3.2",
    packageName: "deepseek",
    moduleName: "deepseek_v3_2",
    source: "vendor/tokenizers/deepseek-ai__DeepSeek-V3.2__tokenizer.json.br",
  },
  {
    family: "glm-4.7",
    packageName: "glm",
    moduleName: "glm_4_7",
    source: "vendor/tokenizers/zai-org__GLM-4.7__tokenizer.json.br",
  },
  {
    family: "glm-5",
    packageName: "glm",
    moduleName: "glm_5",
    source: "vendor/tokenizers/zai-org__GLM-5__tokenizer.json.br",
  },
  {
    family: "step-3.5-flash",
    packageName: "step",
    moduleName: "step_3_5_flash",
    source: "vendor/tokenizers/stepfun-ai__Step-3.5-Flash__tokenizer.json.br",
  },
]

const projectRoot = process.cwd()
const currentScriptPath = fileURLToPath(import.meta.url)

/**
 * 解析单个 family 模块的输出路径。
 * 输入：目标子包名与模块名。
 * 输出：相对仓库根目录的 generated 模块路径。
 */
export function resolveOutputModulePath(packageName, moduleName) {
  return `packages/${packageName}/src/generated/${moduleName}.ts`
}

/**
 * 执行内置 family 生成流程。
 * 输入：无。
 * 输出：把所有压缩快照重新生成为各子包下的 generated 模块。
 */
export function generateBuiltins() {
  for (const spec of FAMILY_SPECS) {
    const sourcePath = resolve(projectRoot, spec.source)
    const rawTokenizer = readTokenizerSnapshot(sourcePath)
    const packedAsset = packNormalizedAsset(rawTokenizer)
    const modulePath = resolve(
      projectRoot,
      resolveOutputModulePath(spec.packageName, spec.moduleName)
    )

    mkdirSync(dirname(modulePath), { recursive: true })
    writeFileSync(modulePath, renderModule(spec.family, packedAsset))
  }
}

if (isDirectExecution()) {
  generateBuiltins()
}

/**
 * 读取 tokenizer 快照。
 * 输入：`.json` 或 `.json.br` 本地快照路径。
 * 输出：解析后的 Hugging Face tokenizer 对象。
 */
function readTokenizerSnapshot(sourcePath) {
  const buffer = readFileSync(sourcePath)
  const text =
    extname(sourcePath) === ".br"
      ? brotliDecompressSync(buffer).toString("utf8")
      : buffer.toString("utf8")

  return JSON.parse(text)
}

/**
 * 把 HF tokenizer.json 归一化并压缩成 packed base64 字符串。
 * 输入：原始 tokenizer.json 对象。
 * 输出：运行时可解包的 brotli + base64 字符串。
 */
function packNormalizedAsset(rawTokenizer) {
  if (rawTokenizer?.model?.type !== "BPE") {
    throw new Error(`Only BPE tokenizer families are supported, got: ${rawTokenizer?.model?.type}`)
  }

  const vocabById = normalizeVocab(rawTokenizer.model.vocab ?? {})
  const tokenToId = new Map()

  for (let index = 0; index < vocabById.length; index += 1) {
    const token = vocabById[index]
    if (token !== undefined && token !== "") {
      tokenToId.set(token, index)
    }
  }

  const mergeTokenIdPairs = normalizeMergeTokenIdPairs(rawTokenizer.model.merges ?? [], tokenToId)

  const payload = {
    a: normalizeAddedTokens(rawTokenizer.added_tokens ?? []),
    n: rawTokenizer.normalizer ?? null,
    p: rawTokenizer.pre_tokenizer ?? null,
    d: rawTokenizer.decoder ?? null,
    v: vocabById,
    mi: mergeTokenIdPairs,
    u: rawTokenizer.model.unk_token ?? null,
    cp: rawTokenizer.model.continuing_subword_prefix ?? "",
    cs: rawTokenizer.model.continuing_subword_suffix ?? null,
    ew: rawTokenizer.model.end_of_word_suffix ?? "",
    bf: rawTokenizer.model.byte_fallback ?? false,
    im: rawTokenizer.model.ignore_merges ?? false,
  }

  const json = JSON.stringify(payload)
  const compressed = brotliCompressSync(Buffer.from(json, "utf8"), {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
    },
  })

  return Buffer.from(compressed).toString("base64")
}

/**
 * 规范化 added token 列表。
 * 输入：HF tokenizer.json 里的 added_tokens 数组。
 * 输出：只保留运行时需要的字段。
 */
function normalizeAddedTokens(addedTokens) {
  return addedTokens.map((token) => ({
    id: token.id,
    content: token.content,
    single_word: token.single_word ?? false,
    lstrip: token.lstrip ?? false,
    rstrip: token.rstrip ?? false,
    normalized: token.normalized ?? false,
    special: token.special ?? false,
  }))
}

/**
 * 把 token -> id 词表转成按 id 排列的数组。
 * 输入：HF BPE 词表对象。
 * 输出：数组索引即 token id 的词表数组。
 */
function normalizeVocab(vocab) {
  const entries = Object.entries(vocab)
  const maxId = entries.reduce((current, [, id]) => Math.max(current, Number(id)), 0)
  const vocabById = new Array(maxId + 1).fill("")

  for (const [token, id] of entries) {
    vocabById[Number(id)] = token
  }

  return vocabById
}

/**
 * 把 merge 列表转成 token id 对。
 * 输入：HF merges 列表和 token -> id 映射。
 * 输出：扁平化的 `[leftId, rightId, ...]` 数组。
 */
function normalizeMergeTokenIdPairs(merges, tokenToId) {
  const normalizedMerges = Array.isArray(merges[0])
    ? merges
    : merges
        .filter((merge) => merge && !merge.startsWith("#"))
        .map((merge) => {
          const [left, right] = merge.split(" ", 2)
          return [left, right]
        })

  const mergeTokenIdPairs = []

  for (const [left, right] of normalizedMerges) {
    const leftId = tokenToId.get(left)
    const rightId = tokenToId.get(right)

    if (leftId === undefined || rightId === undefined) {
      throw new Error(`Unable to resolve merge pair to token ids: [${left}, ${right}]`)
    }

    mergeTokenIdPairs.push(leftId, rightId)
  }

  return mergeTokenIdPairs
}

/**
 * 渲染单个 family 模块源码。
 * 输入：family 名称与 packed asset 字符串。
 * 输出：可直接被 TypeScript 编译的模块字符串。
 */
function renderModule(family, packedAsset) {
  return `/**
 * ${family} 内置 tokenizer 资产。
 * 输入：无。
 * 输出：当前 family 的 packed tokenizer 数据。
 */

const packedAsset = ${JSON.stringify(packedAsset)}

export default packedAsset
`
}

/**
 * 判断当前模块是否以脚本方式直接运行。
 * 输入：无。
 * 输出：直接通过 node 执行时返回 true，被测试或其他模块导入时返回 false。
 */
function isDirectExecution() {
  return process.argv[1] ? resolve(process.argv[1]) === currentScriptPath : false
}
