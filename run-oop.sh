#!/usr/bin/env bash
set -u
cd "$(dirname "$0")"

case "${1:-}" in
  backend) command=(.venv/bin/python -m uvicorn seoul_cycle.main:app --host 127.0.0.1 --port 8000) ;;
  frontend) command=(npm --prefix frontend run preview) ;;
  *) echo "Usage: $0 backend|frontend" >&2; exit 2 ;;
esac

while true; do
  "${command[@]}"
  status=$?
  printf 'Process exited with status %s; restarting in 3 seconds.\n' "$status" >&2
  sleep 3
done
