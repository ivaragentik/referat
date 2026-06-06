#!/usr/bin/env python3
"""Seed a polished Norwegian demo dataset into a Referat meeting_minutes.sqlite
for marketing screenshots. Idempotent: clears demo rows (id prefix 'demo-') first.

Usage: python3 seed-demo-data.py /path/to/meeting_minutes.sqlite
"""
import sqlite3, sys, json, uuid
from datetime import datetime, timedelta, timezone

DB = sys.argv[1] if len(sys.argv) > 1 else None
if not DB:
    sys.exit("usage: seed-demo-data.py <db path>")

def iso(dt): return dt.replace(tzinfo=timezone.utc).isoformat()

# base time: a few days ago, mid-morning, for believable «forrige uke» feel
base = datetime(2026, 6, 4, 9, 0, 0)

MEETINGS = [
    {
        "id": "demo-nordvik",
        "title": "Kundemøte – Nordvik Eiendom",
        "when": base + timedelta(days=2, hours=1),
        "segments": [
            "Ivar: God morgen, Marius — takk for at du tok deg tid i dag.",
            "Marius: Bare hyggelig, jeg har gledet meg. Vi har hørt mye bra om Agentik.",
            "Ivar: Så fint. Skal vi starte med hvor dere er i dag, så jeg forstår behovet riktig?",
            "Marius: Ja. Vi forvalter rundt fire hundre leiligheter, og kundeservice drukner i e-post. Mye gjentakende spørsmål om husleie, vedlikehold og nøkler.",
            "Ivar: Hvor mange henvendelser snakker vi om i uka?",
            "Marius: Et sted mellom tre og fire hundre. To personer bruker mesteparten av dagen på det.",
            "Ivar: Da er det et tydelig case. En AI-assistent som svarer på de vanligste spørsmålene automatisk, og eskalerer det som er komplekst til menneskene deres.",
            "Marius: Det er akkurat det vi ser for oss. Men vi er opptatt av personvern — dette er beboernes data.",
            "Ivar: Helt enig, og det er en styrke for oss. Vi kan kjøre løsningen slik at sensitive data forblir hos dere, ikke ut til tredjeparter.",
            "Marius: Det høres veldig bra ut. Hva er typisk tidsramme for noe sånt?",
            "Ivar: For et første pilotoppsett, fire til seks uker. Vi starter smalt, måler effekten, og utvider når dere ser verdien.",
            "Marius: La oss gå for en pilot. Kan du sende et forslag med omfang og pris?",
            "Ivar: Absolutt. Du har det på e-post innen fredag. Skal vi sette en oppfølging uken etter?",
            "Marius: Perfekt. Da booker jeg tirsdag klokka ti.",
        ],
        "notes": "- 400 leiligheter, 2 ansatte drukner i e-post\n- 300-400 henvendelser/uke, mest husleie + vedlikehold\n- VIKTIG: personvern, beboerdata må bli hos dem\n- Pilot 4-6 uker, start smalt\n- Send forslag fredag → oppfølging tirsdag 10:00",
        "summary": """# Møtereferat – Kundemøte Nordvik Eiendom

## Sammendrag
Nordvik Eiendom forvalter rundt 400 leiligheter og bruker i dag to årsverk på i hovedsak repeterende kundehenvendelser (300–400 i uka), særlig om husleie, vedlikehold og nøkler. Agentik foreslo en AI-assistent som besvarer de vanligste spørsmålene automatisk og eskalerer komplekse saker til menneskelige saksbehandlere. Personvern var et sentralt tema; løsningen kan settes opp slik at sensitive beboerdata forblir hos kunden.

## Beslutninger
- Nordvik går videre med et pilotprosjekt (4–6 uker), med smal oppstart og måling av effekt før utvidelse.

## Oppgaver
| Ansvarlig | Oppgave | Frist |
| --- | --- | --- |
| Ivar (Agentik) | Sende forslag med omfang og pris | Fredag |
| Marius (Nordvik) | Booke oppfølgingsmøte | Tirsdag kl. 10:00 |

## Neste steg
Oppfølgingsmøte tirsdag kl. 10:00 for å gjennomgå forslaget og avtale oppstart av piloten.
""",
    },
    {
        "id": "demo-1on1-sofie",
        "title": "Ukentlig 1:1 – Sofie",
        "when": base + timedelta(days=1, hours=4),
        "segments": [
            "Ivar: Hei Sofie, hvordan har uka vært?",
            "Sofie: Egentlig bra! Jeg ble ferdig med onboarding-flyten for den nye kunden, og tilbakemeldingene var positive.",
            "Ivar: Det la jeg merke til — flott jobba. Noe som har stått i veien?",
            "Sofie: Litt. Jeg venter fortsatt på tilganger til analyseverktøyet, så rapporteringen henger etter.",
            "Ivar: Det fikser jeg i dag. Hvem sitter på det?",
            "Sofie: Det er IT hos kunden. Hvis du kan dytte litt, hjelper det.",
            "Ivar: Notert. Hva vil du prioritere neste uke?",
            "Sofie: Jeg vil gjerne sette opp dashboardet og begynne på den månedlige rapporten.",
            "Ivar: Høres riktig ut. Og hvordan har du det med arbeidsmengden — bærekraftig?",
            "Sofie: Ja, nå er det greit. Forrige måned var tøff, men det har roet seg.",
            "Ivar: Bra. Si fra tidlig hvis det snur. Skal vi ta en faglig dag sammen før sommeren?",
            "Sofie: Veldig gjerne. Jeg har lyst til å lære mer om evaluering av modeller.",
            "Ivar: Da setter vi av en dag til det. Jeg sender et forslag.",
        ],
        "notes": "- Onboarding-flyt ferdig, positiv tilbakemelding 👏\n- Blokkert: tilganger til analyseverktøy (kundens IT) → Ivar dytter\n- Neste uke: dashboard + månedsrapport\n- Arbeidsmengde ok nå (forrige mnd tøff)\n- Faglig dag før sommeren — modellevaluering",
        "summary": """# Møtereferat – 1:1 med Sofie

## Sammendrag
Sofie fullførte onboarding-flyten for den nye kunden med positive tilbakemeldinger. Hovedhindringen er manglende tilganger til kundens analyseverktøy, som forsinker rapporteringen. Arbeidsmengden oppleves som bærekraftig nå etter en travel forrige måned. Det er ønske om en faglig dag om modellevaluering før sommeren.

## Beslutninger
- Ivar følger opp tilgangene direkte mot kundens IT.
- Det settes av en faglig dag om modellevaluering før sommeren.

## Oppgaver
| Ansvarlig | Oppgave | Frist |
| --- | --- | --- |
| Ivar | Purre kundens IT på tilganger til analyseverktøyet | I dag |
| Sofie | Sette opp dashboard og starte månedsrapport | Neste uke |
| Ivar | Sende forslag til dato for faglig dag | Denne uka |

## Neste steg
Sofie prioriterer dashboard og månedsrapport så snart tilgangene er på plass.
""",
    },
    {
        "id": "demo-styremote",
        "title": "Styremøte Q2 2026",
        "when": base + timedelta(hours=2),
        "segments": [
            "Ivar: Velkommen til styremøtet. Vi har tre saker: økonomi, ansettelser og veien videre.",
            "Henrik: Bra. Skal vi ta økonomien først?",
            "Ivar: Ja. Andre kvartal endte sterkt — omsetningen er opp tjueåtte prosent fra forrige kvartal, drevet av tre nye fastkunder.",
            "Henrik: Imponerende. Hvordan ser marginene ut?",
            "Ivar: Stabile. Vi har holdt kostnadene flate mens vi vokser, så bunnlinjen følger med opp.",
            "Marit: Hva er den største risikoen akkurat nå?",
            "Ivar: Kapasitet. Vi sier nei til oppdrag fordi vi ikke rekker over. Derfor sak to — ansettelser.",
            "Marit: Hvor mange ser du for deg?",
            "Ivar: To utviklere og én prosjektleder i løpet av høsten. Det lar oss ta unna etterspørselen uten å brenne ut teamet.",
            "Henrik: Jeg støtter det. Bedre å ansette litt før behovet enn litt etter.",
            "Marit: Enig. Men la oss holde et øye med likviditeten gjennom ansettelsesperioden.",
            "Ivar: Selvsagt. Jeg legger fram en oppdatert likviditetsprognose til neste møte.",
            "Ivar: Sak tre, veien videre: jeg foreslår at vi lanserer et gratis verktøy som markedsføringskanal. Mer om det neste gang.",
            "Henrik: Spennende. Da sier vi det for i dag — godt møte.",
        ],
        "notes": "- Q2 omsetning +28% k/k, 3 nye fastkunder\n- Marginer stabile, kostnader flate\n- Største risiko: KAPASITET — sier nei til oppdrag\n- Ansette 2 utviklere + 1 PL til høsten\n- Marit: følg likviditet nøye → prognose neste møte\n- Idé: gratis verktøy som markedsføringskanal (mer neste gang)",
        "summary": """# Møtereferat – Styremøte Q2 2026

## Sammendrag
Andre kvartal ble sterkt, med en omsetningsvekst på 28 % fra forrige kvartal drevet av tre nye fastkunder, og stabile marginer som følge av flate kostnader. Den største risikoen er kapasitet — selskapet takker nei til oppdrag. Styret diskuterte ansettelser for å møte etterspørselen, med oppmerksomhet på likviditet i perioden. Et gratis verktøy som markedsføringskanal ble introdusert som tema til neste møte.

## Beslutninger
- Styret støtter ansettelse av to utviklere og én prosjektleder i løpet av høsten.
- Likviditeten følges tett gjennom ansettelsesperioden.

## Oppgaver
| Ansvarlig | Oppgave | Frist |
| --- | --- | --- |
| Ivar | Legge fram oppdatert likviditetsprognose | Neste styremøte |
| Ivar | Forberede sak om gratis verktøy som markedsføringskanal | Neste styremøte |

## Neste steg
Rekrutteringen starter til høsten; likviditetsprognose og verktøy-saken behandles på neste styremøte.
""",
    },
]

conn = sqlite3.connect(DB)
c = conn.cursor()

# wipe any previous demo rows (idempotent)
for tbl, col in [("transcripts", "meeting_id"), ("meeting_notes", "meeting_id"),
                  ("summary_processes", "meeting_id"), ("meetings", "id")]:
    c.execute(f"DELETE FROM {tbl} WHERE {col} LIKE 'demo-%'")

for m in MEETINGS:
    w = m["when"]
    c.execute("INSERT INTO meetings (id,title,created_at,updated_at) VALUES (?,?,?,?)",
              (m["id"], m["title"], iso(w), iso(w)))
    t = 6.0
    for seg in m["segments"]:
        dur = max(4.0, len(seg) / 14.0)
        spk = seg.split(":")[0]
        c.execute("""INSERT INTO transcripts
                     (id,meeting_id,transcript,timestamp,audio_start_time,audio_end_time,duration,speaker)
                     VALUES (?,?,?,?,?,?,?,?)""",
                  (str(uuid.uuid4()), m["id"], seg, iso(w + timedelta(seconds=t)),
                   t, t + dur, dur, spk))
        t += dur + 1.2
    c.execute("""INSERT INTO meeting_notes (meeting_id,notes_markdown,notes_json,created_at,updated_at)
                 VALUES (?,?,?,?,?)""",
              (m["id"], m["notes"], None, iso(w), iso(w)))
    c.execute("""INSERT INTO summary_processes
                 (meeting_id,status,created_at,updated_at,result,start_time,end_time,chunk_count,processing_time)
                 VALUES (?,?,?,?,?,?,?,?,?)""",
              (m["id"], "completed", iso(w), iso(w),
               json.dumps({"markdown": m["summary"]}),
               iso(w + timedelta(minutes=15)), iso(w + timedelta(minutes=16)), 1, 3.2))

conn.commit()
n = c.execute("SELECT COUNT(*) FROM meetings WHERE id LIKE 'demo-%'").fetchone()[0]
seg = c.execute("SELECT COUNT(*) FROM transcripts WHERE meeting_id LIKE 'demo-%'").fetchone()[0]
conn.close()
print(f"seeded {n} demo meetings, {seg} transcript segments, with notes + summaries")
