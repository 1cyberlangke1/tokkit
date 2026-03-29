"""Benchmark official tokenizer encode throughput via Python tokenizers fast backend."""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import brotli
from tokenizers import Tokenizer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--warmup", type=int, default=8)
    parser.add_argument("--iterations", type=int, default=80)
    return parser.parse_args()


def read_stdin_utf8() -> str:
    try:
        return sys.stdin.buffer.read().decode("utf-8")
    except UnicodeDecodeError as error:
        raise ValueError("benchmark sample stdin must be valid UTF-8") from error


def main() -> None:
    args = parse_args()
    sample = read_stdin_utf8()
    tokenizer_json = brotli.decompress(Path(args.source).read_bytes()).decode("utf-8")
    tokenizer = Tokenizer.from_str(tokenizer_json)

    for _ in range(args.warmup):
        tokenizer.encode(sample, add_special_tokens=False)

    expected_ids = tokenizer.encode(sample, add_special_tokens=False).ids
    started_at = time.perf_counter()

    for _ in range(args.iterations):
        tokenizer.encode(sample, add_special_tokens=False)

    duration_ms = (time.perf_counter() - started_at) * 1000
    print(json.dumps({"ids": expected_ids, "durationMs": round(duration_ms, 2)}))


if __name__ == "__main__":
    main()
