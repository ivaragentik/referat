#!/usr/bin/env bash
# release-check.sh - bite-proofing for the Referat manual release flow.
#
# READ-ONLY: it never builds, signs, tags, uploads, or publishes. It only asserts
# the release is in a state the auto-updater and the in-app Claude connector can
# rely on. See RELEASE.md for the full runbook.
#
#   release-check.sh preflight     run BEFORE building/tagging a new version
#   release-check.sh verify [vX]   run AFTER publishing (default: tauri.conf.json version)
#
# Invariants enforced:
#   * version identical in tauri.conf.json, Cargo.toml, package.json
#   * the new tag does not already exist and is strictly > the current Latest
#   * the published release is Latest + non-draft + non-prerelease
#   * all 4 assets exist under their EXACT names
#   * the two /latest/download/ runtime URLs + the manifest tar.gz all return 200
#   * latest.json advertises the released version
set -euo pipefail

REPO="ivaragentik/referat"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"   # -> meetily/
TAURI="$ROOT/frontend/src-tauri/tauri.conf.json"
CARGO="$ROOT/frontend/src-tauri/Cargo.toml"
PKG="$ROOT/frontend/package.json"

grn(){ printf '\033[32m\xe2\x9c\x93 %s\033[0m\n' "$*"; }
die(){ printf '\033[31m\xe2\x9c\x97 %s\033[0m\n' "$*" >&2; exit 1; }

ver_tauri(){ python3 -c "import json;print(json.load(open('$TAURI'))['version'])"; }
ver_pkg(){ python3 -c "import json;print(json.load(open('$PKG'))['version'])"; }
ver_cargo(){ python3 -c "import re;print(re.findall(r'^version\s*=\s*\"([^\"]+)\"',open('$CARGO').read(),re.M)[0])"; }

preflight(){
  local v vc vp; v="$(ver_tauri)"; vc="$(ver_cargo)"; vp="$(ver_pkg)"
  echo "version (tauri.conf.json): $v"
  [ "$v" = "$vc" ] || die "version mismatch: Cargo.toml=$vc != tauri.conf.json=$v (bump all three)"
  [ "$v" = "$vp" ] || die "version mismatch: package.json=$vp != tauri.conf.json=$v (bump all three)"
  grn "version consistent across tauri.conf.json / Cargo.toml / package.json ($v)"

  if git -C "$ROOT" rev-parse "v$v" >/dev/null 2>&1; then
    die "git tag v$v already exists locally - bump the version before releasing"
  fi
  if git -C "$ROOT" ls-remote --tags release "v$v" 2>/dev/null | grep -q "refs/tags/v$v"; then
    die "tag v$v already exists on the release remote - bump the version"
  fi
  grn "tag v$v does not exist yet"

  local latest lv; latest="$(gh release view --repo "$REPO" --json tagName -q .tagName 2>/dev/null || true)"
  if [ -n "$latest" ]; then
    lv="${latest#v}"
    if [ "$lv" = "$v" ] || [ "$(printf '%s\n%s\n' "$lv" "$v" | sort -V | tail -1)" != "$v" ]; then
      die "v$v is not strictly greater than current Latest $latest - the updater would offer nothing"
    fi
    grn "v$v > current Latest $latest"
  fi
  grn "PREFLIGHT OK - safe to build, tag and publish v$v"
}

verify(){
  local v="${1:-$(ver_tauri)}" json latest
  json="$(gh release view "v$v" --repo "$REPO" --json isDraft,isPrerelease,assets 2>/dev/null)" \
    || die "release v$v not found on $REPO"
  # This gh lacks the isLatest field; the no-arg release view returns the Latest release.
  latest="$(gh release view --repo "$REPO" --json tagName -q .tagName 2>/dev/null || true)"
  python3 - "$v" "$latest" "$json" <<'PY'
import json, sys
v, latest, raw = sys.argv[1], sys.argv[2], sys.argv[3]
d = json.loads(raw); errs = []
if latest != f"v{v}": errs.append(f"release is NOT the Latest (Latest is {latest or '?'})")
if d.get("isDraft"): errs.append("release is a DRAFT (updater + connector ignore it)")
if d.get("isPrerelease"): errs.append("release is a PRERELEASE (skipped by /latest/)")
names = {a["name"] for a in d.get("assets", [])}
for want in (f"Referat_{v}_aarch64.dmg", "Referat.app.tar.gz", "latest.json", "referat.mcpb"):
    if want not in names: errs.append(f"missing asset: {want}")
if errs:
    print("\n".join("  - " + e for e in errs)); sys.exit(1)
PY
  grn "release v$v: Latest + published + all 4 assets present"

  local u code
  for u in \
    "https://github.com/$REPO/releases/latest/download/latest.json" \
    "https://github.com/$REPO/releases/latest/download/referat.mcpb" \
    "https://github.com/$REPO/releases/download/v$v/Referat.app.tar.gz"; do
    code="$(curl -sIL -o /dev/null -w '%{http_code}' "$u")"
    [ "$code" = "200" ] || die "URL not 200 ($code): $u"
  done
  grn "runtime URLs (latest.json, referat.mcpb, app.tar.gz) all 200"

  local mv; mv="$(curl -sL "https://github.com/$REPO/releases/latest/download/latest.json" \
    | python3 -c "import json,sys;print(json.load(sys.stdin)['version'])")"
  [ "$mv" = "$v" ] || die "latest.json version ($mv) != released version ($v)"
  grn "latest.json advertises version $v"
  grn "VERIFY OK - v$v is live and self-update-ready"
}

case "${1:-}" in
  preflight) preflight ;;
  verify) shift || true; verify "${1:-}" ;;
  *) echo "usage: release-check.sh {preflight | verify [version]}"; exit 2 ;;
esac
