# Attribution / Anerkjennelse

Knutsen Notes is built on the shoulders of several excellent open-source projects. This file records those dependencies and their licences as required by their respective terms.

---

## Meetily (upstream fork base)

**Meetily v0.4.0** by [Zackriya Solutions](https://github.com/Zackriya-Solutions)
Repository: <https://github.com/Zackriya-Solutions/meetily>
Licence: MIT

Knutsen Notes is a fork of Meetily. The core Tauri desktop application architecture, audio capture pipeline (Core Audio / WASAPI), Rust backend structure, SQLite meeting persistence, and the Next.js frontend shell all originate from Meetily. The Norwegian-language specialisation (NB-Whisper integration, UI localisation, data-path changes) was added in this fork.

The full Meetily MIT licence text is reproduced in [`LICENSE.md`](../LICENSE.md) at the root of this repository.

---

## NB-Whisper (Norwegian transcription models)

**NB-Whisper** by [NB AI-Lab](https://huggingface.co/NbAiLab) (Nasjonalbiblioteket — National Library of Norway)
Model page: <https://huggingface.co/NbAiLab/nb-whisper-large>
Licence: Apache 2.0

NB-Whisper is a family of Norwegian automatic speech recognition models fine-tuned from OpenAI Whisper, trained on 66,000 hours of Norwegian speech data sourced from Språkbanken, the National Library of Norway's digital collection, and NRK broadcast transcripts. Knutsen Notes ships with or downloads the `nb-whisper-large` variant by default.

---

## whisper.cpp (transcription runtime)

**whisper.cpp** by Georgi Gerganov / ggml
Repository: <https://github.com/ggml-org/whisper.cpp>
Licence: MIT

whisper.cpp is a C/C++ port of OpenAI's Whisper model that enables efficient, on-device speech recognition. Knutsen Notes uses whisper.cpp (via the `whisper-rs` Rust bindings, inherited from Meetily) as the local inference engine that runs NB-Whisper models.

---

## Additional upstream acknowledgements (from Meetily)

The following acknowledgements are inherited from the Meetily project:

- [Screenpipe](https://github.com/mediar-ai/screenpipe) — portions of the system audio capture code
- [transcribe-rs](https://crates.io/crates/transcribe-rs) — portions of the Rust transcription scaffolding
- NVIDIA Parakeet model (used in Meetily upstream; not the default in Knutsen Notes)

---

*This file is maintained on the `knutsen-notes` branch and is specific to the Knutsen Notes fork.*
