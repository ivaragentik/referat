# Slik slipper du en ny Referat-versjon

Releasen er manuell og lokal. Appen oppdaterer seg selv via Tauri-updateren, som
leser `latest.json` fra **siste** GitHub-release på `ivaragentik/referat`. Hele
selvoppdaterings-kjeden hviler på at hver release er korrekt - følg denne lista,
så biter ingenting deg senere.

## Invarianter som ALDRI må brytes (ellers stopper auto-oppdatering stille)

- Releasen må være **publisert** (ikke draft), **ikke prerelease**, og være «Latest».
  Både updateren (`frontend/src-tauri/tauri.conf.json` -> `plugins.updater.endpoints`)
  og «Installer Claude-kobling» (`frontend/src-tauri/src/api/api.rs` -> `MCPB_URL`)
  henter fra `releases/latest/download/`.
- Alle 4 assets må ligge på releasen med NØYAKTIG disse navnene:
  - `Referat_<versjon>_aarch64.dmg`
  - `Referat.app.tar.gz`
  - `latest.json`
  - `referat.mcpb`  ← lastes opp manuelt, lett å glemme
- `latest.json` sin `version` må være strengt større enn forrige (semver), ellers
  ser ingen installerte klienter oppdateringen.
- Versjon må være IDENTISK i `frontend/src-tauri/tauri.conf.json`,
  `frontend/src-tauri/Cargo.toml` og `frontend/package.json`.
- Signeringsnøkkelen må være SAMME nøkkel som `pubkey` i `tauri.conf.json`
  (minisign key id `290FB1AF98C0ACB5`). Roteres nøkkelen uten å sende ut en ny
  pubkey i appen, avviser alle installerte klienter oppdateringen.

## Steg

1. **Bump versjon** i alle tre filene over (f.eks. 1.1.4 -> 1.1.5).
2. **Sjekk før bygg:** `frontend/scripts/release-check.sh preflight`
   (verifierer versjons-konsistens, at taggen ikke finnes ennå, og at den er > siste Latest).
3. **Bygg + signer** (Apple Silicon): `cd frontend && pnpm tauri:build`.
   `scripts/tauri-auto.js` laster signeringsnøkkelen fra `TAURI_SIGNING_PRIVATE_KEY_PATH`;
   `createUpdaterArtifacts: true` lager `Referat.app.tar.gz` + `.sig`.
3. **Lag manifest:**
   `python3 frontend/scripts/make-latest-json.py <versjon> <pub_date_iso> "<notater>" latest.json`
   (feiler høyt hvis `.sig` mangler).
4. **Bygg `referat.mcpb`** (i `meetily-mcp`) på nytt hvis connectoren er endret.
5. **Tag + release** mot `ivaragentik/referat`, last opp de 4 assetene, og **PUBLISER**
   (ikke draft; marker som Latest).
6. **Sjekk etter publisering:** `frontend/scripts/release-check.sh verify`
   (krever Latest + publisert + ikke-prerelease, alle 4 assets, og HTTP 200 på runtime-URL-ene).

## Footguns som er stengt av (ikke åpne dem blindt)

- `.github/workflows/*.yml.disabled` - arvede Meetily-CI-workflows, **deaktivert** ved
  å gi dem `.disabled`-endelse (GitHub Actions laster bare `.yml`/`.yaml`). Hvis «Release»
  ble kjørt, ville den laget en draft «Meetily»-release og en konkurrerende `latest.json`
  signert med en fraværende CI-nøkkel, som kunne kapre auto-oppdatering for alle. Den ekte
  flyten er 100 % lokal og bruker dem ikke. Vil du noen gang bruke CI til release: sett
  `secrets.TAURI_SIGNING_PRIVATE_KEY` til NØYAKTIG den lokale nøkkelen først, ellers
  avvises signaturene. Skru på igjen ved å fjerne `.disabled`.
- **Signeringsnøkkel:** `~/Notater/.referat-updater.key` (nå `chmod 600` + gitignored).
  Dette er den eneste uerstattelige hemmeligheten - ta en **kryptert backup utenfor
  maskinen** (passordhvelv/vault). Mister du den, kan du aldri signere en akseptert
  oppdatering igjen.
