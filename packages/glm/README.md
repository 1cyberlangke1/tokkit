# @cyberlangke/tokkit-glm

GLM family 的 tokkit 子包，只包含 GLM 相关 tokenizer。

## 支持的模型

- `glm-4.7`
  - [`zai-org/GLM-4.5`](https://huggingface.co/zai-org/GLM-4.5)
  - [`zai-org/GLM-4.5-Base`](https://huggingface.co/zai-org/GLM-4.5-Base)
  - [`zai-org/GLM-4.5-Air`](https://huggingface.co/zai-org/GLM-4.5-Air)
  - [`zai-org/GLM-4.5-Air-Base`](https://huggingface.co/zai-org/GLM-4.5-Air-Base)
  - [`zai-org/GLM-4.6`](https://huggingface.co/zai-org/GLM-4.6)
  - [`zai-org/GLM-4.7`](https://huggingface.co/zai-org/GLM-4.7)
- `glm-5`
  - [`zai-org/GLM-4.7-Flash`](https://huggingface.co/zai-org/GLM-4.7-Flash)
  - [`zai-org/GLM-5`](https://huggingface.co/zai-org/GLM-5)
- `glm-4-0414`
  - [`zai-org/GLM-4-9B-0414`](https://huggingface.co/zai-org/GLM-4-9B-0414)
  - [`zai-org/GLM-4-32B-0414`](https://huggingface.co/zai-org/GLM-4-32B-0414)
  - [`zai-org/GLM-4-32B-Base-0414`](https://huggingface.co/zai-org/GLM-4-32B-Base-0414)
  - [`zai-org/GLM-Z1-9B-0414`](https://huggingface.co/zai-org/GLM-Z1-9B-0414)
  - [`zai-org/GLM-Z1-32B-0414`](https://huggingface.co/zai-org/GLM-Z1-32B-0414)
  - [`zai-org/GLM-Z1-Rumination-32B-0414`](https://huggingface.co/zai-org/GLM-Z1-Rumination-32B-0414)

## 使用方法

```bash
npm install @cyberlangke/tokkit-glm
```

```ts
import { countTokens } from "@cyberlangke/tokkit-glm"

// 直接统计文本的 token 数量。
const count = await countTokens("你好，世界！", "glm-5", {
  addSpecialTokens: false,
})

console.log(count)
```
