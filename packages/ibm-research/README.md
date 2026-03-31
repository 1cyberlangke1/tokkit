# @cyberlangke/tokkit-ibm-research

IBM Research 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `powerlm`
  - 覆盖 `ibm-research/PowerLM-3b`
  - 也聚合当前确认完全复用同一 tokenizer 的 `ibm-research/PowerMoE-3b`
- `molm`
  - 覆盖 `ibm-research/MoLM-350M-4B`
  - 也聚合当前确认完全复用同一 tokenizer 的：
    - `ibm-research/MoLM-700M-4B`
    - `ibm-research/MoLM-700M-8B`

当前不纳入：

- `ibm-research/gpt2-medium-multiexit`
- `ibm-research/gpt-neo-125m-multiexit`
- `ibm-research/mpt-7b-instruct2`
- `ibm-research/merlinite-7b`
- `GGUF` 等量化 / 导出对象

说明：

- `PowerLM-3b` 与 `PowerMoE-3b` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `powerlm` family。
- `MoLM-350M-4B`、`MoLM-700M-4B` 与 `MoLM-700M-8B` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `molm` family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-ibm-research
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-ibm-research"

const powerlm = await getTokenizer("powerlm")
const molm = await getTokenizer("ibm-research/MoLM-700M-8B")

console.log(powerlm.encode("Hello, IBM Research!"))
console.log(molm.encode("Hello, IBM Research!"))
```
