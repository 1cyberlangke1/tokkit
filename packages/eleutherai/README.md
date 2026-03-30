# @cyberlangke/tokkit-eleutherai

EleutherAI 官方 tokenizer 的 tokkit 子包，当前包含 `GPT-Neo`、`GPT-J`、`GPT-NeoX`、`Pythia`、`Polyglot` 主线文本模型。

## 支持的模型

- [`EleutherAI/gpt-neo-125m`](https://huggingface.co/EleutherAI/gpt-neo-125m)
- [`EleutherAI/gpt-j-6b`](https://huggingface.co/EleutherAI/gpt-j-6b)
- [`EleutherAI/gpt-neox-20b`](https://huggingface.co/EleutherAI/gpt-neox-20b)
- [`EleutherAI/pythia-14m`](https://huggingface.co/EleutherAI/pythia-14m)
- [`EleutherAI/pythia-12b`](https://huggingface.co/EleutherAI/pythia-12b)
- [`EleutherAI/polyglot-ko-12.8b`](https://huggingface.co/EleutherAI/polyglot-ko-12.8b)

## 使用方法

```bash
npm install @cyberlangke/tokkit-eleutherai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-eleutherai"

const gptNeo = await getTokenizer("gpt-neo")
const gptJ = await getTokenizer("EleutherAI/gpt-j-6b")

console.log(gptNeo === gptJ) // true

const pythia = await getTokenizer("pythia")
const gptNeox = await getTokenizer("EleutherAI/gpt-neox-20b")

console.log(pythia === gptNeox) // true
```
