# @cyberlangke/tokkit-primeintellect

PrimeIntellect 官方文本模型的 tokkit 子包。

当前纳入的官方主线模型：

- `PrimeIntellect/INTELLECT-1`
- `PrimeIntellect/INTELLECT-1-Instruct`

当前不纳入：

- `PrimeIntellect/INTELLECT-3`
- `PrimeIntellect/INTELLECT-3.1`
- `PrimeIntellect/INTELLECT-3-Base`
- `PrimeIntellect/INTELLECT-3-FP8`
- `PrimeIntellect/INTELLECT-1-fp32`
- `PrimeIntellect/INTELLECT-1-step-*`
- `PrimeIntellect/Qwen3-*`
- `PrimeIntellect/GLM-*`
- `PrimeIntellect/MiniMax-*`

说明：

- `INTELLECT-1` / `INTELLECT-1-Instruct` 已核对为标准 `BPE`，并与 `microsoft/bitnet-b1.58-2B-4T` 复用同一 tokenizer。
- 该子包不重复分发 tokenizer 快照，只注册 PrimeIntellect 的官方模型别名。
- `INTELLECT-3*` 当前属于基于 `GLM-4.5-Air-Base` 的继续训练模型，而且 tokenizer 不复用已支持官方 family，按当前仓库边界继续排除。

## 使用方法

```bash
npm install @cyberlangke/tokkit-primeintellect
```

```ts
import { getEncoding } from "@cyberlangke/tokkit-primeintellect"

const tokenizer = await getEncoding("PrimeIntellect/INTELLECT-1")

console.log(tokenizer.encode("Hello, PrimeIntellect!"))
```
