"""서버나 API 키 없이 HTTP 계약을 내보낸다. 생성물은 직접 편집하지 않는다."""

import argparse
import json
from pathlib import Path

from seoul_cycle.main import createApp


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("contracts/openapi.json"))
    parser.add_argument("--check", action="store_true", help="쓰기 없이 생성물 일치 검사")
    args = parser.parse_args()
    contents = json.dumps(createApp().openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    output: Path = args.output
    if args.check:
        if not output.is_file() or output.read_text(encoding="utf-8") != contents:
            parser.exit(1, "OpenAPI 명세가 다릅니다. 계약 생성 명령을 실행하세요.\n")
        print("OpenAPI contract is up to date.")
        return
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(contents, encoding="utf-8", newline="\n")
    print(f"Exported {output}")


if __name__ == "__main__":
    main()
