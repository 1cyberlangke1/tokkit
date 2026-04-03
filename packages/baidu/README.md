# @cyberlangke/tokkit-baidu

baidu 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `ernie-4.5`
  - 覆盖 `baidu/ERNIE-4.5-0.3B-PT`
  - 覆盖 `baidu/ERNIE-4.5-0.3B-Base-PT`
  - 覆盖 `baidu/ERNIE-4.5-21B-A3B-PT`
  - 覆盖 `baidu/ERNIE-4.5-21B-A3B-Base-PT`
  - 覆盖 `baidu/ERNIE-4.5-300B-A47B-PT`
  - 覆盖 `baidu/ERNIE-4.5-300B-A47B-Base-PT`
- `ernie-4.5-thinking`
  - 覆盖 `baidu/ERNIE-4.5-21B-A3B-Thinking`

说明：

- 当前只纳入 `baidu` 官方组织下公开 `tokenizer.json`、`license: apache-2.0` 的官方 PT 主线。
- 上述 `6` 个 `PT / Base-PT` 官方模型的 `tokenizer.json` SHA256 都是 `4e5b4d49475d27c7ef7a61eea2d675f9cc013e91e3ddb5e06d964f5027c1814a`，因此收口为同一个 `ernie-4.5` family。
- `baidu/ERNIE-4.5-21B-A3B-Thinking` 的 `tokenizer.json` SHA256 是 `93a291ef6e5c89e6c0f2d5d004734ff429faa8ab925e39d71d2374b3d0daf49e`，当前收口为 `ernie-4.5-thinking` family。
- `baidu/*Paddle*` 当前是导出格式变体，且没有当前流水线要求的标准 `tokenizer.json`，不进入当前文本 BPE 主线。

## 使用方法

```bash
npm install @cyberlangke/tokkit-baidu
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-baidu"

const tokenizer = await getEncoding("baidu/ERNIE-4.5-21B-A3B-PT")
const sameTokenizer = await getEncoding("ernie-4.5")

console.log(tokenizer === sameTokenizer)
```
