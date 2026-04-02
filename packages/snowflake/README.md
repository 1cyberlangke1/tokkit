# @cyberlangke/tokkit-snowflake

Snowflake 官方 Arctic 文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `snowflake-arctic-base`
  - 覆盖 `Snowflake/snowflake-arctic-base`
- `snowflake-arctic-instruct`
  - 覆盖 `Snowflake/snowflake-arctic-instruct`

当前不纳入：

- `Snowflake/snowflake-arctic-instruct-vllm`

说明：

- 当前纳入范围只包含 `Snowflake` 官方组织下公开可下载 `tokenizer.json` 的 Arctic 文本主线。
- `snowflake-arctic-base` 与 `snowflake-arctic-instruct` 的 `merges`、`normalizer`、`pre_tokenizer`、`decoder` 相同，但 `vocab` 与 `added_tokens` 不同，因此必须保留为两个独立 family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-snowflake
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-snowflake"

const base = await getTokenizer("snowflake-arctic-base")
const instruct = await getTokenizer("Snowflake/snowflake-arctic-instruct")

console.log(base === instruct)
```
