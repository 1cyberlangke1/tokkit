# @cyberlangke/tokkit-skt

SKT 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `ax-3.1`
  - 覆盖 `skt/A.X-3.1`
- `ax-light`
  - 覆盖 `skt/A.X-3.1-Light`
  - 也聚合当前确认完全复用同一 tokenizer 的 `skt/A.X-4.0-Light`
- `ax-k1`
  - 覆盖 `skt/A.X-K1`

当前不纳入：

- `skt/A.X-4.0`
- `skt/kogpt2-base-v2`
- `skt/ko-gpt-trinity-1.2B-v0.5`

说明：

- `A.X-3.1-Light` 与 `A.X-4.0-Light` 的 `tokenizer.json` SHA256 一致，因此收口到同一个 `ax-light` family。
- `A.X-3.1`、`A.X-K1` 的 `tokenizer.json` SHA256 都与 `ax-light` 不同，因此分别保留独立 family。
- `A.X-4.0` 当前模型页许可证是 `other`，不进入当前 Apache-2.0 子包。
- `kogpt2-base-v2` 与 `ko-gpt-trinity-1.2B-v0.5` 当前模型页许可证是 `cc-by-nc-sa-4.0`，不进入当前 Apache-2.0 子包。

## 使用方法

```bash
npm install @cyberlangke/tokkit-skt
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-skt"

const base = await getTokenizer("ax-3.1")
const light = await getTokenizer("skt/A.X-4.0-Light")

console.log(base.encode("Hello, SKT!"))
console.log(light.encode("Hello, SKT!"))
```
