'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

// The placeholder meeting id used on the home page before a real meeting is created.
const PLACEHOLDER_ID = 'intro-call';

// localStorage key while the real id is not yet known.
const LIVE_SESSION_KEY = 'referat-notes-live';

function storageKey(meetingId: string): string {
  return meetingId === PLACEHOLDER_ID
    ? LIVE_SESSION_KEY
    : `referat-notes-${meetingId}`;
}

interface LiveNotesProps {
  /** The current meeting id from SidebarProvider (may be the placeholder). */
  meetingId: string;
}

export function LiveNotes({ meetingId }: LiveNotesProps) {
  const [notes, setNotes] = useState<string>('');

  // Track whether we have loaded the initial value (avoid overwriting on re-renders).
  const loadedRef = useRef(false);

  // Track the previous meeting id so we can detect the placeholder → real transition.
  const prevMeetingIdRef = useRef<string>(meetingId);

  // Debounce timer for autosave to Tauri backend.
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Initial hydration ──────────────────────────────────────────────────────

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadNotes = async () => {
      if (meetingId !== PLACEHOLDER_ID) {
        // Real id on mount — prefer DB, fall back to localStorage.
        try {
          const dbNotes = await invoke<string | null>('get_meeting_notes', {
            meetingId,
          });
          if (dbNotes && dbNotes.trim().length > 0) {
            setNotes(dbNotes);
            // Mirror to localStorage for crash safety.
            localStorage.setItem(storageKey(meetingId), dbNotes);
            return;
          }
        } catch (err) {
          console.warn('[LiveNotes] get_meeting_notes failed on mount:', err);
        }
        // Fall back to localStorage (real-id key, then live-session key).
        const ls =
          localStorage.getItem(storageKey(meetingId)) ??
          localStorage.getItem(LIVE_SESSION_KEY) ??
          '';
        setNotes(ls);
      } else {
        // Placeholder id — use the live session key.
        const ls = localStorage.getItem(LIVE_SESSION_KEY) ?? '';
        setNotes(ls);
      }
    };

    loadNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only once on mount

  // ─── Placeholder → real id migration ────────────────────────────────────────

  useEffect(() => {
    const prevId = prevMeetingIdRef.current;
    prevMeetingIdRef.current = meetingId;

    // Only act when transitioning FROM the placeholder TO a real id.
    if (prevId !== PLACEHOLDER_ID || meetingId === PLACEHOLDER_ID) return;

    const migrate = async () => {
      // Read whatever we have buffered so far (state value + localStorage).
      const liveBuffer =
        notes ||
        localStorage.getItem(LIVE_SESSION_KEY) ||
        '';

      if (!liveBuffer.trim()) {
        // Nothing to migrate.
        return;
      }

      let finalNotes = liveBuffer;

      // Check if the DB already has notes for this real meeting id.
      try {
        const dbNotes = await invoke<string | null>('get_meeting_notes', {
          meetingId,
        });
        if (dbNotes && dbNotes.trim().length >= liveBuffer.trim().length) {
          // DB already has the same or more content — prefer DB.
          finalNotes = dbNotes;
        }
      } catch (err) {
        console.warn('[LiveNotes] get_meeting_notes failed during migration:', err);
      }

      // Flush buffered notes into the saved meeting.
      try {
        await invoke('save_meeting_notes', {
          meetingId,
          notesMarkdown: finalNotes,
        });
      } catch (err) {
        console.warn('[LiveNotes] save_meeting_notes failed during migration:', err);
      }

      // Move localStorage buffer to the real-id key.
      localStorage.setItem(storageKey(meetingId), finalNotes);
      localStorage.removeItem(LIVE_SESSION_KEY);

      // Sync React state with the final merged value.
      setNotes(finalNotes);
    };

    migrate();
  // notes is intentionally included so we read the latest value when the id changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  // ─── Autosave ───────────────────────────────────────────────────────────────

  const scheduleAutosave = useCallback(
    (currentNotes: string, currentMeetingId: string) => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(async () => {
        // Always persist to localStorage for crash safety.
        localStorage.setItem(storageKey(currentMeetingId), currentNotes);

        // Only call the Tauri command when we have a real meeting id.
        if (currentMeetingId !== PLACEHOLDER_ID) {
          try {
            await invoke('save_meeting_notes', {
              meetingId: currentMeetingId,
              notesMarkdown: currentNotes,
            });
          } catch (err) {
            console.warn('[LiveNotes] autosave failed:', err);
          }
        }
      }, 1000);
    },
    []
  );

  // Cleanup debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // ─── Change handler ─────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNotes(value);
      scheduleAutosave(value, meetingId);
    },
    [meetingId, scheduleAutosave]
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-y-auto pb-20">
      <div className="flex justify-center px-6 pt-6 flex-1">
        <div className="w-full max-w-[760px] flex flex-col flex-1">
          <textarea
            value={notes}
            onChange={handleChange}
            placeholder="Skriv stikkord mens møtet pågår…"
            className="w-full flex-1 min-h-[60vh] resize-none border-0 bg-transparent px-2 py-1 text-lg text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-0 leading-relaxed"
            spellCheck={false}
          />
          <p className="text-xs text-gray-400 text-center pt-3 pb-1">
            Notatene dine veves inn i sammendraget når møtet er ferdig.
          </p>
        </div>
      </div>
    </div>
  );
}
