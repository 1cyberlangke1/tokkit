# @cyberlangke/tokkit-tinyllama

TinyLlama 官方文本模型的 tokkit 子包。

当前纳入的官方主线模型：

- `TinyLlama/TinyLlama_v1.1`
- `TinyLlama/TinyLlama-1.1B-Chat-v1.0`

当前不纳入：

- `TinyLlama/TinyLlama-1.1B-python-v0.1`
- `TinyLlama/TinyLlama_v1.1_chinese`
- `TinyLlama/TinyLlama_v1.1_math_code`
- `TinyLlama/TinyLlama-1.1B-step-*`
- `TinyLlama/TinyLlama-1.1B-intermediate-*`
- 旧 `Chat-v0.*` 与其他 checkpoint / 量化衍生物

说明：

- 以上纳入模型的 `tokenizer.json` 已验 hash，当前与已支持的 `danube` family 完全一致。
- 该子包不重复分发 tokenizer 快照，而是复用现有 `danube` family，并注册 TinyLlama 的官方模型别名。

## 使用方法

```bash
npm install @cyberlangke/tokkit-tinyllama
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-tinyllama"

const tokenizer = await getEncoding("TinyLlama/TinyLlama_v1.1")

console.log(tokenizer.encode("Hello, TinyLlama!"))
```
