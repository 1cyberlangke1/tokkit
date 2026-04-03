# @cyberlangke/tokkit-lightonai

LightOn 官方文本模型的 tokkit 子包。

当前纳入的官方主线模型：

- `lightonai/pagnol-small`
- `lightonai/pagnol-medium`
- `lightonai/pagnol-large`
- `lightonai/pagnol-xl`
- `lightonai/alfred-40b-0723`
- `lightonai/alfred-40b-1023`

当前不纳入：

- `lightonai/RITA_s`
- `lightonai/RITA_m`
- `lightonai/RITA_l`
- `lightonai/RITA_xl`
- `lightonai/FastVLM-*`

说明：

- `pagnol-small`、`pagnol-medium`、`pagnol-large` 共享同一 tokenizer，当前收口为 `pagnol` family。
- `pagnol-xl` 使用独立 tokenizer，当前收口为 `pagnol-xl` family。
- `alfred-40b-0723` 复用现有 `falcon-7b` family。
- `alfred-40b-1023` 使用独立 tokenizer，当前收口为 `alfred-40b-1023` family。
- `RITA_*` 当前是蛋白质序列模型，且模型页没有稳定的 MIT / Apache-2.0 许可证信号，不进入当前文本 BPE 主线。
- `FastVLM-*` 是多模态路线，不进入当前纯文本 BPE 主线。

## 使用方法

```bash
npm install @cyberlangke/tokkit-lightonai
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-lightonai"

const tokenizer = await getEncoding("lightonai/pagnol-small")

console.log(tokenizer.encode("Bonjour LightOn"))
```
