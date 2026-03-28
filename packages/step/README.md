# @cyberlangke/tokkit-step

Step family 的 tokkit 子包，只包含 Step 相关 tokenizer。

## 支持的模型

- [`stepfun-ai/Step-3.5-Flash`](https://huggingface.co/stepfun-ai/Step-3.5-Flash)

## 使用方法

```bash
npm install @cyberlangke/tokkit-step
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-step"

// 获取 Step family 对应的 tokenizer。
const tokenizer = await getTokenizer("step-3.5-flash")

console.log(tokenizer.vocabSize)
```
