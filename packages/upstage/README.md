# @cyberlangke/tokkit-upstage

Upstage 官方文本 tokenizer 的 tokkit 子包。

当前内置 family：

- `solar`
  - 覆盖 `upstage/SOLAR-10.7B-v1.0`
  - 也聚合当前确认完全复用同一 tokenizer 的 `upstage/TinySolar-248m-4k`
- `solar-pro`
  - 覆盖 `upstage/solar-pro-preview-instruct`

当前不纳入：

- `upstage/SOLAR-10.7B-Instruct-v1.0`
- `upstage/Solar-Open-100B`
- `upstage/solar-pro-preview-pretrained`
- `upstage/TinySolar-248m-4k-py`
- `upstage/TinySolar-248m-4k-py-instruct`
- `upstage/TinySolar-248m-4k-code-instruct`
- `upstage/llama-*`
- `upstage/Llama-2-70b-instruct`
- `upstage/SOLAR-0-70b-*`

## 使用方法

```bash
npm install @cyberlangke/tokkit-upstage
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-upstage"

const solar = await getTokenizer("solar")
const solarPro = await getTokenizer("upstage/solar-pro-preview-instruct")

console.log(solar.encode("Hello, Upstage!"))
console.log(solarPro.encode("Hello, Upstage!"))
```
