# @cyberlangke/tokkit-bsc-lt

BSC-LT 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `salamandra`
  - 覆盖 `BSC-LT/salamandra-2b`
  - 覆盖 `BSC-LT/salamandra-7b`
  - 覆盖 `BSC-LT/ALIA-40b`
  - 覆盖 `BSC-LT/ALIA-40b-instruct-2601`
- `salamandra-instruct`
  - 覆盖 `BSC-LT/salamandra-2b-instruct`
  - 覆盖 `BSC-LT/salamandra-7b-instruct`

说明：

- 当前只纳入 `BSC-LT` 官方组织下公开 `tokenizer.json`、非 gated、`license: apache-2.0` 且 `model.type = BPE` 的文本主线。
- `salamandra-7b-instruct-tools`、`salamandra-7b-instruct-tools-16k` 属于工具化变体，当前不纳入。
- `*-GGUF`、`*-GPTQ`、`*-FP8`、`*rag*`、`*aina-hack*`、`experimental*`、`Checkpoint_*`、`Flor-*` 等衍生或非当前主线对象不纳入。
- `salamandra-2b`、`salamandra-7b`、`ALIA-40b`、`ALIA-40b-instruct-2601` 的 `tokenizer.json` SHA256 一致，因此复用 `salamandra`。
- `salamandra-2b-instruct`、`salamandra-7b-instruct` 的 `tokenizer.json` SHA256 一致，因此复用 `salamandra-instruct`。

## 使用方法

```bash
npm install @cyberlangke/tokkit-bsc-lt
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-bsc-lt"

const base = await getTokenizer("BSC-LT/salamandra-7b")
const instruct = await getTokenizer("BSC-LT/salamandra-7b-instruct")

console.log(base !== instruct)
```
