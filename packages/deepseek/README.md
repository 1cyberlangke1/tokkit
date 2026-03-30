# @cyberlangke/tokkit-deepseek

DeepSeek 官方 tokenizer 的 tokkit 子包。

当前内置 family：

- `deepseek-v3`
  - 覆盖 `deepseek-ai/DeepSeek-V3-0324`
- `deepseek-v3.1`
  - 覆盖 `deepseek-ai/DeepSeek-V3.1`
  - 也聚合当前确认完全复用同一 tokenizer 的 `DeepSeek-V3.1-Base`、`DeepSeek-V3.2-Exp`、`DeepSeek-V3.2-Exp-Base`
- `deepseek-r1`
  - 覆盖 `deepseek-ai/DeepSeek-R1`
  - 也聚合 `DeepSeek-R1-0528`、`DeepSeek-R1-Zero`
- `deepseek-v3.2`
  - 覆盖 `deepseek-ai/DeepSeek-V3.2`

当前不纳入：

- `deepseek-ai/DeepSeek-V3` 原版：仓库 `LICENSE-MODEL` 不是 MIT 兼容，不能进入当前 MIT 子包
- `DeepSeek-R1-Distill-*`：蒸馏模型
- `DeepSeek-V3.1-Terminus`：quantized 派生模型
- `DeepSeek-V3.2-Speciale`：finetune 派生模型
- `DeepSeek-Prover-*`、`DeepSeek-Math-*`、`ESFT-*`：专项 / 任务模型
- 旧 `deepseek-llm*`、`deepseek-coder*`、`DeepSeek-V2*`、`deepseek-moe*`：当前 HF API 许可证信号不是 MIT 兼容

## 使用方法

```bash
npm install @cyberlangke/tokkit-deepseek
```

```ts
import { encode } from "@cyberlangke/tokkit-deepseek"

const ids = await encode("Hello, world!", "deepseek-r1", {
  addSpecialTokens: false,
})

console.log(ids)
```
