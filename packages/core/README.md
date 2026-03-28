# @cyberlangke/tokkit-core

Tokkit 的核心运行时包，提供 BPE 分词、反分词、注册表与自定义 family 注册能力。

## 使用方法

```bash
npm install @cyberlangke/tokkit-core
```

```ts
import { registerTokenizerFamily, getTokenizer } from "@cyberlangke/tokkit-core"

// 注册自定义 family 定义。
registerTokenizerFamily({
  family: "toy",
  asset: {
    added_tokens: [],
    model: {
      type: "BPE",
      vocab: { a: 0 },
      merges: [],
      unk_token: null,
    },
  },
})

// 获取刚注册的 tokenizer。
const tokenizer = await getTokenizer("toy")

console.log(tokenizer.encode("a"))
```
