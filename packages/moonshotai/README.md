# @cyberlangke/tokkit-moonshotai

moonshotai 官方文本 tokenizer 的 tokkit 子包。

这是一个独立特殊协议子包，不包含在 `@cyberlangke/tokkit` 总包里。

当前内置 family：

- `kimi-k2`
  - 覆盖 `moonshotai/Kimi-K2-Base`
  - 覆盖 `moonshotai/Kimi-K2-Instruct`
  - 覆盖 `moonshotai/Kimi-K2-Instruct-0905`
  - 也聚合当前确认在 BPE / added token 行为上完全一致的：
    - `moonshotai/Kimi-Linear-48B-A3B-Base`
    - `moonshotai/Kimi-Linear-48B-A3B-Instruct`
- `kimi-k2-thinking`
  - 覆盖 `moonshotai/Kimi-K2-Thinking`
  - 该线额外引入了 `<think>` / `</think>` added tokens，因此与普通 `kimi-k2` 分开
- `moonlight`
  - 覆盖 `moonshotai/Moonlight-16B-A3B`
  - 也聚合当前确认完全复用同一 tokenizer 行为的 `moonshotai/Moonlight-16B-A3B-Instruct`
  - 该线的 added tokens 少于 `kimi-k2`，因此单独保留 family
- `kimi-dev`
  - 覆盖 `moonshotai/Kimi-Dev-72B`

说明：

- `Kimi-K2-*`、`Moonlight-*`、`Kimi-Linear-*` 虽然共享同一份 `tiktoken.model`，但 `tokenizer_config.json` 里的 added token 集不同，不能粗暴压成一个 family。
- `kimi-k2` 的模型之间当前只观察到 `chat_template` 差异；本项目不支持 chat template，因此仍可收口到同一个 family。
- `moonshotai/Kimi-Dev-72B` 当前是独立 tokenizer，不命中现有仓库 family。

## 使用方法

```bash
npm install @cyberlangke/tokkit-moonshotai
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-moonshotai"

const shared = await getTokenizer("moonshotai/Kimi-K2-Instruct-0905")
const thinking = await getTokenizer("kimi-k2-thinking")

console.log(shared === thinking) // false
```
