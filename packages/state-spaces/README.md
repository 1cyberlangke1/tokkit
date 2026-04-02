# @cyberlangke/tokkit-state-spaces

state-spaces 官方 Mamba 文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `mamba-130m`
  - 覆盖 `state-spaces/mamba-130m-hf`
  - 也聚合当前确认完全复用同一 tokenizer 的 `state-spaces/mamba-370m-hf`
- `mamba-790m`
  - 覆盖 `state-spaces/mamba-790m-hf`
  - 也聚合当前确认完全复用同一 tokenizer 的 `state-spaces/mamba-1.4b-hf`
  - 也聚合当前确认完全复用同一 tokenizer 的 `state-spaces/mamba-2.8b-hf`

当前不纳入：

- `state-spaces/mamba2-*`
- `state-spaces/transformerpp-2.7b`
- `state-spaces/mamba2attn-2.7b`

说明：

- 当前纳入范围只包含官方 `*-hf` 仓库，因为这一组仓库直接公开了标准 `tokenizer.json`。
- 对应的原始 `state-spaces/mamba-*` 基座模型卡明确声明 `license: apache-2.0`；`*-hf` 仓库 README 明确说明它们是同组织发布的 transformers-compatible 兼容仓库，checkpoint 保持不变，只额外推送了 `config.json` 与 tokenizer。
- `state-spaces/mamba-130m-hf` 与 `state-spaces/mamba-370m-hf` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `mamba-130m` family。
- `state-spaces/mamba-790m-hf`、`state-spaces/mamba-1.4b-hf`、`state-spaces/mamba-2.8b-hf` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `mamba-790m` family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-state-spaces
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-state-spaces"

const small = await getTokenizer("mamba-130m")
const bigger = await getTokenizer("state-spaces/mamba-370m-hf")

console.log(small === bigger)
```
