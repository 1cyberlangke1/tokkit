# @cyberlangke/tokkit-salesforce

Salesforce 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `codegen`
  - 覆盖 `Salesforce/codegen-350M-mono`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-350M-multi`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-2B-mono`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-2B-multi`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-6B-mono`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-6B-multi`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-16B-mono`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-16B-multi`
- `codegen-nl`
  - 覆盖 `Salesforce/codegen-350M-nl`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-2B-nl`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-6B-nl`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen-16B-nl`
- `codegen2`
  - 覆盖 `Salesforce/codegen2-1B_P`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen2-3_7B_P`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen2-7B_P`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Salesforce/codegen2-16B_P`

当前不纳入：

- `Salesforce/ctrl`
- `Salesforce/xgen-*`
- `Salesforce/codegen25-*`
- `Salesforce/xLAM-*`
- `Salesforce/*-gguf`
- `Salesforce/codet5-*`

说明：

- `codegen` 当前至少分成 `mono/multi`、`nl` 两组 tokenizer，不能把整个 `codegen` 系列先验当作单一 family。
- `codegen2` 与老 `codegen` 线的 tokenizer 也不同，因此单独保留 `codegen2` family。
- 当前子包同时分发 `bsd-3-clause` 和 `apache-2.0` 资产，所以包级许可证使用 `SEE LICENSE IN LICENSE`。

## 使用方法

```bash
npm install @cyberlangke/tokkit-salesforce
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-salesforce"

const mono = await getTokenizer("Salesforce/codegen-6B-mono")
const nl = await getTokenizer("codegen-nl")
const codegen2 = await getTokenizer("Salesforce/codegen2-7B_P")

console.log(mono.encode("def hello_world():\n    return 42"))
console.log(nl.encode("Write a summary about tokenization."))
console.log(codegen2.encode("SELECT * FROM users WHERE id = 42;"))
```
