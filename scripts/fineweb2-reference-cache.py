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
    parser.add_argument("--longTextEncoding")
    parser.add_argument("--maxEncodeChars", type=int)
    parser.add_argument("--maxConsecutiveSliceLen", type=int)
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


def split_text_for_long_text_encoding(
    text: str,
    long_text_encoding: str | None,
    max_encode_chars: int | None,
    max_consecutive_slice_len: int | None,
) -> list[str]:
    if (
        not long_text_encoding
        or long_text_encoding != "split-whitespaces-or-nonwhitespaces"
        or not max_encode_chars
        or not max_consecutive_slice_len
        or len(text) == 0
    ):
        return [text]

    chunks: list[str] = []
    for start in range(0, len(text), max_encode_chars):
        window = text[start : start + max_encode_chars]
        chunks.extend(
            split_whitespaces_or_nonwhitespaces(window, max_consecutive_slice_len)
        )

    return chunks or [text]


def split_whitespaces_or_nonwhitespaces(
    text: str, max_consecutive_slice_len: int
) -> list[str]:
    if len(text) == 0:
        return []

    chunks: list[str] = []
    current_slice_len = 0
    current_slice_is_space = text[0].isspace()
    slice_start = 0

    for index, character in enumerate(text):
        is_now_space = character.isspace()

        if current_slice_is_space ^ is_now_space:
            current_slice_len = 1
            current_slice_is_space = is_now_space
        else:
            current_slice_len += 1
            if current_slice_len > max_consecutive_slice_len:
                chunks.append(text[slice_start:index])
                slice_start = index
                current_slice_len = 1

    chunks.append(text[slice_start:])
    return chunks


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
        encoded_ids: list[int] = []
        for chunk in split_text_for_long_text_encoding(
            text,
            args.longTextEncoding,
            args.maxEncodeChars,
            args.maxConsecutiveSliceLen,
        ):
            encoded = tokenizer.encode(chunk, add_special_tokens=False)
            encoded_ids.extend(encoded.ids)
        record: dict[str, object] = {
            "encodeLength": len(encoded_ids),
            "encodeHash": hash_token_ids(encoded_ids),
            "decodeHash": None,
        }

        if args.checkDecode:
            decoded = tokenizer.decode(encoded_ids, skip_special_tokens=False)
            record["decodeHash"] = hash_text(decoded)

        records[line_number] = record

    print(json.dumps({"records": records}, ensure_ascii=False))


if __name__ == "__main__":
    main()
