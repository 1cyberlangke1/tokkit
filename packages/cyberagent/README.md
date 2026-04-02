# @cyberlangke/tokkit-cyberagent

cyberagent 官方文本 tokenizer 的 tokkit 子包。

这是一个独立特殊协议子包，不包含在 `@cyberlangke/tokkit` 总包里。

当前内置 family：

- `open-calm`
  - 覆盖 `cyberagent/open-calm-1b`
  - 覆盖 `cyberagent/open-calm-small`
  - 覆盖 `cyberagent/open-calm-medium`
  - 覆盖 `cyberagent/open-calm-3b`
  - 覆盖 `cyberagent/open-calm-large`
  - 覆盖 `cyberagent/open-calm-7b`
- `calm2`
  - 覆盖 `cyberagent/calm2-7b`
  - 覆盖 `cyberagent/calm2-7b-chat`
- `calm3`
  - 覆盖 `cyberagent/calm3-22b-chat`

当前不纳入：

- `cyberagent/Mistral-Nemo-Japanese-Instruct-2408`
- `cyberagent/DeepSeek-R1-Distill-Qwen-*`
- `cyberagent/calm2-7b-chat-dpo-experimental`
- `cyberagent/markupdm`

说明：

- `open-calm-*` 当前共享同一套 tokenizer。
- `calm2-7b` 与 `calm2-7b-chat` 当前共享同一套 tokenizer。
- `calm3-22b-chat` 当前使用独立 tokenizer。
- 由于该子包同时分发 `Apache-2.0` 与 `CC-BY-SA-4.0` 的 tokenizer 资产，因此不进入 `@cyberlangke/tokkit` 总包。

## 使用方法

```bash
npm install @cyberlangke/tokkit-cyberagent
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-cyberagent"

const openCalm = await getTokenizer("open-calm")
const calm2 = await getTokenizer("cyberagent/calm2-7b-chat")

console.log(openCalm === calm2)
```
