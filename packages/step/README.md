# @cyberlangke/tokkit-step

Step family 的 tokkit 子包，只包含 Step 相关 tokenizer。

## 支持的模型

- [`stepfun-ai/Step-3.5-Flash`](https://huggingface.co/stepfun-ai/Step-3.5-Flash)
- [`stepfun-ai/Step-3.5-Flash-Base-Midtrain`](https://huggingface.co/stepfun-ai/Step-3.5-Flash-Base-Midtrain)

当前不包含 [`stepfun-ai/Step-3.5-Flash-Base`](https://huggingface.co/stepfun-ai/Step-3.5-Flash-Base)，因为官方仓库当前没有公开可下载的 `tokenizer.json`，暂时不满足本仓库的对拍与分发要求。

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
