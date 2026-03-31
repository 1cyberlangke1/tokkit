# @cyberlangke/tokkit-mistral

Mistral family 的 tokkit 子包，只包含当前 Apache-2.0 且落在纯文本 BPE 边界内的官方 tokenizer。

部分较新的 Mistral 模型官方仓库只直接公开 `tekken.json`。这类 family 当前按官方 `mistral-common` 的 `Tekkenizer` 语义转换为标准 `tokenizer.json` 后再打包，行为对齐仍以官方实现为准。

## 支持的 family

- `devstral-small-2`：覆盖 `Devstral-Small-2-24B-Instruct-2512`，以及共享同一 tokenizer 的 `Ministral-3-* -Instruct`
- `devstral-small-2505`：覆盖 `Devstral-Small-2505`
- `leanstral-2603`：覆盖 `Leanstral-2603`
- `mathstral-7b`：覆盖 `Mathstral-7B-v0.1`
- `mamba-codestral-7b`：覆盖 `Mamba-Codestral-7B-v0.1`
- `magistral-small-2507`：覆盖 `Magistral-Small-2507`、`Magistral-Small-2509`
- `ministral-3`：覆盖 `Ministral-3-* -Base / -Reasoning`
- `mistral-7b-v0.1`：覆盖 `Mistral-7B-v0.1`、`Mistral-7B-Instruct-v0.1 / v0.2`，以及共享同一 tokenizer 的 `Mixtral-8x22B-v0.1`、`Mixtral-8x7B-Instruct-v0.1`
- `mistral-7b-v0.3`：覆盖 `Mistral-7B-v0.3`、`Mistral-7B-Instruct-v0.3`，以及共享同一 tokenizer 的 `Mixtral-8x22B-Instruct-v0.1`
- `mistral-nemo`：覆盖 `Mistral-Nemo-Base-2407`、`Mistral-Nemo-Instruct-2407`
- `mistral-small-3.2`：覆盖 `Mistral-Small-3.2-24B-Instruct-2506`，以及共享同一 tokenizer 的 `Devstral-Small-2507`、`Magistral-Small-2506`
- `mistral-small-24b`：覆盖 `Mistral-Small-24B-Base-2501`、`Mistral-Small-24B-Instruct-2501`
- `mixtral-8x7b`：覆盖 `Mixtral-8x7B-v0.1`

## 当前不纳入

- `Ministral-8B-Instruct-2410`
- `Mistral-Small-Instruct-2409`
- `Mistral-Large-Instruct-2407`
- `Mistral-Large-Instruct-2411`
- `Codestral-22B-v0.1`
- `Devstral-2-123B-Instruct-2512`

这些模型当前模型页许可证不在这个 Apache-2.0 子包边界内。

- `Mistral-Small-3.1-24B-*`
- `Mistral-Large-3-675B-*`
- `Mistral-Small-4-119B-2603`
- `Pixtral-*`
- `Voxtral-*`

这些模型属于多模态 / 语音路线，不在当前纯文本 BPE 主线内。

## 使用方法

```bash
npm install @cyberlangke/tokkit-mistral
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-mistral"

const tokenizer = await getTokenizer("ministral-3")

const sameTokenizer = await getTokenizer("mistralai/Ministral-3-14B-Reasoning-2512")

console.log(tokenizer === sameTokenizer) // true
```
