# @cyberlangke/tokkit-xiaomi-mimo

XiaomiMiMo 官方 tokenizer 的 tokkit 子包，当前包含 MiMo 纯文本主线模型内置 family。

## 支持的模型

- [`XiaomiMiMo/MiMo-7B-Base`](https://huggingface.co/XiaomiMiMo/MiMo-7B-Base)
- [`XiaomiMiMo/MiMo-7B-RL`](https://huggingface.co/XiaomiMiMo/MiMo-7B-RL)
- [`XiaomiMiMo/MiMo-7B-SFT`](https://huggingface.co/XiaomiMiMo/MiMo-7B-SFT)
- [`XiaomiMiMo/MiMo-7B-RL-Zero`](https://huggingface.co/XiaomiMiMo/MiMo-7B-RL-Zero)
- [`XiaomiMiMo/MiMo-7B-RL-0530`](https://huggingface.co/XiaomiMiMo/MiMo-7B-RL-0530)
- [`XiaomiMiMo/MiMo-V2-Flash-Base`](https://huggingface.co/XiaomiMiMo/MiMo-V2-Flash-Base)
- [`XiaomiMiMo/MiMo-V2-Flash`](https://huggingface.co/XiaomiMiMo/MiMo-V2-Flash)

当前不纳入 `MiMo-VL-*`、音频线和其他非纯文本模型。

## 使用方法

```bash
npm install @cyberlangke/tokkit-xiaomi-mimo
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-xiaomi-mimo"

const tokenizer = await getTokenizer("mimo")
const sameTokenizer = await getTokenizer("XiaomiMiMo/MiMo-V2-Flash-Base")
const flash = await getTokenizer("mimo-v2-flash")

console.log(tokenizer === sameTokenizer) // true
console.log(tokenizer === flash) // false
```
