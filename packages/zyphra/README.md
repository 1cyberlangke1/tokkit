# @cyberlangke/tokkit-zyphra

Zyphra 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `zamba-7b-v1`
  - 覆盖 `Zyphra/Zamba-7B-v1`
- `zamba2-1.2b`
  - 覆盖 `Zyphra/Zamba2-1.2B`
- `zamba2-2.7b`
  - 覆盖 `Zyphra/Zamba2-2.7B`
- `zamba2-instruct`
  - 覆盖 `Zyphra/Zamba2-1.2B-instruct`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Zyphra/Zamba2-2.7B-instruct`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Zyphra/Zamba2-7B-Instruct`
- `zamba2-instruct-v2`
  - 覆盖 `Zyphra/Zamba2-1.2B-Instruct-v2`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Zyphra/Zamba2-2.7B-Instruct-v2`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Zyphra/Zamba2-7B-Instruct-v2`
- `zr1-1.5b`
  - 覆盖 `Zyphra/ZR1-1.5B`
- `zaya1`
  - 覆盖 `Zyphra/ZAYA1-base`
  - 也聚合当前确认完全复用同一 tokenizer 的 `Zyphra/ZAYA1-reasoning-base`

当前不纳入：

- `Zyphra/Zamba-7B-v1-phase1`
- `Zyphra/Zamba2-7B`
- `Zyphra/BlackMamba-*`
- `Zyphra/Mamba-370M`
- `Zyphra/ZUNA`

说明：

- `Zamba2` 当前存在多组彼此不同的 tokenizer，不能先验假设整个系列只复用一个 family。
- `Zyphra/Zamba2-7B` 当前是 gated 模型，匿名环境下无法稳定取得公开 tokenizer 快照，因此暂不并入当前公开子包。
- `Zyphra/ZR1-1.5B` 虽然 `model_type` 是 `qwen2`，但 `tokenizer.json` hash 与当前仓库内已有 `qwen2` family 不同，因此单独保留 `zr1-1.5b` family。
- `Zyphra/ZAYA1-base` 与 `Zyphra/ZAYA1-reasoning-base` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `zaya1` family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-zyphra
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-zyphra"

const zamba = await getTokenizer("zamba-7b-v1")
const zaya = await getTokenizer("Zyphra/ZAYA1-reasoning-base")

console.log(zamba.encode("Hello, Zyphra!"))
console.log(zaya.encode("Hello, Zyphra!"))
```
