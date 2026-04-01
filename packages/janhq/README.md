# @cyberlangke/tokkit-janhq

Jan 官方文本模型的 tokkit 子包。

当前纳入的官方主线模型：

- `janhq/Jan-v1-4B`
- `janhq/Jan-v1-edge`
- `janhq/Jan-v1-2509`
- `janhq/Jan-v3-4B-base-instruct`
- `janhq/Jan-v3.5-4B`
- `janhq/Jan-code-4b`

当前不纳入：

- `*-gguf`
- VL 线
- LoRA / checkpoint / 训练中间态

说明：

- 上述纳入模型的 `tokenizer.json` 已验 hash，当前都与已支持的 `qwen3` family 完全一致。
- 该子包不重复分发 tokenizer 快照，而是复用现有 `qwen3` family，并注册 Jan 官方模型别名。

## 使用方法

```bash
npm install @cyberlangke/tokkit-janhq
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-janhq"

const tokenizer = await getEncoding("janhq/Jan-v3.5-4B")

console.log(tokenizer.encode("Hello, Jan!"))
```
