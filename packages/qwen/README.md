# @cyberlangke/tokkit-qwen

Qwen family 的 tokkit 子包，只包含当前 MIT / Apache-2.0 兼容的 Qwen 官方文本 tokenizer。

## 支持的 family

- `qwen2`：覆盖 `Qwen2-0.5B / 0.5B-Instruct / 1.5B / 1.5B-Instruct / 7B / 7B-Instruct`
- `qwen2.5`：覆盖 Apache-2.0 的 `Qwen2.5` 主线 / `Qwen2.5-Coder` 主线 / `Qwen2.5-Math` 主线，以及共享同一 tokenizer 的 `QwQ-32B-Preview`、`Qwen3-0.6B-Base / 1.7B-Base / 4B-Base / 8B-Base / 14B-Base`
- `qwen3`：覆盖 `Qwen3-0.6B / 1.7B / 4B / 8B / 14B / 30B-A3B / 32B / 235B-A22B` 及其当前 Apache-2.0 instruct / thinking / next 变体（含 `Qwen3-Next-80B-A3B-Thinking`）
- `qwen3.5`：覆盖 `Qwen3.5-0.8B / 2B / 4B / 9B / 27B / 35B-A3B / 122B-A10B / 397B-A17B`
- `qwen3.5-base`：覆盖 `Qwen3.5-0.8B-Base / 2B-Base / 4B-Base / 9B-Base / 35B-A3B-Base`
- `qwen3-coder-next`：覆盖 `Qwen3-Coder-Next / Qwen3-Coder-Next-Base / Qwen3-Coder-30B-A3B-Instruct / Qwen3-Coder-480B-A35B-Instruct`，以及共享同一 tokenizer 的 `Qwen3-30B-A3B-Thinking-2507`、`Qwen3-235B-A22B-Thinking-2507`、`QwQ-32B`

## 当前不纳入

- `Qwen2-72B-Instruct`
- `Qwen2.5-3B`
- `Qwen2.5-3B-Instruct`
- `Qwen2.5-72B`
- `Qwen2.5-72B-Instruct`
- `Qwen2.5-Coder-3B`
- `Qwen2.5-Coder-3B-Instruct`
- `Qwen2.5-Math-PRM-7B`

这些模型虽然有的共享已支持 tokenizer，但当前模型页许可证是 `other`，不适合直接并入这个 MIT / Apache-2.0 子包。

## 使用方法

```bash
npm install @cyberlangke/tokkit-qwen
```

```ts
import { getTokenizer } from "@cyberlangke/tokkit-qwen"

// 只安装 qwen 子包时，也能直接获取 qwen tokenizer。
const tokenizer = await getTokenizer("qwen3")

// 同系列模型名会映射到同一个 tokenizer family。
const sameTokenizer = await getTokenizer("Qwen/Qwen3-235B-A22B-Instruct-2507")

console.log(tokenizer === sameTokenizer) // true
```
