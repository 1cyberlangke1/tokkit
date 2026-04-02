# @cyberlangke/tokkit-internlm

InternLM 官方文本 tokenizer 的 tokkit 子包。

当前内置范围：

- `internlm2.5-1.8b`
  - 覆盖 `internlm/internlm2_5-1_8b`
- `internlm2.5-20b`
  - 覆盖 `internlm/internlm2_5-20b`
- `internlm3`
  - 覆盖 `internlm/internlm3-8b-instruct`
- `internlm/AlchemistCoder-L-7B`
  - 复用现有 `danube` family

说明：

- 当前只纳入许可证明确兼容且可公开下载官方 tokenizer 资产、并且能对齐当前 BPE 运行时边界的官方文本模型。
- `internlm3-8b-instruct` 的快照来自官方 `tokenizer.model`，按官方 `SentencePiece BPE` 行为转换成 HF 风格 `tokenizer.json` 后再压缩入库。
- `internlm2_5-7b` 许可证信号不够稳定，当前不默认纳入。
