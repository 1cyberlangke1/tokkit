# @cyberlangke/tokkit-deepseek

DeepSeek family 的 tokkit 子包，只包含 DeepSeek 相关 tokenizer。

## 支持的模型

- [`deepseek-ai/DeepSeek-V3.1`](https://huggingface.co/deepseek-ai/DeepSeek-V3.1)
- [`deepseek-ai/DeepSeek-V3.2`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2)

## 使用方法

```bash
npm install @cyberlangke/tokkit-deepseek
```

```ts
import { encode } from "@cyberlangke/tokkit-deepseek"

// 直接按 family 名编码文本。
const ids = await encode("Hello, world!", "deepseek-v3.2", {
  addSpecialTokens: false,
})

console.log(ids)
```
