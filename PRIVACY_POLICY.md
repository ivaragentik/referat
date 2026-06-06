# Personvern / Privacy Policy — Referat

*Sist oppdatert / Last updated: 2026-06-06*

---

## Norsk

### Null telemetri. Null analyse. Alt lokalt.

Referat er bygget på ett enkelt prinsipp: møtedataene dine er dine, og de skal forbli på din Mac.

**Hva samles inn?**
Ingenting. Referat har ingen analytics, ingen telemetri og ingen datasporing. PostHog og all annen sporingsinfrastruktur er fullstendig fjernet fra kildekoden.

**Hva forlater Macen din?**

To ting kan eventuelt gå ut — begge er eksplisitte og brukerstyrte:

1. **Modellnedlastinger.** Første gang du bruker Referat, lastes transkripsjonsmotoren (NB-Whisper) ned fra Hugging Face / Nasjonalbiblioteket. Dette er en engangsoperasjon. Ingen møtedata sendes — bare en HTTP-forespørsel om å hente en modellfil.

2. **Valgfri ekstern AI-kobling (BYOK).** Hvis du selv legger inn en API-nøkkel for Claude, OpenAI eller lignende i Innstillinger, sendes sammendrags-forespørsler til den aktuelle leverandørens API. Da gjelder leverandørens egne vilkår og personvernerklæring. Transkripsjonen skjer alltid lokalt uansett.

Alt annet — opptak, transkripsjoner, referater, møtehistorikk — lagres utelukkende lokalt på din maskin og forlater aldri Macen din uten din eksplisitte handling.

**Kontakt**
Spørsmål? Åpne en sak på [github.com/ivaragentik/referat](https://github.com/ivaragentik/referat/issues) eller skriv til oss via [agentik.no](https://agentik.no).

---

## English

### Zero telemetry. Zero analytics. All local.

Referat is built on a simple principle: your meeting data is yours, and it stays on your Mac.

**What is collected?**
Nothing. Referat has no analytics, no telemetry, and no data tracking. PostHog and all other tracking infrastructure have been fully removed from the source code.

**What leaves your Mac?**

Two things may leave your Mac — both are explicit and user-controlled:

1. **Model downloads.** The first time you use Referat, the transcription engine (NB-Whisper) is downloaded from Hugging Face / the National Library of Norway. This is a one-time operation. No meeting data is sent — only an HTTP request to fetch a model file.

2. **Optional external AI connection (BYOK).** If you add an API key for Claude, OpenAI, or a similar service in Settings, summary requests are sent to that provider's API. The provider's own terms and privacy policy then apply. Transcription always happens locally regardless.

Everything else — recordings, transcripts, meeting notes, meeting history — is stored exclusively on your machine and never leaves your Mac without your explicit action.

**Contact**
Questions? Open an issue at [github.com/ivaragentik/referat](https://github.com/ivaragentik/referat/issues) or reach us via [agentik.no](https://agentik.no).

---

*Referat er åpen kildekode under MIT-lisensen. Du kan selv inspisere all datahåndtering i kildekoden.*

*Referat is open source under the MIT licence. You can inspect all data handling in the source code yourself.*
