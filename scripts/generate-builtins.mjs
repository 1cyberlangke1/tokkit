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
    family: "minimax-m1",
    packageName: "minimax",
    moduleName: "minimax_m1",
    source: "vendor/tokenizers/MiniMaxAI__MiniMax-M1-40k__tokenizer.json.br",
  },
  {
    family: "minimax-m2",
    packageName: "minimax",
    moduleName: "minimax_m2",
    source: "vendor/tokenizers/MiniMaxAI__MiniMax-M2__tokenizer.json.br",
  },
  {
    family: "minimax-text-01",
    packageName: "minimax",
    moduleName: "minimax_text_01",
    source: "vendor/tokenizers/MiniMaxAI__MiniMax-Text-01-hf__tokenizer.json.br",
  },
  {
    family: "yi",
    packageName: "01-ai",
    moduleName: "yi",
    source: "vendor/tokenizers/01-ai__Yi-6B__tokenizer.json.br",
  },
  {
    family: "yi-1.5-9b-chat",
    packageName: "01-ai",
    moduleName: "yi_1_5_9b_chat",
    source: "vendor/tokenizers/01-ai__Yi-1.5-9B-Chat__tokenizer.json.br",
  },
  {
    family: "yi-coder",
    packageName: "01-ai",
    moduleName: "yi_coder",
    source: "vendor/tokenizers/01-ai__Yi-Coder-9B__tokenizer.json.br",
  },
  {
    family: "yi-coder-chat",
    packageName: "01-ai",
    moduleName: "yi_coder_chat",
    source: "vendor/tokenizers/01-ai__Yi-Coder-9B-Chat__tokenizer.json.br",
  },
  {
    family: "falcon-rw-1b",
    packageName: "tiiuae",
    moduleName: "falcon_rw_1b",
    source: "vendor/tokenizers/tiiuae__falcon-rw-1b__tokenizer.json.br",
  },
  {
    family: "falcon-7b",
    packageName: "tiiuae",
    moduleName: "falcon_7b",
    source: "vendor/tokenizers/tiiuae__falcon-7b__tokenizer.json.br",
  },
  {
    family: "polyglot-ko",
    packageName: "eleutherai",
    moduleName: "polyglot_ko",
    source: "vendor/tokenizers/EleutherAI__polyglot-ko-1.3b__tokenizer.json.br",
  },
  {
    family: "polyglot-ko-12.8",
    packageName: "eleutherai",
    moduleName: "polyglot_ko_12_8",
    source: "vendor/tokenizers/EleutherAI__polyglot-ko-12.8b__tokenizer.json.br",
  },
  {
    family: "gpt-neo",
    packageName: "eleutherai",
    moduleName: "gpt_neo",
    source: "vendor/tokenizers/EleutherAI__gpt-neo-125m__tokenizer.json.br",
  },
  {
    family: "pythia",
    packageName: "eleutherai",
    moduleName: "pythia",
    source: "vendor/tokenizers/EleutherAI__pythia-6.9b__tokenizer.json.br",
  },
  {
    family: "longcat-flash-chat",
    packageName: "meituan-longcat",
    moduleName: "longcat_flash_chat",
    source: "vendor/tokenizers/meituan-longcat__LongCat-Flash-Chat__tokenizer.json.br",
  },
  {
    family: "longcat-flash-lite",
    packageName: "meituan-longcat",
    moduleName: "longcat_flash_lite",
    source: "vendor/tokenizers/meituan-longcat__LongCat-Flash-Lite__tokenizer.json.br",
  },
  {
    family: "longcat-flash-thinking",
    packageName: "meituan-longcat",
    moduleName: "longcat_flash_thinking",
    source: "vendor/tokenizers/meituan-longcat__LongCat-Flash-Thinking-2601__tokenizer.json.br",
  },
  {
    family: "mimo",
    packageName: "xiaomi-mimo",
    moduleName: "mimo",
    source: "vendor/tokenizers/XiaomiMiMo__MiMo-7B-SFT__tokenizer.json.br",
  },
  {
    family: "mimo-7b-rl-0530",
    packageName: "xiaomi-mimo",
    moduleName: "mimo_7b_rl_0530",
    source: "vendor/tokenizers/XiaomiMiMo__MiMo-7B-RL-0530__tokenizer.json.br",
  },
  {
    family: "mimo-v2-flash",
    packageName: "xiaomi-mimo",
    moduleName: "mimo_v2_flash",
    source: "vendor/tokenizers/XiaomiMiMo__MiMo-V2-Flash__tokenizer.json.br",
  },
  {
    family: "bitnet-b1.58-2b-4t",
    packageName: "microsoft",
    moduleName: "bitnet_b1_58_2b_4t",
    source: "vendor/tokenizers/microsoft__bitnet-b1.58-2B-4T__tokenizer.json.br",
  },
  {
    family: "nextcoder",
    packageName: "microsoft",
    moduleName: "nextcoder",
    source: "vendor/tokenizers/microsoft__NextCoder-7B__tokenizer.json.br",
  },
  {
    family: "phi-1",
    packageName: "microsoft",
    moduleName: "phi_1",
    source: "vendor/tokenizers/microsoft__phi-1__tokenizer.json.br",
  },
  {
    family: "phi-3-mini",
    packageName: "microsoft",
    moduleName: "phi_3_mini",
    source: "vendor/tokenizers/microsoft__Phi-3-mini-4k-instruct__tokenizer.json.br",
  },
  {
    family: "phi-3-medium",
    packageName: "microsoft",
    moduleName: "phi_3_medium",
    source: "vendor/tokenizers/microsoft__Phi-3-medium-4k-instruct__tokenizer.json.br",
  },
  {
    family: "phi-3.5",
    packageName: "microsoft",
    moduleName: "phi_3_5",
    source: "vendor/tokenizers/microsoft__Phi-3.5-mini-instruct__tokenizer.json.br",
  },
  {
    family: "phi-4",
    packageName: "microsoft",
    moduleName: "phi_4",
    source: "vendor/tokenizers/microsoft__phi-4__tokenizer.json.br",
  },
  {
    family: "phi-4-mini",
    packageName: "microsoft",
    moduleName: "phi_4_mini",
    source: "vendor/tokenizers/microsoft__Phi-4-mini-instruct__tokenizer.json.br",
  },
  {
    family: "phi-4-mini-flash",
    packageName: "microsoft",
    moduleName: "phi_4_mini_flash",
    source: "vendor/tokenizers/microsoft__Phi-4-mini-flash-reasoning__tokenizer.json.br",
  },
  {
    family: "phi-4-mini-reasoning",
    packageName: "microsoft",
    moduleName: "phi_4_mini_reasoning",
    source: "vendor/tokenizers/microsoft__Phi-4-mini-reasoning__tokenizer.json.br",
  },
  {
    family: "phi-4-reasoning",
    packageName: "microsoft",
    moduleName: "phi_4_reasoning",
    source: "vendor/tokenizers/microsoft__Phi-4-reasoning__tokenizer.json.br",
  },
  {
    family: "phi-moe",
    packageName: "microsoft",
    moduleName: "phi_moe",
    source: "vendor/tokenizers/microsoft__Phi-mini-MoE-instruct__tokenizer.json.br",
  },
  {
    family: "devstral-small-2",
    packageName: "mistral",
    moduleName: "devstral_small_2",
    source: "vendor/tokenizers/mistralai__Devstral-Small-2-24B-Instruct-2512__tokenizer.json.br",
  },
  {
    family: "devstral-small-2505",
    packageName: "mistral",
    moduleName: "devstral_small_2505",
    source: "vendor/tokenizers/mistralai__Devstral-Small-2505__tokenizer.json.br",
  },
  {
    family: "leanstral-2603",
    packageName: "mistral",
    moduleName: "leanstral_2603",
    source: "vendor/tokenizers/mistralai__Leanstral-2603__tokenizer.json.br",
  },
  {
    family: "mathstral-7b",
    packageName: "mistral",
    moduleName: "mathstral_7b",
    source: "vendor/tokenizers/mistralai__Mathstral-7B-v0.1__tokenizer.json.br",
  },
  {
    family: "mamba-codestral-7b",
    packageName: "mistral",
    moduleName: "mamba_codestral_7b",
    source: "vendor/tokenizers/mistralai__Mamba-Codestral-7B-v0.1__tokenizer.json.br",
  },
  {
    family: "magistral-small-2507",
    packageName: "mistral",
    moduleName: "magistral_small_2507",
    source: "vendor/tokenizers/mistralai__Magistral-Small-2507__tokenizer.json.br",
  },
  {
    family: "ministral-3",
    packageName: "mistral",
    moduleName: "ministral_3",
    source: "vendor/tokenizers/mistralai__Ministral-3-3B-Base-2512__tokenizer.json.br",
  },
  {
    family: "mistral-7b-v0.1",
    packageName: "mistral",
    moduleName: "mistral_7b_v0_1",
    source: "vendor/tokenizers/mistralai__Mistral-7B-v0.1__tokenizer.json.br",
  },
  {
    family: "mistral-7b-v0.3",
    packageName: "mistral",
    moduleName: "mistral_7b_v0_3",
    source: "vendor/tokenizers/mistralai__Mistral-7B-v0.3__tokenizer.json.br",
  },
  {
    family: "mistral-nemo",
    packageName: "mistral",
    moduleName: "mistral_nemo",
    source: "vendor/tokenizers/mistralai__Mistral-Nemo-Base-2407__tokenizer.json.br",
  },
  {
    family: "mistral-small-3.2",
    packageName: "mistral",
    moduleName: "mistral_small_3_2",
    source: "vendor/tokenizers/mistralai__Mistral-Small-3.2-24B-Instruct-2506__tokenizer.json.br",
  },
  {
    family: "mistral-small-24b",
    packageName: "mistral",
    moduleName: "mistral_small_24b",
    source: "vendor/tokenizers/mistralai__Mistral-Small-24B-Base-2501__tokenizer.json.br",
  },
  {
    family: "mixtral-8x7b",
    packageName: "mistral",
    moduleName: "mixtral_8x7b",
    source: "vendor/tokenizers/mistralai__Mixtral-8x7B-v0.1__tokenizer.json.br",
  },
  {
    family: "cosmo-1b",
    packageName: "huggingface-tb",
    moduleName: "cosmo_1b",
    source: "vendor/tokenizers/HuggingFaceTB__cosmo-1b__tokenizer.json.br",
  },
  {
    family: "smollm",
    packageName: "huggingface-tb",
    moduleName: "smollm",
    source: "vendor/tokenizers/HuggingFaceTB__SmolLM-135M__tokenizer.json.br",
  },
  {
    family: "smollm-1.7b",
    packageName: "huggingface-tb",
    moduleName: "smollm_1_7b",
    source: "vendor/tokenizers/HuggingFaceTB__SmolLM-1.7B__tokenizer.json.br",
  },
  {
    family: "smollm2-16k",
    packageName: "huggingface-tb",
    moduleName: "smollm2_16k",
    source: "vendor/tokenizers/HuggingFaceTB__SmolLM2-1.7B-Instruct-16k__tokenizer.json.br",
  },
  {
    family: "smollm3",
    packageName: "huggingface-tb",
    moduleName: "smollm3",
    source: "vendor/tokenizers/HuggingFaceTB__SmolLM3-3B__tokenizer.json.br",
  },
  {
    family: "smollm3-base",
    packageName: "huggingface-tb",
    moduleName: "smollm3_base",
    source: "vendor/tokenizers/HuggingFaceTB__SmolLM3-3B-Base__tokenizer.json.br",
  },
  {
    family: "olmo",
    packageName: "allenai",
    moduleName: "olmo",
    source: "vendor/tokenizers/allenai__OLMo-1B__tokenizer.json.br",
  },
  {
    family: "olmo-1",
    packageName: "allenai",
    moduleName: "olmo_1",
    source: "vendor/tokenizers/allenai__OLMo-1B-hf__tokenizer.json.br",
  },
  {
    family: "olmo-0424",
    packageName: "allenai",
    moduleName: "olmo_0424",
    source: "vendor/tokenizers/allenai__OLMo-7B-0424-hf__tokenizer.json.br",
  },
  {
    family: "olmo-2",
    packageName: "allenai",
    moduleName: "olmo_2",
    source: "vendor/tokenizers/allenai__OLMo-2-1124-13B__tokenizer.json.br",
  },
  {
    family: "olmo-3-instruct",
    packageName: "allenai",
    moduleName: "olmo_3_instruct",
    source: "vendor/tokenizers/allenai__Olmo-3-7B-Instruct__tokenizer.json.br",
  },
  {
    family: "olmo-hybrid",
    packageName: "allenai",
    moduleName: "olmo_hybrid",
    source: "vendor/tokenizers/allenai__Olmo-Hybrid-7B__tokenizer.json.br",
  },
  {
    family: "olmo-hybrid-think",
    packageName: "allenai",
    moduleName: "olmo_hybrid_think",
    source: "vendor/tokenizers/allenai__Olmo-Hybrid-Think-SFT-7B__tokenizer.json.br",
  },
  {
    family: "olmoe",
    packageName: "allenai",
    moduleName: "olmoe",
    source: "vendor/tokenizers/allenai__OLMoE-1B-7B-0924__tokenizer.json.br",
  },
  {
    family: "olmoe-instruct",
    packageName: "allenai",
    moduleName: "olmoe_instruct",
    source: "vendor/tokenizers/allenai__OLMoE-1B-7B-0924-Instruct__tokenizer.json.br",
  },
  {
    family: "olmoe-0125",
    packageName: "allenai",
    moduleName: "olmoe_0125",
    source: "vendor/tokenizers/allenai__OLMoE-1B-7B-0125__tokenizer.json.br",
  },
  {
    family: "olmoe-0125-instruct",
    packageName: "allenai",
    moduleName: "olmoe_0125_instruct",
    source: "vendor/tokenizers/allenai__OLMoE-1B-7B-0125-Instruct__tokenizer.json.br",
  },
  {
    family: "granite-3-instruct",
    packageName: "ibm-granite",
    moduleName: "granite_3_instruct",
    source: "vendor/tokenizers/ibm-granite__granite-3.0-2b-instruct__tokenizer.json.br",
  },
  {
    family: "granite-3.3-base",
    packageName: "ibm-granite",
    moduleName: "granite_3_3_base",
    source: "vendor/tokenizers/ibm-granite__granite-3.3-8b-base__tokenizer.json.br",
  },
  {
    family: "granite-3.3-instruct",
    packageName: "ibm-granite",
    moduleName: "granite_3_3_instruct",
    source: "vendor/tokenizers/ibm-granite__granite-3.3-8b-instruct__tokenizer.json.br",
  },
  {
    family: "granite-7b-base",
    packageName: "ibm-granite",
    moduleName: "granite_7b_base",
    source: "vendor/tokenizers/ibm-granite__granite-7b-base__tokenizer.json.br",
  },
  {
    family: "granite-7b-instruct",
    packageName: "ibm-granite",
    moduleName: "granite_7b_instruct",
    source: "vendor/tokenizers/ibm-granite__granite-7b-instruct__tokenizer.json.br",
  },
  {
    family: "granite-code-base",
    packageName: "ibm-granite",
    moduleName: "granite_code_base",
    source: "vendor/tokenizers/ibm-granite__granite-3b-code-base-2k__tokenizer.json.br",
  },
  {
    family: "granite-4",
    packageName: "ibm-granite",
    moduleName: "granite_4",
    source: "vendor/tokenizers/ibm-granite__granite-4.0-350m-base__tokenizer.json.br",
  },
  {
    family: "granite-4-tiny-base-preview",
    packageName: "ibm-granite",
    moduleName: "granite_4_tiny_base_preview",
    source: "vendor/tokenizers/ibm-granite__granite-4.0-tiny-base-preview__tokenizer.json.br",
  },
  {
    family: "granite-4-tiny-preview",
    packageName: "ibm-granite",
    moduleName: "granite_4_tiny_preview",
    source: "vendor/tokenizers/ibm-granite__granite-4.0-tiny-preview__tokenizer.json.br",
  },
  {
    family: "powerlm",
    packageName: "ibm-research",
    moduleName: "powerlm",
    source: "vendor/tokenizers/ibm-research__PowerLM-3b__tokenizer.json.br",
  },
  {
    family: "molm",
    packageName: "ibm-research",
    moduleName: "molm",
    source: "vendor/tokenizers/ibm-research__MoLM-350M-4B__tokenizer.json.br",
  },
  {
    family: "danube",
    packageName: "h2oai",
    moduleName: "danube",
    source: "vendor/tokenizers/h2oai__h2o-danube-1.8b-base__tokenizer.json.br",
  },
  {
    family: "danube2",
    packageName: "h2oai",
    moduleName: "danube2",
    source: "vendor/tokenizers/h2oai__h2o-danube2-1.8b-base__tokenizer.json.br",
  },
  {
    family: "danube3-500m-chat",
    packageName: "h2oai",
    moduleName: "danube3_500m_chat",
    source: "vendor/tokenizers/h2oai__h2o-danube3-500m-chat__tokenizer.json.br",
  },
  {
    family: "danube3-4b-chat",
    packageName: "h2oai",
    moduleName: "danube3_4b_chat",
    source: "vendor/tokenizers/h2oai__h2o-danube3-4b-chat__tokenizer.json.br",
  },
  {
    family: "danube3.1-4b-chat",
    packageName: "h2oai",
    moduleName: "danube3_1_4b_chat",
    source: "vendor/tokenizers/h2oai__h2o-danube3.1-4b-chat__tokenizer.json.br",
  },
  {
    family: "nanbeige4",
    packageName: "nanbeige",
    moduleName: "nanbeige4",
    source: "vendor/tokenizers/Nanbeige__Nanbeige4.1-3B__tokenizer.json.br",
  },
  {
    family: "nanbeige4-base",
    packageName: "nanbeige",
    moduleName: "nanbeige4_base",
    source: "vendor/tokenizers/Nanbeige__Nanbeige4-3B-Base__tokenizer.json.br",
  },
  {
    family: "ax-3.1",
    packageName: "skt",
    moduleName: "ax_3_1",
    source: "vendor/tokenizers/skt__A.X-3.1__tokenizer.json.br",
  },
  {
    family: "ax-light",
    packageName: "skt",
    moduleName: "ax_light",
    source: "vendor/tokenizers/skt__A.X-3.1-Light__tokenizer.json.br",
  },
  {
    family: "ax-k1",
    packageName: "skt",
    moduleName: "ax_k1",
    source: "vendor/tokenizers/skt__A.X-K1__tokenizer.json.br",
  },
  {
    family: "solar",
    packageName: "upstage",
    moduleName: "solar",
    source: "vendor/tokenizers/upstage__SOLAR-10.7B-v1.0__tokenizer.json.br",
  },
  {
    family: "solar-pro",
    packageName: "upstage",
    moduleName: "solar_pro",
    source: "vendor/tokenizers/upstage__solar-pro-preview-instruct__tokenizer.json.br",
  },
  {
    family: "gpt-oss",
    packageName: "openai",
    moduleName: "gpt_oss",
    source: "vendor/tokenizers/openai__gpt-oss-20b__tokenizer.json.br",
  },
  {
    family: "llada",
    packageName: "gsai-ml",
    moduleName: "llada",
    source: "vendor/tokenizers/GSAI-ML__LLaDA-8B-Instruct__tokenizer.json.br",
  },
  {
    family: "llada-base",
    packageName: "gsai-ml",
    moduleName: "llada_base",
    source: "vendor/tokenizers/GSAI-ML__LLaDA-8B-Base__tokenizer.json.br",
  },
  {
    family: "refusion",
    packageName: "gsai-ml",
    moduleName: "refusion",
    source: "vendor/tokenizers/GSAI-ML__ReFusion__tokenizer.json.br",
  },
  {
    family: "academic-ds",
    packageName: "bytedance-seed",
    moduleName: "academic_ds",
    source: "vendor/tokenizers/ByteDance-Seed__academic-ds-9B__tokenizer.json.br",
  },
  {
    family: "seed-oss",
    packageName: "bytedance-seed",
    moduleName: "seed_oss",
    source: "vendor/tokenizers/ByteDance-Seed__Seed-OSS-36B-Base__tokenizer.json.br",
  },
  {
    family: "seed-coder",
    packageName: "bytedance-seed",
    moduleName: "seed_coder",
    source: "vendor/tokenizers/ByteDance-Seed__Seed-Coder-8B-Base__tokenizer.json.br",
  },
  {
    family: "stable-diffcoder",
    packageName: "bytedance-seed",
    moduleName: "stable_diffcoder",
    source: "vendor/tokenizers/ByteDance-Seed__Stable-DiffCoder-8B-Base__tokenizer.json.br",
  },
  {
    family: "agentcpm-explore",
    packageName: "openbmb",
    moduleName: "agentcpm_explore",
    source: "vendor/tokenizers/openbmb__AgentCPM-Explore__tokenizer.json.br",
  },
  {
    family: "minicpm-s-1b",
    packageName: "openbmb",
    moduleName: "minicpm_s_1b",
    source: "vendor/tokenizers/openbmb__MiniCPM-S-1B-sft__tokenizer.json.br",
  },
  {
    family: "minicpm-sala",
    packageName: "openbmb",
    moduleName: "minicpm_sala",
    source: "vendor/tokenizers/openbmb__MiniCPM-SALA__tokenizer.json.br",
  },
  {
    family: "minicpm3",
    packageName: "openbmb",
    moduleName: "minicpm3",
    source: "vendor/tokenizers/openbmb__MiniCPM3-4B__tokenizer.json.br",
  },
  {
    family: "minicpm4",
    packageName: "openbmb",
    moduleName: "minicpm4",
    source: "vendor/tokenizers/openbmb__MiniCPM4-8B__tokenizer.json.br",
  },
  {
    family: "minicpm-moe",
    packageName: "openbmb",
    moduleName: "minicpm_moe",
    source: "vendor/tokenizers/openbmb__MiniCPM-MoE-8x2B__tokenizer.json.br",
  },
  {
    family: "qwen2",
    packageName: "qwen",
    moduleName: "qwen2",
    source: "vendor/tokenizers/Qwen__Qwen2-0.5B__tokenizer.json.br",
  },
  {
    family: "qwen2.5",
    packageName: "qwen",
    moduleName: "qwen2_5",
    source: "vendor/tokenizers/Qwen__Qwen2.5-0.5B__tokenizer.json.br",
  },
  {
    family: "qwen3",
    packageName: "qwen",
    moduleName: "qwen3",
    source: "vendor/tokenizers/Qwen__Qwen3-0.6B__tokenizer.json.br",
  },
  {
    family: "qwen3.5",
    packageName: "qwen",
    moduleName: "qwen3_5",
    source: "vendor/tokenizers/Qwen__Qwen3.5-0.8B__tokenizer.json.br",
  },
  {
    family: "qwen3.5-base",
    packageName: "qwen",
    moduleName: "qwen3_5_base",
    source: "vendor/tokenizers/Qwen__Qwen3.5-0.8B-Base__tokenizer.json.br",
  },
  {
    family: "qwen3-coder-next",
    packageName: "qwen",
    moduleName: "qwen3_coder_next",
    source: "vendor/tokenizers/Qwen__Qwen3-Coder-Next__tokenizer.json.br",
  },
  {
    family: "deepseek-v3",
    packageName: "deepseek",
    moduleName: "deepseek_v3",
    source: "vendor/tokenizers/deepseek-ai__DeepSeek-V3-0324__tokenizer.json.br",
  },
  {
    family: "deepseek-r1",
    packageName: "deepseek",
    moduleName: "deepseek_r1",
    source: "vendor/tokenizers/deepseek-ai__DeepSeek-R1__tokenizer.json.br",
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
    family: "distilgpt2",
    packageName: "distilbert",
    moduleName: "distilgpt2",
    source: "vendor/tokenizers/distilbert__distilgpt2__tokenizer.json.br",
  },
  {
    family: "gigachat-20b-base",
    packageName: "ai-sage",
    moduleName: "gigachat_20b_base",
    source: "vendor/tokenizers/ai-sage__GigaChat-20B-A3B-base__tokenizer.json.br",
  },
  {
    family: "gigachat-20b-instruct",
    packageName: "ai-sage",
    moduleName: "gigachat_20b_instruct",
    source: "vendor/tokenizers/ai-sage__GigaChat-20B-A3B-instruct__tokenizer.json.br",
  },
  {
    family: "gigachat3",
    packageName: "ai-sage",
    moduleName: "gigachat3",
    source: "vendor/tokenizers/ai-sage__GigaChat3-10B-A1.8B-base__tokenizer.json.br",
  },
  {
    family: "gigachat3.1",
    packageName: "ai-sage",
    moduleName: "gigachat3_1",
    source: "vendor/tokenizers/ai-sage__GigaChat3.1-10B-A1.8B__tokenizer.json.br",
  },
  {
    family: "rnj-1",
    packageName: "essentialai",
    moduleName: "rnj_1",
    source: "vendor/tokenizers/EssentialAI__rnj-1__tokenizer.json.br",
  },
  {
    family: "apriel-5b",
    packageName: "servicenow-ai",
    moduleName: "apriel_5b",
    source: "vendor/tokenizers/ServiceNow-AI__Apriel-5B-Base__tokenizer.json.br",
  },
  {
    family: "codegen",
    packageName: "salesforce",
    moduleName: "codegen",
    source: "vendor/tokenizers/Salesforce__codegen-350M-mono__tokenizer.json.br",
  },
  {
    family: "codegen-nl",
    packageName: "salesforce",
    moduleName: "codegen_nl",
    source: "vendor/tokenizers/Salesforce__codegen-350M-nl__tokenizer.json.br",
  },
  {
    family: "codegen2",
    packageName: "salesforce",
    moduleName: "codegen2",
    source: "vendor/tokenizers/Salesforce__codegen2-1B_P__tokenizer.json.br",
  },
  {
    family: "cerebras-gpt",
    packageName: "cerebras",
    moduleName: "cerebras_gpt",
    source: "vendor/tokenizers/cerebras__Cerebras-GPT-111M__tokenizer.json.br",
  },
  {
    family: "btlm-3b-8k-chat",
    packageName: "cerebras",
    moduleName: "btlm_3b_8k_chat",
    source: "vendor/tokenizers/cerebras__btlm-3b-8k-chat__tokenizer.json.br",
  },
  {
    family: "llada2",
    packageName: "inclusionai",
    moduleName: "llada2",
    source: "vendor/tokenizers/inclusionAI__LLaDA2.1-mini__tokenizer.json.br",
  },
  {
    family: "ring-2.5-1t",
    packageName: "inclusionai",
    moduleName: "ring_2_5_1t",
    source: "vendor/tokenizers/inclusionAI__Ring-2.5-1T__tokenizer.json.br",
  },
  {
    family: "ling-2",
    packageName: "inclusionai",
    moduleName: "ling_2",
    source: "vendor/tokenizers/inclusionAI__Ling-mini-2.0__tokenizer.json.br",
  },
  {
    family: "ring-mini-2.0",
    packageName: "inclusionai",
    moduleName: "ring_mini_2_0",
    source: "vendor/tokenizers/inclusionAI__Ring-mini-2.0__tokenizer.json.br",
  },
  {
    family: "ring-flash-2.0",
    packageName: "inclusionai",
    moduleName: "ring_flash_2_0",
    source: "vendor/tokenizers/inclusionAI__Ring-flash-2.0__tokenizer.json.br",
  },
  {
    family: "ring-1t",
    packageName: "inclusionai",
    moduleName: "ring_1t",
    source: "vendor/tokenizers/inclusionAI__Ring-1T__tokenizer.json.br",
  },
  {
    family: "pleias-350m",
    packageName: "pleias",
    moduleName: "pleias_350m",
    source: "vendor/tokenizers/PleIAs__Pleias-350m-Preview__tokenizer.json.br",
  },
  {
    family: "pleias-1.2b",
    packageName: "pleias",
    moduleName: "pleias_1_2b",
    source: "vendor/tokenizers/PleIAs__Pleias-1.2b-Preview__tokenizer.json.br",
  },
  {
    family: "pleias-3b",
    packageName: "pleias",
    moduleName: "pleias_3b",
    source: "vendor/tokenizers/PleIAs__Pleias-3b-Preview__tokenizer.json.br",
  },
  {
    family: "pleias-pico",
    packageName: "pleias",
    moduleName: "pleias_pico",
    source: "vendor/tokenizers/PleIAs__Pleias-Pico__tokenizer.json.br",
  },
  {
    family: "baguettotron",
    packageName: "pleias",
    moduleName: "baguettotron",
    source: "vendor/tokenizers/PleIAs__Baguettotron__tokenizer.json.br",
  },
  {
    family: "monad",
    packageName: "pleias",
    moduleName: "monad",
    source: "vendor/tokenizers/PleIAs__Monad__tokenizer.json.br",
  },
  {
    family: "trinity-large-truebase",
    packageName: "arcee-ai",
    moduleName: "trinity_large_truebase",
    source: "vendor/tokenizers/arcee-ai__Trinity-Large-TrueBase__tokenizer.json.br",
  },
  {
    family: "trinity-large",
    packageName: "arcee-ai",
    moduleName: "trinity_large",
    source: "vendor/tokenizers/arcee-ai__Trinity-Large-Base__tokenizer.json.br",
  },
  {
    family: "trinity-large-thinking",
    packageName: "arcee-ai",
    moduleName: "trinity_large_thinking",
    source: "vendor/tokenizers/arcee-ai__Trinity-Large-Thinking__tokenizer.json.br",
  },
  {
    family: "mamba-130m",
    packageName: "state-spaces",
    moduleName: "mamba_130m",
    source: "vendor/tokenizers/state-spaces__mamba-130m-hf__tokenizer.json.br",
  },
  {
    family: "mamba-790m",
    packageName: "state-spaces",
    moduleName: "mamba_790m",
    source: "vendor/tokenizers/state-spaces__mamba-790m-hf__tokenizer.json.br",
  },
  {
    family: "snowflake-arctic-base",
    packageName: "snowflake",
    moduleName: "snowflake_arctic_base",
    source: "vendor/tokenizers/Snowflake__snowflake-arctic-base__tokenizer.json.br",
  },
  {
    family: "snowflake-arctic-instruct",
    packageName: "snowflake",
    moduleName: "snowflake_arctic_instruct",
    source: "vendor/tokenizers/Snowflake__snowflake-arctic-instruct__tokenizer.json.br",
  },
  {
    family: "zamba-7b-v1",
    packageName: "zyphra",
    moduleName: "zamba_7b_v1",
    source: "vendor/tokenizers/Zyphra__Zamba-7B-v1__tokenizer.json.br",
  },
  {
    family: "zamba2-1.2b",
    packageName: "zyphra",
    moduleName: "zamba2_1_2b",
    source: "vendor/tokenizers/Zyphra__Zamba2-1.2B__tokenizer.json.br",
  },
  {
    family: "zamba2-2.7b",
    packageName: "zyphra",
    moduleName: "zamba2_2_7b",
    source: "vendor/tokenizers/Zyphra__Zamba2-2.7B__tokenizer.json.br",
  },
  {
    family: "zamba2-instruct",
    packageName: "zyphra",
    moduleName: "zamba2_instruct",
    source: "vendor/tokenizers/Zyphra__Zamba2-1.2B-instruct__tokenizer.json.br",
  },
  {
    family: "zamba2-instruct-v2",
    packageName: "zyphra",
    moduleName: "zamba2_instruct_v2",
    source: "vendor/tokenizers/Zyphra__Zamba2-1.2B-Instruct-v2__tokenizer.json.br",
  },
  {
    family: "zr1-1.5b",
    packageName: "zyphra",
    moduleName: "zr1_1_5b",
    source: "vendor/tokenizers/Zyphra__ZR1-1.5B__tokenizer.json.br",
  },
  {
    family: "zaya1",
    packageName: "zyphra",
    moduleName: "zaya1",
    source: "vendor/tokenizers/Zyphra__ZAYA1-base__tokenizer.json.br",
  },
  {
    family: "internlm2.5-1.8b",
    packageName: "internlm",
    moduleName: "internlm2_5_1_8b",
    source: "vendor/tokenizers/internlm__internlm2_5-1_8b__tokenizer.json.br",
  },
  {
    family: "internlm2.5-20b",
    packageName: "internlm",
    moduleName: "internlm2_5_20b",
    source: "vendor/tokenizers/internlm__internlm2_5-20b__tokenizer.json.br",
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
export function generateBuiltins(options = {}) {
  const selectedSpecs = filterFamilySpecs(FAMILY_SPECS, options)
  let writtenCount = 0
  let skippedCount = 0

  for (const spec of selectedSpecs) {
    const sourcePath = resolve(projectRoot, spec.source)
    const rawTokenizer = readTokenizerSnapshot(sourcePath)
    const packedAsset = packNormalizedAsset(rawTokenizer)
    const modulePath = resolve(
      projectRoot,
      resolveOutputModulePath(spec.packageName, spec.moduleName)
    )

    mkdirSync(dirname(modulePath), { recursive: true })
    if (writeFileIfChanged(modulePath, renderModule(spec.family, packedAsset))) {
      writtenCount += 1
    } else {
      skippedCount += 1
    }
  }

  return {
    selectedCount: selectedSpecs.length,
    writtenCount,
    skippedCount,
  }
}

if (isDirectExecution()) {
  generateBuiltins(parseGenerateCliArgs(process.argv.slice(2)))
}

/**
 * 过滤本轮需要生成的 family 清单。
 * 输入：完整 family specs 与可选的 family / package 过滤条件。
 * 输出：保持原顺序的目标 family specs 子集。
 */
export function filterFamilySpecs(familySpecs, { families = null, packageNames = null } = {}) {
  const familyFilter = families ? new Set(families) : null
  const packageFilter = packageNames ? new Set(packageNames) : null

  return familySpecs.filter((spec) => {
    if (familyFilter && !familyFilter.has(spec.family)) {
      return false
    }

    if (packageFilter && !packageFilter.has(spec.packageName)) {
      return false
    }

    return true
  })
}

/**
 * 解析 generate:builtins 的 CLI 参数。
 * 输入：命令行参数数组。
 * 输出：供 generateBuiltins 使用的过滤条件。
 */
function parseGenerateCliArgs(argv) {
  const options = {
    families: null,
    packageNames: null,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === "--families") {
      options.families = splitCsv(readRequiredArgValue(argv, ++index, "--families"))
      continue
    }

    if (argument === "--packages") {
      options.packageNames = splitCsv(readRequiredArgValue(argv, ++index, "--packages"))
      continue
    }

    throw new Error(`unknown argument: ${argument}`)
  }

  return options
}

/**
 * 读取缺失值时报错。
 * 输入：参数数组、目标索引和 flag 名称。
 * 输出：flag 后面的值字符串。
 */
function readRequiredArgValue(argv, index, flagName) {
  const value = argv[index]

  if (value === undefined) {
    throw new Error(`missing value for ${flagName}`)
  }

  return value
}

/**
 * 把逗号分隔参数切成数组。
 * 输入：例如 `pleias-350m,monad` 这样的字符串。
 * 输出：去空白后的名称数组。
 */
function splitCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
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
  const modelType = inferBpeModelType(rawTokenizer)

  if (modelType !== "BPE") {
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
 * 兼容老版 GPT-2 风格 tokenizer.json 未显式写出 model.type 的情况。
 * 输入：原始 tokenizer.json 对象。
 * 输出：推断出的 model type。
 */
function inferBpeModelType(rawTokenizer) {
  if (rawTokenizer?.model?.type === "BPE") {
    return "BPE"
  }

  if (rawTokenizer?.model?.vocab && rawTokenizer?.model?.merges) {
    return "BPE"
  }

  return undefined
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
export function normalizeMergeTokenIdPairs(merges, tokenToId) {
  const normalizedMerges = Array.isArray(merges[0])
    ? merges
    : merges
        .map(parseStringMergeEntry)
        .filter((merge) => merge !== null)

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
 * 解析字符串格式的 merge 条目。
 * 输入：HF tokenizer.json 里的单条 merge 字符串。
 * 输出：有效 merge 返回 `[left, right]`；版本注释返回 null。
 */
function parseStringMergeEntry(merge) {
  if (!merge) {
    return null
  }

  if (/^#version:/i.test(merge)) {
    return null
  }

  const separatorIndex = merge.indexOf(" ")
  if (separatorIndex < 0) {
    throw new Error(`Invalid BPE merge entry: ${merge}`)
  }

  return [merge.slice(0, separatorIndex), merge.slice(separatorIndex + 1)]
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
 * 仅在内容变化时更新目标文件。
 * 输入：目标文件路径与渲染后的源码文本。
 * 输出：写入了新内容时返回 true，否则返回 false。
 */
export function writeFileIfChanged(targetPath, content) {
  try {
    if (readFileSync(targetPath, "utf8") === content) {
      return false
    }
  } catch {
    // 文件不存在时直接写入。
  }

  writeFileSync(targetPath, content)
  return true
}

/**
 * 判断当前模块是否以脚本方式直接运行。
 * 输入：无。
 * 输出：直接通过 node 执行时返回 true，被测试或其他模块导入时返回 false。
 */
function isDirectExecution() {
  return process.argv[1] ? resolve(process.argv[1]) === currentScriptPath : false
}
