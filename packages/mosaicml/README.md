# @cyberlangke/tokkit-mosaicml

MosaicML 官方文本模型的 tokkit 子包。

当前纳入的官方主线模型：

- `mosaicml/mpt-7b`
- `mosaicml/mpt-7b-8k`
- `mosaicml/mpt-7b-storywriter`
- `mosaicml/mpt-30b`

当前不纳入：

- `mosaicml/mpt-7b-instruct`
- `mosaicml/mpt-7b-8k-instruct`
- `mosaicml/mpt-30b-instruct`
- `mosaicml/mpt-7b-chat`
- `mosaicml/mpt-7b-8k-chat`
- `mosaicml/mpt-30b-chat`
- `mosaicml/mpt-1b-redpajama-200b`

说明：

- 当前纳入模型按公开说明与本地 hash 核对，复用 `EleutherAI/gpt-neox-20b` 对应的 `pythia` family。
- 该子包不重复分发 tokenizer 快照，只注册 MosaicML 的官方模型别名。

## 使用方法

```bash
npm install @cyberlangke/tokkit-mosaicml
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-mosaicml"

const tokenizer = await getEncoding("mosaicml/mpt-7b")

console.log(tokenizer.encode("Hello, MosaicML!"))
```
