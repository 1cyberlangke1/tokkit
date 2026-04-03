# @cyberlangke/tokkit-ai21labs

ai21labs 官方 Jamba 文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `jamba2`
  - 覆盖 `ai21labs/AI21-Jamba2-Mini`
  - 也聚合当前确认完全复用同一 tokenizer 的 `ai21labs/AI21-Jamba2-3B`
  - 也聚合当前确认完全复用同一 tokenizer 的 `ai21labs/AI21-Jamba-Reasoning-3B`
- `jamba-v0.1`
  - 覆盖 `ai21labs/Jamba-v0.1`

当前不纳入：

- `ai21labs/AI21-Jamba-Mini-1.5`
- `ai21labs/AI21-Jamba-Large-1.5`
- `ai21labs/AI21-Jamba-Mini-1.6`
- `ai21labs/AI21-Jamba-Large-1.6`
- `ai21labs/AI21-Jamba-Mini-1.7`
- `ai21labs/AI21-Jamba-Large-1.7`
- `ai21labs/AI21-Jamba2-Mini-FP8`
- `ai21labs/AI21-Jamba-Reasoning-3B-GGUF`
- `ai21labs/Jamba-tiny-random`

说明：

- 当前纳入范围只包含 `ai21labs` 官方组织下公开可下载、`apache-2.0` 且非 gated 的文本主线。
- `AI21-Jamba-Mini/Large-1.5~1.7` 当前仍是 `gated: auto`，并且模型卡许可证为 `other`，因此不纳入这一批。
- `AI21-Jamba2-Mini`、`AI21-Jamba2-3B`、`AI21-Jamba-Reasoning-3B` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `jamba2` family。
- `AI21-Jamba2-Mini-FP8`、`AI21-Jamba-Reasoning-3B-GGUF` 属于发布格式衍生物，不作为独立支持目标。
- `Jamba-tiny-random` 是测试用途随机模型，不作为公开支持目标。

## 使用方法

```bash
npm install @cyberlangke/tokkit-ai21labs
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-ai21labs"

const jamba2 = await getTokenizer("ai21labs/AI21-Jamba-Reasoning-3B")
const legacy = await getTokenizer("jamba-v0.1")

console.log(jamba2 !== legacy)
```
