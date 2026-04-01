# @cyberlangke/tokkit-internlm

InternLM 官方文本 tokenizer 的 tokkit 子包。

当前内置范围：

- `internlm2.5-1.8b`
  - 覆盖 `internlm/internlm2_5-1_8b`
- `internlm2.5-20b`
  - 覆盖 `internlm/internlm2_5-20b`
- `internlm/AlchemistCoder-L-7B`
  - 复用现有 `danube` family

说明：

- 当前只纳入许可证明确兼容且可公开下载标准 BPE `tokenizer.json` 的官方文本模型。
- `internlm3-8b-instruct` 当前只有 `tokenizer.model`，不在本仓库当前 BPE 主线范围内。
- `internlm2_5-7b` 许可证信号不够稳定，当前不默认纳入。
