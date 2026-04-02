# @cyberlangke/tokkit-inclusionai

inclusionAI 官方文本模型的 tokkit 子包。

当前纳入的官方主线模型：

- 新 family：
  - `inclusionAI/LLaDA2.0-mini`
  - `inclusionAI/LLaDA2.0-flash`
  - `inclusionAI/LLaDA2.1-mini`
  - `inclusionAI/LLaDA2.1-flash`
  - `inclusionAI/LLaDA-MoE-7B-A1B-Base`
  - `inclusionAI/Ring-2.5-1T`
  - `inclusionAI/Ling-2.5-1T`
  - `inclusionAI/Ling-mini-2.0`
  - `inclusionAI/Ling-flash-2.0`
  - `inclusionAI/Ling-1T`
  - `inclusionAI/Ring-mini-2.0`
  - `inclusionAI/Ling-flash-base-2.0`
  - `inclusionAI/Ring-flash-2.0`
  - `inclusionAI/Ring-1T`
- 复用现有 `qwen` family：
  - `inclusionAI/GroveMoE-Base`
  - `inclusionAI/Qwen3-32B-AWorld`
  - `inclusionAI/AReaL-SEA-235B-A22B`
  - `inclusionAI/GroveMoE-Inst`
  - `inclusionAI/AReaL-boba-2-14B-Open`
  - `inclusionAI/AReaL-boba-2-8B-Open`
  - `inclusionAI/AReaL-boba-2-32B`
  - `inclusionAI/AReaL-boba-2-8B`
  - `inclusionAI/AReaL-boba-2-14B`

当前不纳入：

- `preview` / `distill` / `linear` / `CAP` / `exp` 后缀对象
- `FP8` / `GPTQ` / `AWQ` / `GGUF` / 其他量化衍生发布
- 早期 `Ling-lite*`、`Ling-plus*`、`Ling-Coder-lite*`、`Ring-lite*` 历史线

说明：

- `Qwen3-32B-AWorld`、`AReaL-*`、`GroveMoE-Inst` 当前与已支持的 `qwen3` family 完全一致。
- `GroveMoE-Base` 当前与已支持的 `qwen2.5` family 完全一致。
- `LLaDA2.0` / `2.1` / `LLaDA-MoE-7B-A1B-Base` 当前共享同一组 tokenizer，因此统一收口到 `llada2`。
- `Ling` / `Ring` 当前主线里还存在多组不同 tokenizer，当前按官方 hash 分组拆成 `ring-2.5-1t`、`ling-2`、`ring-mini-2.0`、`ring-flash-2.0`、`ring-1t`。

## 使用方法

```bash
npm install @cyberlangke/tokkit-inclusionai
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-inclusionai"

const llada = await getEncoding("inclusionAI/LLaDA2.1-mini")
const qwenAlias = await getEncoding("inclusionAI/Qwen3-32B-AWorld")

console.log(llada.encode("Hello, inclusionAI"))
console.log(qwenAlias.encode("Hello, AWorld"))
```
