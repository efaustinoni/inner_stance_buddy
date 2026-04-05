#!/usr/bin/env bash
# test-audit.sh — Verify every component and hook has a test file.
# Reads scripts/.test-exceptions to exempt grandfathered files.
# Exits 1 if any non-exempt file is missing a test; exits 0 otherwise.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPONENTS_DIR="$REPO_ROOT/src/components"
EXCEPTIONS_FILE="$REPO_ROOT/scripts/.test-exceptions"

# Create exceptions file if it doesn't exist
if [ ! -f "$EXCEPTIONS_FILE" ]; then
  cat > "$EXCEPTIONS_FILE" <<'EOF'
# .test-exceptions — grandfathered files exempt from test coverage audit
# One filename per line (no path, no extension).
# Lines starting with # are comments.
EOF
  echo "  Created $EXCEPTIONS_FILE (empty)"
fi

# Load exemptions into an associative-like pattern
EXCEPTIONS=()
while IFS= read -r line; do
  # Strip carriage returns (Windows line endings)
  line="${line//$'\r'/}"
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  EXCEPTIONS+=("$line")
done < "$EXCEPTIONS_FILE"

is_exempt() {
  local name="$1"
  for ex in "${EXCEPTIONS[@]}"; do
    [ "$name" = "$ex" ] && return 0
  done
  return 1
}

# Filenames to always skip (regardless of exceptions file)
SKIP_NAMES=("index" "types" "Types" "constants" "Constants")
should_skip() {
  local name="$1"
  for s in "${SKIP_NAMES[@]}"; do
    [ "$name" = "$s" ] && return 0
  done
  return 1
}

echo ""
echo "=== Test Coverage Audit ==="

MISSING_TESTS=()
COMP_TOTAL=0
COMP_TESTED=0

# ── Scan all component directories recursively ────────────────────────────────
while IFS= read -r -d '' f; do
  name="$(basename "$f" .tsx)"
  should_skip "$name" && continue
  is_exempt "$name" && continue

  COMP_TOTAL=$((COMP_TOTAL + 1))
  dir="$(dirname "$f")"
  test_file="${dir}/${name}.test.tsx"

  if [ -f "$test_file" ]; then
    COMP_TESTED=$((COMP_TESTED + 1))
  else
    MISSING_TESTS+=("$(realpath --relative-to="$REPO_ROOT" "$f" 2>/dev/null || echo "$f")")
  fi
done < <(find "$COMPONENTS_DIR" -name "*.tsx" ! -name "*.test.tsx" -type f -print0 2>/dev/null)

# ── Scan hooks directories if they exist ─────────────────────────────────────
HOOK_TOTAL=0
HOOK_TESTED=0

for hdir in "$REPO_ROOT/src/hooks"; do
  [ -d "$hdir" ] || continue
  while IFS= read -r -d '' f; do
    name="$(basename "$f" .ts)"
    should_skip "$name" && continue
    is_exempt "$name" && continue

    HOOK_TOTAL=$((HOOK_TOTAL + 1))
    dir="$(dirname "$f")"
    test_file="${dir}/${name}.test.ts"

    if [ -f "$test_file" ]; then
      HOOK_TESTED=$((HOOK_TESTED + 1))
    else
      MISSING_TESTS+=("$(realpath --relative-to="$REPO_ROOT" "$f" 2>/dev/null || echo "$f")")
    fi
  done < <(find "$hdir" -name "use*.ts" ! -name "*.test.ts" -type f -print0 2>/dev/null)
done

# ── Report ────────────────────────────────────────────────────────────────────
echo "  Components: $COMP_TESTED/$COMP_TOTAL tested"
echo "  Hooks:      $HOOK_TESTED/$HOOK_TOTAL tested"

if [ ${#MISSING_TESTS[@]} -gt 0 ]; then
  echo ""
  echo "  ❌ Missing test files (${#MISSING_TESTS[@]}):"
  for f in "${MISSING_TESTS[@]}"; do
    echo "    - $f  →  add $(dirname "$f")/$(basename "$f" .tsx).test.tsx"
  done
  echo ""
  echo "  To exempt a file, add its name (without extension) to:"
  echo "    scripts/.test-exceptions"
  exit 1
else
  echo ""
  echo "  ✅ All non-exempt components and hooks have test files."
  exit 0
fi
