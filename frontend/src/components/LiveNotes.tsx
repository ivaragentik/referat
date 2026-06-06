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

  // Track the previous meeting id so we can detect transitions.
  const prevMeetingIdRef = useRef<string>(meetingId);

  // Debounce timer for autosave to Tauri backend.
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-meeting hydration + migration
  //
  // This effect runs on every meetingId change (including the reset back to the
  // placeholder when navigating to the home page for a new session). This replaces
  // the old one-shot loadedRef guard that caused notes to bleed between meetings:
  // the guard prevented re-loading when meetingId transitioned real-id → placeholder,
  // so meeting N's notes would still be visible when starting meeting N+1.
  //
  // Transitions handled:
  //   placeholder → real id : migrate the live buffer into the saved meeting (crash-safe).
  //   real id → placeholder  : reset to the live session buffer (empty for a fresh session).
  //   initial mount          : load the correct buffer for the current id.
  useEffect(() => {
    const prevId = prevMeetingIdRef.current;

    // --- Placeholder → real id: migration -----------------------------------
    // When a recording stops, useRecordingStop calls setCurrentMeeting({id: realId}).
    // At that moment we read the LIVE_SESSION_KEY from localStorage — the source of
    // truth for what was typed during this session — and migrate it to the real id.
    // We read from localStorage rather than React state to avoid a stale-closure
    // race across the async migration function.
    if (prevId === PLACEHOLDER_ID && meetingId !== PLACEHOLDER_ID) {
      prevMeetingIdRef.current = meetingId;

      const liveBuffer = localStorage.getItem(LIVE_SESSION_KEY) ?? '';

      const migrate = async () => {
        if (!liveBuffer.trim()) {
          // Nothing typed during this session — nothing to migrate.
          return;
        }

        let finalNotes = liveBuffer;

        // Check if the DB already has notes for this real meeting id (e.g. from
        // a previous partial save or crash recovery).
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

        // Move localStorage buffer to the real-id key and clear the live key.
        localStorage.setItem(storageKey(meetingId), finalNotes);
        localStorage.removeItem(LIVE_SESSION_KEY);

        // Sync React state with the final merged value.
        setNotes(finalNotes);
      };

      migrate();
      return;
    }

    // --- Any other id change (real → placeholder, real → different real, or
    //     initial mount): load the correct buffer for the new id. -------------
    prevMeetingIdRef.current = meetingId;

    // Cancel any pending autosave for the previous meeting before loading new content.
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    const loadNotes = async () => {
      if (meetingId === PLACEHOLDER_ID) {
        // Placeholder id — use the live session key.
        // If nothing is stored (fresh session after a completed meeting), start blank.
        const ls = localStorage.getItem(LIVE_SESSION_KEY) ?? '';
        setNotes(ls);
        return;
      }

      // Real id — prefer DB, fall back to localStorage.
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
        console.warn('[LiveNotes] get_meeting_notes failed on id change:', err);
      }
      // Fall back to localStorage (real-id key only — never leak the live buffer
      // into a different real meeting).
      const ls = localStorage.getItem(storageKey(meetingId)) ?? '';
      setNotes(ls);
    };

    loadNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]); // Re-run on every meetingId change to isolate per-meeting notes

  // Cleanup debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  // Autosave (debounced)
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

  // Change handler
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNotes(value);
      scheduleAutosave(value, meetingId);
    },
    [meetingId, scheduleAutosave]
  );

  // Render
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
