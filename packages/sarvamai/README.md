# @cyberlangke/tokkit-sarvamai

sarvamai 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `sarvam-30b`
  - 覆盖 `sarvamai/sarvam-30b`
  - 也聚合当前确认完全复用同一 tokenizer 的 `sarvamai/sarvam-105b`
- `sarvam-m`
  - 覆盖 `sarvamai/sarvam-m`

当前不纳入：

- `sarvamai/sarvam-30b-fp8`
- `sarvamai/sarvam-105b-fp8`
- `sarvamai/sarvam-30b-gguf`
- `sarvamai/sarvam-105b-gguf`
- `sarvamai/sarvam-1`
- `sarvamai/sarvam-1-v0.5`

说明：

- 当前纳入范围只包含 `sarvamai` 官方组织下公开可下载、许可证满足当前 MIT / Apache-2.0 边界、且落在纯文本 BPE 范围内的主线模型。
- `sarvam-30b-fp8`、`sarvam-105b-fp8`、`sarvam-30b-gguf`、`sarvam-105b-gguf` 都属于发布格式衍生物，不作为独立支持目标。
- `sarvam-1` 当前许可证信号为空，先不默认纳入。
- `sarvam-1-v0.5` 当前是 `license: other`，不进入这一批。
- `sarvam-30b` 与 `sarvam-105b` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `sarvam-30b` family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-sarvamai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-sarvamai"

const dense = await getTokenizer("sarvamai/sarvam-105b")
const lightweight = await getTokenizer("sarvam-m")

console.log(dense !== lightweight)
```
