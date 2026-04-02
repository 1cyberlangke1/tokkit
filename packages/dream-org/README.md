# @cyberlangke/tokkit-dream-org

Dream-org 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `dream-v0`
  - 覆盖 `Dream-org/Dream-v0-Base-7B`
  - 也聚合当前确认完全复用同一 tokenizer 的：
    - `Dream-org/Dream-v0-Instruct-7B`
    - `Dream-org/Dream-Coder-v0-Base-7B`
    - `Dream-org/Dream-Coder-v0-Instruct-7B`
- `dreamon-v0`
  - 覆盖 `Dream-org/DreamOn-v0-7B`

说明：

- 当前纳入范围只包含 `Dream-org` 官方组织下公开的纯文本主线模型。
- `Dream-v0-*` 与 `Dream-Coder-v0-*` 官方仓库没有直接提供 `tokenizer.json`；当前快照由官方 `vocab.json`、`merges.txt`、`added_tokens.json`、`tokenizer_config.json` 按官方 slow tokenizer 规则组装成 HF 风格 `tokenizer.json` 后压缩入库。
- `DreamOn-v0-7B` 在同一条 regex / ByteLevel 规则上使用独立 `vocab` 与 `added_tokens`，因此单独保留为 `dreamon-v0` family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-dream-org
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-dream-org"

const dream = await getTokenizer("Dream-org/Dream-Coder-v0-Instruct-7B")
const dreamon = await getTokenizer("dreamon-v0")

console.log(dream === dreamon)
```
