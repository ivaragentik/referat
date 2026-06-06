<div align="center">

# Referat — av Agentik

### «Referat skriver referatet.»

### «Ingen bot. Ingen sky. Ingen regning.»

*No bot. No cloud. No bill.*

**Referat** er et gratis, åpen kildekode møtenotat-verktøy for macOS, spesialbygd for norsk tale. Det lytter til møtet ditt — enten du er på Zoom, Teams, Meet eller i samme rom som kollegene — og leverer en presis transkripsjon uten at en eneste lyd forlater Macen din.

<!-- TODO: screenshot — erstatt dette med faktisk skjermbilde av appen -->

---

![MIT](https://img.shields.io/badge/Lisens-MIT-blue)
![macOS](https://img.shields.io/badge/macOS-13%2B-black)
![100 % lokalt](https://img.shields.io/badge/Behandling-100%25%20lokalt-green)
<!-- TODO: legg til release-badge når releases er publisert -->

</div>

---

## Hvorfor Referat?

- **Norsk transkripsjon i verdensklasse.** Vi bruker [NB-Whisper](https://huggingface.co/NbAiLab/nb-whisper-large) fra Nasjonalbiblioteket — trent på 66 000 timer norsk tale. Ordfeiltakten er ~2 % på bokmål, mot ~15 % for standard Whisper. Bokmål, nynorsk og engelsk støttes ut av boksen.

- **Ingen bot i møtet.** Referat fanger opp lyd direkte fra mikrofonen og systemlyden på Macen din via Core Audio. Deltakerne ser ingenting, og du trenger ikke å gi tilgang til møteplattformens API. Fungerer like godt i fysiske møterom.

- **Alt lokalt — GDPR-vennlig by design.** Transkripsjoner og opptak lagres i `~/Library/Application Support/no.agentik.referat/` (SQLite). Ingenting sendes til skyen med mindre du selv velger å koble til en ekstern AI for sammendrag. Du eier dataene dine, bokstavelig talt.

---

## Kom i gang

> Stupidly simple. Seks steg fra null til transkripsjon.

1. **Last ned appen.** Gå til [Releases](https://github.com/iaknutsen/referat/releases) <!-- TODO: oppdater lenke når releases er satt opp --> og last ned `.dmg`-filen.

2. **Installer.** Åpne `.dmg`, dra **Referat** til Programmer-mappen.

3. **Første oppstart — høyreklikk → Åpne.** Appen er ikke signert av Apple ennå (se [veikart](#veikart)). Dobbeltklikk vil bli blokkert av Gatekeeper. Høyreklikk på ikonet → «Åpne» → bekreft i dialogen. Du gjør dette kun én gang.

4. **Gi tillatelser.** macOS spør om mikrofontilgang og skjermopptak (nødvendig for systemlyd). Godkjenn begge — uten dem kan ikke appen høre noe.

5. **Last ned transkripsjonskmodellen.** Første gang starter appen en nedlasting på ca. 1 GB (NB-Whisper large). Den lagres lokalt og gjenbrukes for alltid. Ha tålmodighet — det er en engangsjobb.

6. **Trykk Spill inn. Det er det.** Appen transkriberer i sanntid. Når møtet er ferdig, trykker du Stopp, og du får transkript pluss valgfritt sammendrag rett i grensesnittet.

---

## Slik virker det

```
Mikrofon + systemlyd
        ↓
macOS Core Audio (ingen bot nødvendig)
        ↓
whisper.cpp + NB-Whisper (kjører lokalt på din Mac)
        ↓
SQLite  (~Library/Application Support/no.agentik.referat/)
        ↓
(Valgfritt) lokalt sammendrag via innebygd liten LLM
           — eller din egen API-nøkkel for Claude / OpenAI
```

Alt skjer på din maskin. Appen har ingen utgående nettverksforbindelser med mindre du eksplisitt legger inn en ekstern API-nøkkel for sammendrag.

---

## Ofte stilte spørsmål

**Er det virkelig gratis?**
Ja. Referat er MIT-lisensiert og åpen kildekode. Transkripsjonskmodellene er offentlig finansiert (Nasjonalbiblioteket), og det er Macen din som gjør jobben. Det koster ingenting å kjøre.

**Hva sendes til skyen?**
Ingenting — med mindre du selv legger inn en ekstern API-nøkkel (Claude, OpenAI e.l.) for sammendrag. Transkripsjonen skjer alltid lokalt uansett.

**Fungerer det med fysiske møter?**
Ja. Bruk mikrofonen i Macen eller en ekstern mikrofon i rommet. Appen trenger ingen møteplattform.

**Windows?**
Ikke ennå. Se [veikart](#veikart).

---

## Følgesvenn: meetily-mcp

Et MCP-serverprosjekt — **meetily-mcp** — som lar Claude søke gjennom møtene dine, er på vei til denne repo-familien. Hold øye med [releases](https://github.com/iaknutsen/referat/releases). <!-- TODO: oppdater lenke -->

---

---

## English

### Referat — meeting notes for Norwegian speakers, by Agentik

**Referat** is a free, open-source (MIT) macOS meeting note-taker built for Norwegian. It captures microphone and system audio directly via Core Audio — no bot joins your call — and transcribes entirely on your Mac using [NB-Whisper](https://huggingface.co/NbAiLab/nb-whisper-large), the National Library of Norway's fine-tuned Whisper model (~2% WER on Bokmål vs ~15% for stock Whisper). Bokmål, Nynorsk, and English are all supported.

Transcripts and recordings are stored locally in SQLite (`~/Library/Application Support/no.agentik.referat/`). Nothing leaves your Mac unless you opt in to an external API for summaries. Local summarisation via a bundled small LLM is also available with no API key required.

<!-- TODO: screenshot placeholder -->

### Quick start (English)

1. Download the `.dmg` from [Releases](https://github.com/iaknutsen/referat/releases) <!-- TODO: update link -->
2. Drag **Referat** to Applications
3. **First launch: right-click → Open** (the app is unsigned — see [Roadmap](#roadmap))
4. Grant microphone and screen recording permissions
5. Download the transcription model (~1 GB, one-time)
6. Hit Record

### How it works

```
Mic + system audio → Core Audio → whisper.cpp (NB-Whisper, local) → SQLite → (optional) local summary
```

### FAQ (English)

**Is it really free?** Yes. MIT licence, publicly-funded models, your Mac does the work.

**What's sent to the cloud?** Nothing, unless you add an external API key for summaries.

**Windows?** Not yet — see [Roadmap](#roadmap).

---

## Building from source

### Prerequisites

- macOS 13 or later (Apple Silicon recommended)
- [Rust](https://rustup.rs/) (stable toolchain)
- Node.js 18+ and [pnpm](https://pnpm.io/)
- Xcode Command Line Tools (`xcode-select --install`)

### Build

```bash
git clone https://github.com/iaknutsen/referat
cd referat/frontend
pnpm install
pnpm run tauri:build
```

The built `.app` ends up in `frontend/src-tauri/target/release/bundle/macos/`.

For GPU-accelerated builds on Apple Silicon (recommended):

```bash
pnpm run tauri:build:metal
```

See [`docs/BUILDING.md`](docs/BUILDING.md) for full build options including CPU-only and GPU variants.

---

## Veikart / Roadmap

- [ ] Signering og notarisering (Apple-godkjent bygg — ingen høyreklikk-dans ved oppstart)
- [ ] Auto-oppdatering (Sparkle / Tauri updater)
- [ ] Windows-støtte
- [ ] meetily-mcp: MCP-server slik at Claude kan søke i møtene dine

---

## Takk og anerkjennelse / Credits & License

Referat er lisensiert under **MIT**. Se [`LICENSE.md`](LICENSE.md).

This project is a Norwegian-language fork of **[Meetily v0.4.0](https://github.com/Zackriya-Solutions/meetily)** by [Zackriya Solutions](https://github.com/Zackriya-Solutions). Meetily is the upstream foundation — the audio pipeline, Tauri architecture, and core application structure all originate there. Full attribution in [`docs/ATTRIBUTION.md`](docs/ATTRIBUTION.md).

**Norwegian transcription models** — [NB-Whisper](https://huggingface.co/NbAiLab/nb-whisper-large) by [NB AI-Lab](https://huggingface.co/NbAiLab) (Nasjonalbiblioteket / National Library of Norway). Apache 2.0 licence.

**Transcription engine** — [whisper.cpp](https://github.com/ggml-org/whisper.cpp) by Georgi Gerganov / ggml. MIT licence.

---

<div align="center">

Laget av [Agentik](https://github.com/iaknutsen/referat)

</div>
