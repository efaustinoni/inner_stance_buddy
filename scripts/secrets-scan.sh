#!/usr/bin/env bash
# secrets-scan.sh — Scan tracked source files for accidentally committed secrets.
# Exits 1 if any pattern matches; exits 0 if clean.
#
# Patterns checked:
#   1. PEM private keys (-----BEGIN ... PRIVATE KEY-----)
#   2. OpenAI API keys  (sk-[40+ alphanumeric chars])
#   3. Hardcoded JWTs   (long eyJ... string literals — not env-var references)
#   4. Supabase service-role key hint (service_role near a JWT)
#
# Excludes: test files, src/data/, node_modules/, dist/

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OVERALL_FAIL=0
FOUND=()

echo ""
echo "=== Secret Scan ==="

# Collect source files to scan via git ls-files (tracked + staged, respects .gitignore)
mapfile -t FILES < <(
  git -C "$REPO_ROOT" ls-files -- 'src/' \
    | grep -E '\.(ts|tsx)$' \
    | grep -v '\.test\.' \
    | grep -v 'src/data/' \
    | grep -v 'src/lib/timezone/data/'
)

if [ ${#FILES[@]} -eq 0 ]; then
  echo "  ✅ No source files to scan"
  exit 0
fi

for rel in "${FILES[@]}"; do
  fullpath="$REPO_ROOT/$rel"
  [ -f "$fullpath" ] || continue

  # 1. PEM private key block
  if grep -qE '-----BEGIN .{0,15}PRIVATE KEY-----' "$fullpath" 2>/dev/null; then
    FOUND+=("  ❌ $rel — private key (BEGIN PRIVATE KEY)")
  fi

  # 2. OpenAI API key format  (sk- prefix + 40+ alphanumeric/dash/underscore)
  if grep -qE "(sk-[a-zA-Z0-9_-]{40,})" "$fullpath" 2>/dev/null; then
    # Exclude lines that reference env vars (import.meta.env / process.env)
    if grep -E "(sk-[a-zA-Z0-9_-]{40,})" "$fullpath" 2>/dev/null \
        | grep -qvE "(import\.meta\.env|process\.env|VITE_|env\.)"; then
      FOUND+=("  ❌ $rel — possible OpenAI API key (sk-...)")
    fi
  fi

  # 3. Hardcoded JWT in a string literal (eyJ... 120+ chars not from env var)
  if grep -qE "(['\"])eyJ[a-zA-Z0-9+/_-]{120,}" "$fullpath" 2>/dev/null; then
    FOUND+=("  ❌ $rel — possible hardcoded JWT token in string literal")
  fi

  # 4. Supabase service_role key hint (the word service_role near a string value)
  if grep -qE "service_role\s*[:=]\s*['\"]" "$fullpath" 2>/dev/null; then
    FOUND+=("  ❌ $rel — possible Supabase service-role key (never use in client code)")
  fi
done

if [ ${#FOUND[@]} -eq 0 ]; then
  echo "  ✅ No secrets detected in ${#FILES[@]} source files"
  exit 0
else
  echo "  ❌ Potential secrets found — push blocked:"
  for entry in "${FOUND[@]}"; do
    echo "$entry"
  done
  echo ""
  echo "  Use environment variables (VITE_* in .env.local, or Supabase project secrets)."
  echo "  If this is a false positive, contact the team before bypassing."
  OVERALL_FAIL=1
fi

exit $OVERALL_FAIL
