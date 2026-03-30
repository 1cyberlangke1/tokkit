# @cyberlangke/tokkit-deepseek

DeepSeek family 的 tokkit 子包，只包含当前 MIT 兼容的 DeepSeek 主线 tokenizer。

## 支持的模型

- [`deepseek-ai/DeepSeek-V3-Base`](https://huggingface.co/deepseek-ai/DeepSeek-V3-Base)
- [`deepseek-ai/DeepSeek-V3`](https://huggingface.co/deepseek-ai/DeepSeek-V3)
- [`deepseek-ai/DeepSeek-V3-0324`](https://huggingface.co/deepseek-ai/DeepSeek-V3-0324)
- [`deepseek-ai/DeepSeek-R1`](https://huggingface.co/deepseek-ai/DeepSeek-R1)
- [`deepseek-ai/DeepSeek-R1-Zero`](https://huggingface.co/deepseek-ai/DeepSeek-R1-Zero)
- [`deepseek-ai/DeepSeek-R1-0528`](https://huggingface.co/deepseek-ai/DeepSeek-R1-0528)
- [`deepseek-ai/DeepSeek-V3.1-Base`](https://huggingface.co/deepseek-ai/DeepSeek-V3.1-Base)
- [`deepseek-ai/DeepSeek-V3.1`](https://huggingface.co/deepseek-ai/DeepSeek-V3.1)
- [`deepseek-ai/DeepSeek-V3.1-Terminus`](https://huggingface.co/deepseek-ai/DeepSeek-V3.1-Terminus)
- [`deepseek-ai/DeepSeek-V3.2-Exp-Base`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp-Base)
- [`deepseek-ai/DeepSeek-V3.2-Exp`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Exp)
- [`deepseek-ai/DeepSeek-V3.2`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2)
- [`deepseek-ai/DeepSeek-V3.2-Speciale`](https://huggingface.co/deepseek-ai/DeepSeek-V3.2-Speciale)

不包含 `DeepSeek-V2`、`DeepSeek-V2.5`、`DeepSeek-Coder-V2` 这类旧线，因为它们当前模型页使用 `deepseek` / `deepseek-license` 许可边界，不适合直接并入这个 MIT 包。

## 使用方法

```bash
npm install @cyberlangke/tokkit-deepseek
```

```ts
import { encode } from "@cyberlangke/tokkit-deepseek"

// 直接按 family 名编码文本。
const ids = await encode("Hello, world!", "deepseek-r1", {
  addSpecialTokens: false,
})

console.log(ids)
```
