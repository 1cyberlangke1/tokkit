# @cyberlangke/tokkit-datajuicer

datajuicer 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `dj-refine-1b`
  - 覆盖 `datajuicer/LLaMA-1B-dj-refine-50B`
  - 覆盖 `datajuicer/LLaMA-1B-dj-refine-100B`
  - 覆盖 `datajuicer/LLaMA-1B-dj-refine-150B`
  - 覆盖 `datajuicer/LLaMA-1B-dj-refine-150B-instruct-4.7B`

说明：

- 当前只纳入 `datajuicer` 官方组织下公开 `tokenizer.json`、`license: apache-2.0` 的官方 `1B-dj-refine` 主线。
- 上述 `4` 个官方模型的 `tokenizer.json` SHA256 都是 `91bf98512883c20dcdac94cdbe33ecfc11765a00b99ca75c62adf63b488f2a17`，因此收口为同一个 `dj-refine-1b` family。
- `datajuicer/LLaMA-7B-EN-Chat-40k` 的官方 README 明确写明 built upon `huggyllama/llama-7b`，不作为新的官方主线 family。
- `datajuicer/LLaMA2-7B-ZH-Chat-52k` 的官方 README 明确写明 built upon `FlagAlpha/Atom-7B`，不作为新的官方主线 family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-datajuicer
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-datajuicer"

const tokenizer = await getTokenizer("datajuicer/LLaMA-1B-dj-refine-150B")
const sameTokenizer = await getTokenizer("dj-refine-1b")

console.log(tokenizer === sameTokenizer)
```
