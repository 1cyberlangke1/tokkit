# @cyberlangke/tokkit-abeja

ABEJA 官方文本模型的 tokkit 子包。

当前纳入的官方主线模型：

- `abeja/ABEJA-Qwen2.5-32b-Japanese-v1.0`
- `abeja/ABEJA-Qwen2.5-7b-Japanese-v0.1`
- `abeja/ABEJA-QwQ32b-Reasoning-Japanese-v1.0`
- `abeja/ABEJA-Qwen3-14B-Agentic-256k-v0.1`

当前不纳入：

- `abeja/ABEJA-Qwen2.5-32b-Japanese-v0.1`
  - 已被 `v1.0` 取代，不再作为当前主线收口对象
- `abeja/gpt-neox-japanese-2.7b`
- `abeja/gpt2-large-japanese`
  - 旧研究线，不作为当前官方主线 LLM
- `abeja/Mixtral-8x7B-*`
  - `alpha` / `merged` 实验线，不作为当前稳定主线

说明：

- 以上纳入模型的 `tokenizer.json` 已验 hash。
- `abeja/ABEJA-Qwen2.5-32b-Japanese-v1.0`
- `abeja/ABEJA-Qwen2.5-7b-Japanese-v0.1`
- `abeja/ABEJA-QwQ32b-Reasoning-Japanese-v1.0`
  - 当前都与已支持的 `qwen2.5` family 完全一致。
- `abeja/ABEJA-Qwen3-14B-Agentic-256k-v0.1`
  - 当前与已支持的 `qwen3` family 完全一致。
- 该子包不重复分发 tokenizer 快照，而是复用现有 family，并注册 ABEJA 官方模型别名。

## 使用方法

```bash
npm install @cyberlangke/tokkit-abeja
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-abeja"

const tokenizer = await getEncoding("abeja/ABEJA-Qwen2.5-32b-Japanese-v1.0")

console.log(tokenizer.encode("こんにちは、ABEJA!"))
```
