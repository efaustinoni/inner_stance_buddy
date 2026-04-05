#!/usr/bin/env bash
# file-size-audit.sh — Warn about source files exceeding 400 lines.
# Always exits 0 — this check is advisory only and never blocks a push.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
THRESHOLD=400

OFFENDERS=()

# Scan src/ and supabase/functions/ for TS/TSX source files (not tests)
while IFS= read -r -d '' f; do
  lines=$(wc -l < "$f" 2>/dev/null || echo 0)
  if [ "$lines" -gt "$THRESHOLD" ]; then
    rel="$(realpath --relative-to="$REPO_ROOT" "$f" 2>/dev/null || echo "$f")"
    OFFENDERS+=("$lines|$rel")
  fi
done < <(
  find "$REPO_ROOT/src" "$REPO_ROOT/supabase/functions" \
    -type f \( -name "*.ts" -o -name "*.tsx" \) \
    ! -name "*.test.ts" ! -name "*.test.tsx" \
    -print0 2>/dev/null
)

if [ ${#OFFENDERS[@]} -eq 0 ]; then
  echo "  ✅ No source files exceed $THRESHOLD lines."
else
  echo "  ⚠️  Files exceeding $THRESHOLD lines (advisory — consider refactoring):"
  # Sort by line count descending
  printf '%s\n' "${OFFENDERS[@]}" | sort -t'|' -k1 -rn | while IFS='|' read -r lines rel; do
    printf "    %4d lines  —  %s\n" "$lines" "$rel"
  done
fi

exit 0
