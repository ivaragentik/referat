"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { Check, Loader2 } from "lucide-react";

interface NotesPanelProps {
  meetingId: string | null | undefined;
}

type SaveStatus = "idle" | "saving" | "saved";

export function NotesPanel({ meetingId }: NotesPanelProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const isContentLoaded = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the last markdown saved to avoid redundant saves
  const lastSavedMarkdown = useRef<string | null>(null);

  const editor = useCreateBlockNote();

  // On mount (or meetingId change): load notes from Tauri
  useEffect(() => {
    if (!meetingId) return;

    isContentLoaded.current = false;
    lastSavedMarkdown.current = null;

    const loadNotes = async () => {
      try {
        const markdown = await invoke<string | null>("get_meeting_notes", {
          meetingId,
        });

        if (markdown) {
          const blocks = await editor.tryParseMarkdownToBlocks(markdown);
          editor.replaceBlocks(editor.document, blocks);
          lastSavedMarkdown.current = markdown;
        } else {
          // Clear the editor for meetings with no notes
          editor.replaceBlocks(editor.document, [
            { type: "paragraph", content: "" },
          ]);
        }
      } catch (err) {
        console.error("[NotesPanel] Failed to load notes:", err);
      } finally {
        // Small delay so initial replaceBlocks doesn't trigger autosave
        setTimeout(() => {
          isContentLoaded.current = true;
        }, 150);
      }
    };

    loadNotes();

    return () => {
      // Cancel any pending debounced save when meetingId changes
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [meetingId]); // eslint-disable-line react-hooks/exhaustive-deps
  // NOTE: `editor` is stable (created once by useCreateBlockNote), safe to omit

  const saveNotes = useCallback(
    async (markdown: string) => {
      if (!meetingId) return;
      if (markdown === lastSavedMarkdown.current) return;

      setSaveStatus("saving");
      try {
        await invoke("save_meeting_notes", {
          meetingId,
          notesMarkdown: markdown,
        });
        lastSavedMarkdown.current = markdown;
        setSaveStatus("saved");
        // Reset "Lagret" indicator after 2 s
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err) {
        console.error("[NotesPanel] Failed to save notes:", err);
        setSaveStatus("idle");
      }
    },
    [meetingId]
  );

  const handleChange = useCallback(() => {
    if (!isContentLoaded.current) return;

    // Debounce: cancel previous timer, start a new 800 ms one
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setSaveStatus("saving");

    debounceTimer.current = setTimeout(async () => {
      const markdown = await editor.blocksToMarkdownLossy(editor.document);
      saveNotes(markdown);
    }, 800);
  }, [editor, saveNotes]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Mine notater</h2>
          {/* Save status indicator */}
          <span className="text-xs text-gray-400 flex items-center gap-1 min-w-[60px] justify-end">
            {saveStatus === "saving" && (
              <>
                <Loader2 size={11} className="animate-spin" />
                Lagrer…
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check size={11} className="text-green-500" />
                Lagret
              </>
            )}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">
          Skriv dine egne stikkord — de veves inn i sammendraget når du lager
          referat.
        </p>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {meetingId ? (
          <BlockNoteView
            editor={editor}
            editable={true}
            theme="light"
            onChange={handleChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">Ingen møte valgt</p>
          </div>
        )}
      </div>
    </div>
  );
}
