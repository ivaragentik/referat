#!/usr/bin/env python3
"""Build the Tauri-updater latest.json manifest from a signed macOS build.

Tauri (with TAURI_SIGNING_PRIVATE_KEY set + createUpdaterArtifacts) emits:
  target/release/bundle/macos/Referat.app.tar.gz       (the update payload)
  target/release/bundle/macos/Referat.app.tar.gz.sig   (minisign signature)

The app's updater endpoint is
  https://github.com/ivaragentik/referat/releases/latest/download/latest.json
so each release ships a latest.json describing itself; an older install fetches
it, compares versions, downloads the .app.tar.gz, verifies it against the pubkey
baked into the app, installs in place, and relaunches.

Usage: make-latest-json.py <version> <pub_date_iso> "<notes>" <out_path>
(pub_date passed in because Date.now() is unavailable in some sandboxes.)
"""
import sys, json, os

version, pub_date, notes, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
root = os.path.expanduser("~/Notater/meetily/target/release/bundle/macos")
sig_path = os.path.join(root, "Referat.app.tar.gz.sig")
if not os.path.exists(sig_path):
    sys.exit(f"signature not found: {sig_path} — build with TAURI_SIGNING_PRIVATE_KEY set")

signature = open(sig_path).read().strip()
url = (f"https://github.com/ivaragentik/referat/releases/download/"
       f"v{version}/Referat.app.tar.gz")

manifest = {
    "version": version,
    "notes": notes,
    "pub_date": pub_date,
    "platforms": {
        "darwin-aarch64": {"signature": signature, "url": url},
    },
}
json.dump(manifest, open(out, "w"), indent=2, ensure_ascii=False)
print(f"✓ wrote {out} (version {version}, darwin-aarch64)")
