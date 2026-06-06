/*
 * Mock Tauri v2 bridge for marketing screenshots.
 *
 * This is injected via Playwright `page.addInitScript()` BEFORE any app JS runs,
 * so that `window.__TAURI_INTERNALS__.invoke(...)` (used by @tauri-apps/api/core)
 * and `window.__TAURI__` resolve to demo data instead of the real Rust backend.
 *
 * The demo data is copied verbatim from frontend/scripts/seed-demo-data.py so the
 * browser shots match the native app's seeded marketing dataset exactly.
 */
(function () {
  // ─── Demo dataset (verbatim from seed-demo-data.py) ────────────────────────
  const MEETINGS = [
    {
      id: 'demo-nordvik',
      title: 'Kundemøte – Nordvik Eiendom',
      created_at: '2026-06-06T10:00:00Z',
      updated_at: '2026-06-06T10:00:00Z',
      segments: [
        'Ivar: God morgen, Marius — takk for at du tok deg tid i dag.',
        'Marius: Bare hyggelig, jeg har gledet meg. Vi har hørt mye bra om Agentik.',
        'Ivar: Så fint. Skal vi starte med hvor dere er i dag, så jeg forstår behovet riktig?',
        'Marius: Ja. Vi forvalter rundt fire hundre leiligheter, og kundeservice drukner i e-post. Mye gjentakende spørsmål om husleie, vedlikehold og nøkler.',
        'Ivar: Hvor mange henvendelser snakker vi om i uka?',
        'Marius: Et sted mellom tre og fire hundre. To personer bruker mesteparten av dagen på det.',
        'Ivar: Da er det et tydelig case. En AI-assistent som svarer på de vanligste spørsmålene automatisk, og eskalerer det som er komplekst til menneskene deres.',
        'Marius: Det er akkurat det vi ser for oss. Men vi er opptatt av personvern — dette er beboernes data.',
        'Ivar: Helt enig, og det er en styrke for oss. Vi kan kjøre løsningen slik at sensitive data forblir hos dere, ikke ut til tredjeparter.',
        'Marius: Det høres veldig bra ut. Hva er typisk tidsramme for noe sånt?',
        'Ivar: For et første pilotoppsett, fire til seks uker. Vi starter smalt, måler effekten, og utvider når dere ser verdien.',
        'Marius: La oss gå for en pilot. Kan du sende et forslag med omfang og pris?',
        'Ivar: Absolutt. Du har det på e-post innen fredag. Skal vi sette en oppfølging uken etter?',
        'Marius: Perfekt. Da booker jeg tirsdag klokka ti.',
      ],
      notes:
        '- 400 leiligheter, 2 ansatte drukner i e-post\n- 300-400 henvendelser/uke, mest husleie + vedlikehold\n- VIKTIG: personvern, beboerdata må bli hos dem\n- Pilot 4-6 uker, start smalt\n- Send forslag fredag → oppfølging tirsdag 10:00',
      summary: `# Møtereferat – Kundemøte Nordvik Eiendom

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
`,
    },
    {
      id: 'demo-1on1-sofie',
      title: 'Ukentlig 1:1 – Sofie',
      created_at: '2026-06-05T13:00:00Z',
      updated_at: '2026-06-05T13:00:00Z',
      segments: [
        'Ivar: Hei Sofie, hvordan har uka vært?',
        'Sofie: Egentlig bra! Jeg ble ferdig med onboarding-flyten for den nye kunden, og tilbakemeldingene var positive.',
        'Ivar: Det la jeg merke til — flott jobba. Noe som har stått i veien?',
        'Sofie: Litt. Jeg venter fortsatt på tilganger til analyseverktøyet, så rapporteringen henger etter.',
        'Ivar: Det fikser jeg i dag. Hvem sitter på det?',
        'Sofie: Det er IT hos kunden. Hvis du kan dytte litt, hjelper det.',
        'Ivar: Notert. Hva vil du prioritere neste uke?',
        'Sofie: Jeg vil gjerne sette opp dashboardet og begynne på den månedlige rapporten.',
        'Ivar: Høres riktig ut. Og hvordan har du det med arbeidsmengden — bærekraftig?',
        'Sofie: Ja, nå er det greit. Forrige måned var tøff, men det har roet seg.',
        'Ivar: Bra. Si fra tidlig hvis det snur. Skal vi ta en faglig dag sammen før sommeren?',
        'Sofie: Veldig gjerne. Jeg har lyst til å lære mer om evaluering av modeller.',
        'Ivar: Da setter vi av en dag til det. Jeg sender et forslag.',
      ],
      notes:
        '- Onboarding-flyt ferdig, positiv tilbakemelding 👏\n- Blokkert: tilganger til analyseverktøy (kundens IT) → Ivar dytter\n- Neste uke: dashboard + månedsrapport\n- Arbeidsmengde ok nå (forrige mnd tøff)\n- Faglig dag før sommeren — modellevaluering',
      summary: `# Møtereferat – 1:1 med Sofie

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
`,
    },
    {
      id: 'demo-styremote',
      title: 'Styremøte Q2 2026',
      created_at: '2026-06-04T11:00:00Z',
      updated_at: '2026-06-04T11:00:00Z',
      segments: [
        'Ivar: Velkommen til styremøtet. Vi har tre saker: økonomi, ansettelser og veien videre.',
        'Henrik: Bra. Skal vi ta økonomien først?',
        'Ivar: Ja. Andre kvartal endte sterkt — omsetningen er opp tjueåtte prosent fra forrige kvartal, drevet av tre nye fastkunder.',
        'Henrik: Imponerende. Hvordan ser marginene ut?',
        'Ivar: Stabile. Vi har holdt kostnadene flate mens vi vokser, så bunnlinjen følger med opp.',
        'Marit: Hva er den største risikoen akkurat nå?',
        'Ivar: Kapasitet. Vi sier nei til oppdrag fordi vi ikke rekker over. Derfor sak to — ansettelser.',
        'Marit: Hvor mange ser du for deg?',
        'Ivar: To utviklere og én prosjektleder i løpet av høsten. Det lar oss ta unna etterspørselen uten å brenne ut teamet.',
        'Henrik: Jeg støtter det. Bedre å ansette litt før behovet enn litt etter.',
        'Marit: Enig. Men la oss holde et øye med likviditeten gjennom ansettelsesperioden.',
        'Ivar: Selvsagt. Jeg legger fram en oppdatert likviditetsprognose til neste møte.',
        'Ivar: Sak tre, veien videre: jeg foreslår at vi lanserer et gratis verktøy som markedsføringskanal. Mer om det neste gang.',
        'Henrik: Spennende. Da sier vi det for i dag — godt møte.',
      ],
      notes:
        '- Q2 omsetning +28% k/k, 3 nye fastkunder\n- Marginer stabile, kostnader flate\n- Største risiko: KAPASITET — sier nei til oppdrag\n- Ansette 2 utviklere + 1 PL til høsten\n- Marit: følg likviditet nøye → prognose neste møte\n- Idé: gratis verktøy som markedsføringskanal (mer neste gang)',
      summary: `# Møtereferat – Styremøte Q2 2026

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
`,
    },
  ];

  function meetingById(id) {
    return MEETINGS.find((m) => m.id === id) || null;
  }

  // Build transcript rows for a meeting (mirrors seed-demo-data.py timing).
  function transcriptsFor(meetingId) {
    const m = meetingById(meetingId);
    if (!m) return [];
    let t = 6.0;
    let i = 0;
    return m.segments.map((seg) => {
      const dur = Math.max(4.0, seg.length / 14.0);
      const speaker = seg.split(':')[0];
      const row = {
        id: `${meetingId}-seg-${i}`,
        meeting_id: meetingId,
        text: seg,
        transcript: seg,
        timestamp: new Date(Date.now() - 3600000 + t * 1000).toISOString(),
        audio_start_time: t,
        audio_end_time: t + dur,
        duration: dur,
        speaker: speaker,
        confidence: 0.96,
        sequence_id: i,
        is_partial: false,
      };
      t += dur + 1.2;
      i += 1;
      return row;
    });
  }

  // Templates (Norwegian) shown in the template picker.
  const TEMPLATES = [
    { id: 'motereferat', name: 'Møtereferat', description: 'Standard norsk møtereferat med sammendrag, beslutninger og oppgaver.' },
    { id: 'kundemote', name: 'Kundemøte', description: 'Behov, smertepunkter, neste steg og oppfølging for salgsmøter.' },
    { id: '1on1', name: '1:1-samtale', description: 'Status, blokkeringer, prioriteringer og oppfølgingspunkter.' },
    { id: 'styremote', name: 'Styremøte', description: 'Saksliste, vedtak, ansvar og frister for styremøter.' },
    { id: 'standup', name: 'Daglig standup', description: 'Kort oppsummering: gjort, skal gjøre, hindringer.' },
  ];

  // Whisper models for the transcription settings picker.
  const WHISPER_MODELS = [
    { name: 'nb-whisper-large-q5_0', path: '/models/nb-whisper-large-q5_0.bin', size_mb: 1031, accuracy: 'High', speed: 'Slow', status: 'Available', description: 'Norsk (bokmål) — NB-Whisper Large. Best Norwegian accuracy.' },
    { name: 'nb-whisper-medium-q5_0', path: '', size_mb: 540, accuracy: 'High', speed: 'Medium', status: 'Missing', description: 'Norsk (bokmål) — NB-Whisper Medium. Rask og presis.' },
    { name: 'small', path: '', size_mb: 488, accuracy: 'Good', speed: 'Fast', status: 'Missing', description: 'Multilingual small model.' },
    { name: 'medium-q5_0', path: '', size_mb: 539, accuracy: 'Good', speed: 'Medium', status: 'Missing', description: 'Multilingual medium (quantized).' },
    { name: 'large-v3-q5_0', path: '', size_mb: 1080, accuracy: 'High', speed: 'Slow', status: 'Missing', description: 'Multilingual large-v3 (quantized).' },
    { name: 'large-v3-turbo', path: '', size_mb: 1620, accuracy: 'High', speed: 'Fast', status: 'Missing', description: 'Multilingual large-v3 turbo.' },
    { name: 'large-v3', path: '', size_mb: 3090, accuracy: 'High', speed: 'Slow', status: 'Missing', description: 'Multilingual large-v3 (full).' },
  ];

  const MODEL_CONFIG = {
    provider: 'ollama',
    model: 'gemma3:1b',
    whisperModel: 'nb-whisper-large-q5_0',
    apiKey: null,
    ollamaEndpoint: null,
  };

  const TRANSCRIPT_CONFIG = {
    provider: 'localWhisper',
    model: 'nb-whisper-large-q5_0',
    apiKey: null,
  };

  const OLLAMA_MODELS = [
    { name: 'gemma3:1b', id: 'a1b2c3', size: '815 MB', modified: '2026-06-01' },
    { name: 'llama3.2:latest', id: 'd4e5f6', size: '2.0 GB', modified: '2026-05-20' },
  ];

  // ─── Command table ─────────────────────────────────────────────────────────
  const MOCK = {
    // Onboarding — report complete so the app shows the main UI, not the wizard.
    get_onboarding_status: () => ({ completed: true }),
    check_first_launch: () => false,
    complete_onboarding: () => null,
    save_onboarding_status_cmd: () => null,
    // Database bootstrap (used by onboarding setup step)
    check_default_legacy_database: () => false,
    check_homebrew_database: () => false,
    detect_legacy_database: () => null,
    initialize_fresh_database: () => ({ status: 'ok' }),
    import_and_initialize_database: () => ({ status: 'ok' }),

    // Meetings list
    api_get_meetings: () =>
      MEETINGS.map((m) => ({ id: m.id, title: m.title, created_at: m.created_at, updated_at: m.updated_at })),

    api_get_meeting_metadata: (args) => {
      const id = args?.meetingId;
      const m = meetingById(id);
      if (!m) throw new Error('Meeting not found');
      return { id: m.id, title: m.title, created_at: m.created_at, updated_at: m.updated_at, folder_path: null };
    },

    api_get_meeting_transcripts: (args) => {
      const id = args?.meetingId;
      const rows = transcriptsFor(id);
      const offset = args?.offset ?? 0;
      const limit = args?.limit ?? 100;
      const page = rows.slice(offset, offset + limit);
      return { transcripts: page, total_count: rows.length, has_more: offset + limit < rows.length };
    },

    api_get_meeting: (args) => {
      const id = args?.meetingId ?? args?.id;
      const m = meetingById(id);
      if (!m) throw new Error('Meeting not found');
      return { id: m.id, title: m.title, created_at: m.created_at, updated_at: m.updated_at, transcripts: transcriptsFor(id) };
    },

    get_transcript_history: (args) => transcriptsFor(args?.meetingId ?? args?.meeting_id),

    // Summary
    api_get_summary: (args) => {
      const id = args?.meetingId ?? args?.meeting_id;
      const m = meetingById(id);
      if (!m) return { status: 'idle', meeting_id: id, data: null, error: null };
      return {
        status: 'completed',
        meeting_name: m.title,
        meeting_id: m.id,
        data: { markdown: m.summary },
        start: m.created_at,
        end: m.created_at,
        error: null,
      };
    },
    api_save_meeting_summary: () => ({ status: 'ok' }),
    api_save_meeting_title: () => ({ status: 'ok' }),

    // Notes
    get_meeting_notes: (args) => {
      const id = args?.meetingId ?? args?.meeting_id;
      const m = meetingById(id);
      return m ? m.notes : null;
    },
    save_meeting_notes: () => null,

    // Templates
    api_list_templates: () => TEMPLATES,

    // Config — model / transcript
    api_get_model_config: () => MODEL_CONFIG,
    api_save_model_config: () => ({ status: 'ok' }),
    api_get_transcript_config: () => TRANSCRIPT_CONFIG,
    api_save_transcript_config: () => ({ status: 'ok' }),
    api_get_custom_openai_config: () => null,
    api_get_api_key: () => null,
    api_get_auto_generate_setting: () => false,
    api_get_meeting_summary_language: () => null,
    api_save_meeting_summary_language: () => ({ status: 'ok' }),
    api_search_transcripts: () => [],

    // Whisper models
    whisper_init: () => null,
    whisper_get_available_models: () => WHISPER_MODELS,
    whisper_get_current_model: () => 'nb-whisper-large-q5_0',
    whisper_get_models_directory: () => '/Users/demo/Library/Application Support/Referat/models',
    whisper_has_available_models: () => true,
    whisper_is_model_loaded: () => true,

    // Parakeet (alt transcription provider)
    parakeet_get_available_models: () => [],
    parakeet_has_available_models: () => false,
    parakeet_get_current_model: () => null,
    parakeet_init: () => null,

    // Built-in AI
    builtin_ai_list_models: () => [],
    builtin_ai_get_recommended_model: () => 'qwen2.5-3b-instruct-q4_k_m',
    builtin_ai_get_available_summary_model: () => null,
    builtin_ai_is_model_ready: () => false,
    builtin_ai_get_model_info: () => null,

    // Cloud model lists
    get_ollama_models: () => OLLAMA_MODELS,
    get_anthropic_models: () => ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
    get_openai_models: () => ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],

    // Preferences / storage
    get_recording_preferences: () => ({ preferred_mic_device: null, preferred_system_device: null }),
    get_notification_settings: () => ({
      recording_notifications: true,
      time_based_reminders: false,
      meeting_reminders: false,
      respect_do_not_disturb: true,
      notification_sound: true,
      system_permission_granted: true,
      consent_given: true,
      manual_dnd_mode: false,
      notification_preferences: {
        show_recording_started: true,
        show_recording_stopped: true,
        show_recording_paused: true,
        show_recording_resumed: true,
        show_transcription_complete: true,
        show_meeting_reminders: false,
        show_system_errors: true,
        meeting_reminder_minutes: [5, 15],
      },
    }),
    get_database_directory: () => '/Users/demo/Library/Application Support/Referat',
    get_default_recordings_folder_path: () => '/Users/demo/Movies/Referat',
    set_language_preference: () => null,
    set_notification_settings: () => null,

    // Permissions (report granted so no warning banner shows).
    // usePermissionCheck derives mic/system access from a device list; it needs
    // at least one Input and one Output device, each {name, device_type}.
    check_microphone_permission: () => true,
    check_system_audio_permission: () => true,
    get_audio_devices: () => [
      { name: 'MacBook Pro Mikrofon', device_type: 'Input' },
      { name: 'BlackHole 2ch', device_type: 'Output' },
    ],

    // Recording state
    is_recording: () => false,
    get_recording_state: () => ({ is_recording: false, is_paused: false }),
    get_transcription_status: () => ({ status: 'idle' }),
    has_audio_checkpoints: () => false,

    // Misc no-ops
    open_external_url: () => null,
    open_templates_folder: () => null,
    open_database_folder: () => null,
    open_models_folder: () => null,
    open_recordings_folder: () => null,
    hide_console: () => null,
    install_claude_connector: () => null,

    // ── Tauri plugin commands (routed through core.invoke by the api packages) ──
    // @tauri-apps/api/event
    'plugin:event|listen': () => 0, // returns an event id; unlisten is a no-op
    'plugin:event|unlisten': () => null,
    'plugin:event|emit': () => null,
    'plugin:event|emit_to': () => null,
    // @tauri-apps/api/app
    'plugin:app|version': () => '1.0.0',
    'plugin:app|name': () => 'Referat',
    'plugin:app|tauri_version': () => '2.0.0',
    'plugin:app|identifier': () => 'no.agentik.referat',
    // @tauri-apps/plugin-store (analytics opt-in store) — behave like empty store.
    // NB: get() must return a [value, exists] tuple.
    'plugin:store|load': () => null,
    'plugin:store|has': () => false,
    'plugin:store|get': () => [null, false],
    'plugin:store|set': () => null,
    'plugin:store|save': () => null,
    'plugin:store|delete': () => false,
    'plugin:store|clear': () => null,
    'plugin:store|reset': () => null,
    'plugin:store|entries': () => [],
    'plugin:store|keys': () => [],
    'plugin:store|values': () => [],
    'plugin:store|length': () => 0,
    // @tauri-apps/plugin-os (async paths)
    'plugin:os|locale': () => 'nb-NO',
    'plugin:os|hostname': () => 'mac',
  };

  // Default fallback: return null for unknown commands (instead of throwing,
  // which would surface as red error UI).
  function invoke(cmd, args) {
    const handler = MOCK[cmd];
    if (handler) {
      try {
        return Promise.resolve(handler(args || {}));
      } catch (e) {
        return Promise.reject(e);
      }
    }
    // Unknown command — log once and resolve to null so the UI degrades quietly.
    if (!invoke._warned) invoke._warned = new Set();
    if (!invoke._warned.has(cmd)) {
      invoke._warned.add(cmd);
      // eslint-disable-next-line no-console
      console.warn('[mock-tauri] unmocked command:', cmd, args);
    }
    return Promise.resolve(null);
  }

  let callbackId = 0;
  const internals = {
    invoke,
    transformCallback(callback, once) {
      const id = ++callbackId;
      const prop = `_${id}`;
      Object.defineProperty(window, prop, {
        value: (result) => {
          if (once) delete window[prop];
          return callback && callback(result);
        },
        writable: false,
        configurable: true,
      });
      return id;
    },
    unregisterCallback(id) {
      try { delete window[`_${id}`]; } catch (e) { /* noop */ }
    },
    convertFileSrc(filePath, protocol) {
      return filePath;
    },
    // Tauri reads metadata from this; provide harmless defaults.
    metadata: {
      currentWindow: { label: 'main' },
      currentWebview: { windowLabel: 'main', label: 'main' },
    },
    plugins: {},
  };

  window.__TAURI_INTERNALS__ = internals;

  // @tauri-apps/api/event's _unlisten() reads this global. Provide a no-op.
  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
    unregisterListener: () => {},
  };

  // @tauri-apps/plugin-os reads synchronous values from this global.
  window.__TAURI_OS_PLUGIN_INTERNALS__ = {
    platform: 'macos',
    version: '15.0',
    family: 'unix',
    os_type: 'macos',
    arch: 'aarch64',
    eol: '\n',
    exe_extension: '',
  };

  // Event system stubs (listen/emit/once) used by @tauri-apps/api/event.
  const eventApi = {
    listen: () => Promise.resolve(() => {}),
    once: () => Promise.resolve(() => {}),
    emit: () => Promise.resolve(),
    emitTo: () => Promise.resolve(),
  };

  // app api stub — About.tsx calls getVersion() from @tauri-apps/api/app.
  const appApi = {
    getVersion: () => Promise.resolve('1.0.0'),
    getName: () => Promise.resolve('Referat'),
    getTauriVersion: () => Promise.resolve('2.0.0'),
  };

  // Provide the withGlobalTauri-style global as well, in case any code path
  // references window.__TAURI__ directly.
  window.__TAURI__ = {
    core: { invoke, convertFileSrc: internals.convertFileSrc, transformCallback: internals.transformCallback },
    event: eventApi,
    app: appApi,
  };

  // Mark for sanity checks from the driver.
  window.__REFERAT_MOCK_READY__ = true;
})();
