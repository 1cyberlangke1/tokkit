# @cyberlangke/tokkit-stabilityai

Stability AI 官方文本模型的 tokkit 子包。

当前纳入的 Apache-2.0 主线模型：

- `stabilityai/stablecode-completion-alpha-3b`
- `stabilityai/stablecode-completion-alpha-3b-4k`
- `stabilityai/japanese-stablelm-base-gamma-7b`
- `stabilityai/japanese-stablelm-instruct-gamma-7b`
- `stabilityai/japanese-stablelm-3b-4e1t-base`
- `stabilityai/japanese-stablelm-3b-4e1t-instruct`

当前不纳入：

- `stabilityai/stablelm-base-alpha-*`
- `stabilityai/stablelm-tuned-alpha-*`
- `stabilityai/stablelm-zephyr-3b`
- `stabilityai/stablecode-instruct-alpha-3b`
- `stabilityai/stablelm-2-*`
- `stabilityai/ar-stablelm-2-base`
- `stabilityai/japanese-stablelm-base-alpha-7b`
- `stabilityai/japanese-stablelm-instruct-alpha-7b-v2`

说明：

- 当前纳入模型按公开 `tokenizer.json` 与本地 hash 核对，分别复用 `mamba-790m`、`mistral-7b-v0.1`、`granite-code-base`。
- 该子包不重复分发 tokenizer 快照，只注册 Stability AI 的官方模型别名。

## 使用方法

```bash
npm install @cyberlangke/tokkit-stabilityai
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-stabilityai"

const tokenizer = await getEncoding("stabilityai/stablecode-completion-alpha-3b")

console.log(tokenizer.encode("Hello, Stability AI!"))
```
