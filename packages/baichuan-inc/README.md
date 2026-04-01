# @cyberlangke/tokkit-baichuan-inc

Baichuan 官方文本模型的 tokkit 子包。

当前纳入的官方主线模型：

- `baichuan-inc/Baichuan-M2-32B`
- `baichuan-inc/Baichuan-M3-235B`

当前不纳入：

- `Baichuan-7B` / `Baichuan-13B` / `Baichuan2-*` 旧线
- GPTQ / GGUF / FP8 等量化与衍生物

说明：

- 上述纳入模型的 `tokenizer.json` 已验 hash，当前都与已支持的 `qwen3` family 完全一致。
- 该子包不重复分发 tokenizer 快照，而是复用现有 `qwen3` family，并注册 Baichuan 官方模型别名。

## 使用方法

```bash
npm install @cyberlangke/tokkit-baichuan-inc
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-baichuan-inc"

const tokenizer = await getEncoding("baichuan-inc/Baichuan-M2-32B")

console.log(tokenizer.encode("Hello, Baichuan!"))
```
