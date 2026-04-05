#!/usr/bin/env bash
# docs-audit.sh — Documentation accuracy audit
# Verifies that FRONTEND.md and BACKEND.md accurately reflect the codebase.
# Exits 1 if any phase fails; exits 0 if all pass.
# Usage: bash scripts/docs-audit.sh
#        VERBOSE=1 bash scripts/docs-audit.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DOC="$REPO_ROOT/docs/FRONTEND.md"
BACKEND_DOC="$REPO_ROOT/docs/BACKEND.md"
COMPONENTS_DIR="$REPO_ROOT/src/components"
FUNCTIONS_DIR="$REPO_ROOT/supabase/functions"
VERBOSE="${VERBOSE:-0}"
OVERALL_FAIL=0

_ok()    { echo "  ✅ $*"; }
_error() { echo "  ❌ $*" >&2; OVERALL_FAIL=1; }
_warn()  { echo "  ⚠️  $*"; }

# ── Phase 1: Count actuals ────────────────────────────────────────────────────
echo ""
echo "=== Phase 1: Counting source files ==="

COMPONENT_FILES=()
while IFS= read -r -d '' f; do
  COMPONENT_FILES+=("$f")
done < <(find "$COMPONENTS_DIR" -name "*.tsx" ! -name "*.test.tsx" -type f -print0 2>/dev/null)
COMPONENT_COUNT=${#COMPONENT_FILES[@]}
echo "  Components (*.tsx, not tests): $COMPONENT_COUNT"

HOOK_FILES=()
while IFS= read -r -d '' f; do
  HOOK_FILES+=("$f")
done < <(find "$REPO_ROOT/src" -name "use*.ts" ! -name "*.test.ts" -type f -print0 2>/dev/null)
HOOK_COUNT=${#HOOK_FILES[@]}
echo "  Hooks (use*.ts, not tests): $HOOK_COUNT"

FUNCTION_NAMES=()
if [ -d "$FUNCTIONS_DIR" ]; then
  while IFS= read -r -d '' d; do
    FUNCTION_NAMES+=("$(basename "$d")")
  done < <(find "$FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)
fi
FUNCTION_COUNT=${#FUNCTION_NAMES[@]}
echo "  Edge functions: $FUNCTION_COUNT"

# ── Phase 2: Undocumented components ─────────────────────────────────────────
echo ""
echo "=== Phase 2: Undocumented components ==="

if [ ! -f "$FRONTEND_DOC" ]; then
  _error "docs/FRONTEND.md not found — run setup to create it"
else
  UNDOC_COMPONENTS=()
  for f in "${COMPONENT_FILES[@]}"; do
    name="$(basename "$f" .tsx)"
    if ! grep -q "$name" "$FRONTEND_DOC" 2>/dev/null; then
      UNDOC_COMPONENTS+=("$name ($f)")
    fi
  done

  if [ ${#UNDOC_COMPONENTS[@]} -eq 0 ]; then
    _ok "All $COMPONENT_COUNT components are documented in FRONTEND.md"
  else
    _error "${#UNDOC_COMPONENTS[@]} component(s) missing from docs/FRONTEND.md"
    if [ "$VERBOSE" = "1" ]; then
      for c in "${UNDOC_COMPONENTS[@]}"; do echo "    - $c"; done
    else
      echo "    (set VERBOSE=1 for details)"
    fi
  fi
fi

# ── Phase 3: Undocumented hooks ───────────────────────────────────────────────
echo ""
echo "=== Phase 3: Undocumented hooks ==="

if [ "$HOOK_COUNT" -eq 0 ]; then
  _ok "No hooks exist — nothing to document"
elif [ ! -f "$FRONTEND_DOC" ]; then
  _error "docs/FRONTEND.md not found"
else
  UNDOC_HOOKS=()
  for f in "${HOOK_FILES[@]}"; do
    name="$(basename "$f" .ts)"
    if ! grep -q "$name" "$FRONTEND_DOC" 2>/dev/null; then
      UNDOC_HOOKS+=("$name ($f)")
    fi
  done

  if [ ${#UNDOC_HOOKS[@]} -eq 0 ]; then
    _ok "All $HOOK_COUNT hooks are documented in FRONTEND.md"
  else
    _error "${#UNDOC_HOOKS[@]} hook(s) missing from docs/FRONTEND.md"
    if [ "$VERBOSE" = "1" ]; then
      for h in "${UNDOC_HOOKS[@]}"; do echo "    - $h"; done
    else
      echo "    (set VERBOSE=1 for details)"
    fi
  fi
fi

# ── Phase 4: Undocumented backend functions ───────────────────────────────────
echo ""
echo "=== Phase 4: Undocumented backend functions ==="

if [ ! -f "$BACKEND_DOC" ]; then
  _error "docs/BACKEND.md not found — run setup to create it"
elif [ "$FUNCTION_COUNT" -eq 0 ]; then
  _ok "No backend functions found — nothing to document"
else
  UNDOC_FUNCTIONS=()
  for fn in "${FUNCTION_NAMES[@]}"; do
    if ! grep -q "$fn" "$BACKEND_DOC" 2>/dev/null; then
      UNDOC_FUNCTIONS+=("$fn")
    fi
  done

  if [ ${#UNDOC_FUNCTIONS[@]} -eq 0 ]; then
    _ok "All $FUNCTION_COUNT edge functions are documented in BACKEND.md"
  else
    _error "${#UNDOC_FUNCTIONS[@]} edge function(s) missing from docs/BACKEND.md"
    if [ "$VERBOSE" = "1" ]; then
      for fn in "${UNDOC_FUNCTIONS[@]}"; do echo "    - $fn"; done
    else
      echo "    (set VERBOSE=1 for details)"
    fi
  fi
fi

# ── Phase 5: Ghost components ─────────────────────────────────────────────────
echo ""
echo "=== Phase 5: Ghost components (in docs but not in src/) ==="

if [ -f "$FRONTEND_DOC" ]; then
  GHOST_COMPONENTS=()
  while IFS= read -r comp; do
    [ -z "$comp" ] && continue
    found=$(find "$COMPONENTS_DIR" -name "${comp}.tsx" ! -name "*.test.tsx" -type f 2>/dev/null | head -1)
    if [ -z "$found" ]; then
      GHOST_COMPONENTS+=("${comp}.tsx")
    fi
  done < <(grep -oE '[A-Z][a-zA-Z0-9]+\.tsx' "$FRONTEND_DOC" 2>/dev/null | sed 's/\.tsx$//' | sort -u)

  if [ ${#GHOST_COMPONENTS[@]} -eq 0 ]; then
    _ok "No ghost components in docs/FRONTEND.md"
  else
    _error "${#GHOST_COMPONENTS[@]} component(s) referenced in docs but not found in src/"
    if [ "$VERBOSE" = "1" ]; then
      for c in "${GHOST_COMPONENTS[@]}"; do echo "    - $c"; done
    else
      echo "    (set VERBOSE=1 for details)"
    fi
  fi
fi

# ── Phase 6: Ghost hooks ──────────────────────────────────────────────────────
echo ""
echo "=== Phase 6: Ghost hooks (in docs but not in src/) ==="

if [ -f "$FRONTEND_DOC" ]; then
  # Extract custom hook names (use+PascalCase) that appear as standalone identifiers
  # Exclude known React built-ins to avoid false positives
  REACT_BUILTINS="useState|useEffect|useMemo|useCallback|useRef|useContext|useReducer|useLayoutEffect|useImperativeHandle|useDebugValue|useId|useDeferredValue|useTransition|useSyncExternalStore"

  GHOST_HOOKS=()
  while IFS= read -r hook; do
    [ -z "$hook" ] && continue
    # Skip React built-in hooks
    if echo "$REACT_BUILTINS" | grep -qw "$hook" 2>/dev/null; then
      continue
    fi
    found=$(find "$REPO_ROOT/src" -name "${hook}.ts" ! -name "*.test.ts" -type f 2>/dev/null | head -1)
    if [ -z "$found" ]; then
      GHOST_HOOKS+=("${hook}.ts")
    fi
  done < <(grep -oE 'use[A-Z][a-zA-Z0-9]+' "$FRONTEND_DOC" 2>/dev/null | sort -u)

  if [ ${#GHOST_HOOKS[@]} -eq 0 ]; then
    _ok "No ghost hooks in docs/FRONTEND.md"
  else
    _error "${#GHOST_HOOKS[@]} hook(s) referenced in docs but not found in src/"
    if [ "$VERBOSE" = "1" ]; then
      for h in "${GHOST_HOOKS[@]}"; do echo "    - $h"; done
    else
      echo "    (set VERBOSE=1 for details)"
    fi
  fi
fi

# ── Phase 7: Numeric count verification ──────────────────────────────────────
echo ""
echo "=== Phase 7: Numeric count verification ==="

COUNT_FAIL=0
for doc in "$FRONTEND_DOC" "$BACKEND_DOC" "$REPO_ROOT/README.md" "$REPO_ROOT/CLAUDE.md"; do
  [ -f "$doc" ] || continue
  doc_name="$(basename "$doc")"

  while IFS= read -r line; do
    # "N components"
    if [[ "$line" =~ ^[^#]*([0-9]+)[[:space:]]+[Cc]omponents ]]; then
      claimed="${BASH_REMATCH[1]}"
      if [ "$claimed" != "$COMPONENT_COUNT" ]; then
        _error "$doc_name: claims '$claimed components' but actual count is $COMPONENT_COUNT"
        COUNT_FAIL=1
      fi
    fi
    # "N hooks"
    if [[ "$line" =~ ^[^#]*([0-9]+)[[:space:]]+[Hh]ooks ]]; then
      claimed="${BASH_REMATCH[1]}"
      if [ "$claimed" != "$HOOK_COUNT" ]; then
        _error "$doc_name: claims '$claimed hooks' but actual count is $HOOK_COUNT"
        COUNT_FAIL=1
      fi
    fi
    # "N edge functions" or "N Edge Functions"
    if [[ "$line" =~ ^[^#]*([0-9]+)[[:space:]]+[Ee]dge[[:space:]]+[Ff]unctions ]]; then
      claimed="${BASH_REMATCH[1]}"
      if [ "$claimed" != "$FUNCTION_COUNT" ]; then
        _error "$doc_name: claims '$claimed edge functions' but actual count is $FUNCTION_COUNT"
        COUNT_FAIL=1
      fi
    fi
  done < "$doc"
done

if [ "$COUNT_FAIL" -eq 0 ]; then
  _ok "Numeric counts in docs match actual source counts"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────"
if [ "$OVERALL_FAIL" -eq 1 ]; then
  echo "❌ Documentation audit FAILED — fix the issues above before pushing."
  echo "   Tip: run 'VERBOSE=1 bash scripts/docs-audit.sh' for file-level details."
  exit 1
else
  echo "✅ Documentation audit passed."
  exit 0
fi
