# @cyberlangke/tokkit-tiiuae

tiiuae 官方 tokenizer 的 tokkit 子包，当前只包含许可证明确为 `apache-2.0` 的旧 Falcon 文本主线 family。

## 支持的模型

- [`tiiuae/falcon-rw-1b`](https://huggingface.co/tiiuae/falcon-rw-1b)
- [`tiiuae/falcon-rw-7b`](https://huggingface.co/tiiuae/falcon-rw-7b)
- [`tiiuae/falcon-7b`](https://huggingface.co/tiiuae/falcon-7b)
- [`tiiuae/falcon-7b-instruct`](https://huggingface.co/tiiuae/falcon-7b-instruct)
- [`tiiuae/falcon-40b`](https://huggingface.co/tiiuae/falcon-40b)
- [`tiiuae/falcon-40b-instruct`](https://huggingface.co/tiiuae/falcon-40b-instruct)

当前不纳入 `falcon-11B`、`falcon-180B*`（许可证未明确）以及 `falcon-mamba`、`Falcon3`、`Falcon-H1`、`Falcon-E`（`other` 许可证）。

## 使用方法

```bash
npm install @cyberlangke/tokkit-tiiuae
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-tiiuae"

const tokenizer = await getTokenizer("falcon-7b")

const sameTokenizer = await getTokenizer("tiiuae/falcon-40b-instruct")

console.log(tokenizer === sameTokenizer) // true
```
