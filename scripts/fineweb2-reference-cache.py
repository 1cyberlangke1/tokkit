"""FineWeb2 official reference cache prewarmer via Python tokenizers fast backend."""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path

import brotli
from tokenizers import Tokenizer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--file", required=True)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--maxChars", type=int, default=16384)
    parser.add_argument("--checkDecode", action="store_true")
    return parser.parse_args()


def collect_samples(file_path: Path, start: int, limit: int, max_chars: int) -> list[dict[str, object]]:
    samples: list[dict[str, object]] = []
    total_lines = 0
    passed_start = 0

    with file_path.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            total_lines += 1
            line = raw_line.strip()
            if not line:
                continue
            if total_lines <= start:
                continue

            record = json.loads(line)
            text = record.get("text")
            if not isinstance(text, str):
                raise ValueError(f"invalid FineWeb2 record on line {total_lines}")

            if max_chars > 0 and len(text) > max_chars:
                continue

            samples.append(
                {
                    "lineNumber": total_lines,
                    "text": text,
                }
            )
            passed_start += 1

            if limit > 0 and passed_start >= limit:
                break

    return samples


def hash_token_ids(ids: list[int]) -> str:
    if ids:
        payload = struct.pack(f"<{len(ids)}I", *ids)
    else:
        payload = b""
    return hashlib.sha256(payload).hexdigest()


def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def main() -> None:
    args = parse_args()
    source_path = Path(args.source)
    tokenizer_json = brotli.decompress(source_path.read_bytes()).decode("utf-8")
    tokenizer = Tokenizer.from_str(tokenizer_json)
    samples = collect_samples(Path(args.file), args.start, args.limit, args.maxChars)
    records: dict[str, dict[str, object]] = {}

    for sample in samples:
        line_number = str(sample["lineNumber"])
        text = sample["text"]
        encoded = tokenizer.encode(text, add_special_tokens=False)
        record: dict[str, object] = {
            "encodeLength": len(encoded.ids),
            "encodeHash": hash_token_ids(encoded.ids),
            "decodeHash": None,
        }

        if args.checkDecode:
            decoded = tokenizer.decode(encoded.ids, skip_special_tokens=False)
            record["decodeHash"] = hash_text(decoded)

        records[line_number] = record

    print(json.dumps({"records": records}, ensure_ascii=False))


if __name__ == "__main__":
    main()
