import { useCallback, RefObject } from 'react';
import { Transcript, Summary } from '@/types';
import { BlockNoteSummaryViewRef } from '@/components/AISummary/BlockNoteSummaryView';
import { toast } from 'sonner';
import Analytics from '@/lib/analytics';
import { invoke as invokeTauri } from '@tauri-apps/api/core';

interface UseCopyOperationsProps {
  meeting: any;
  transcripts: Transcript[];
  meetingTitle: string;
  aiSummary: Summary | null;
  blockNoteSummaryRef: RefObject<BlockNoteSummaryViewRef>;
}

export function useCopyOperations({
  meeting,
  transcripts,
  meetingTitle,
  aiSummary,
  blockNoteSummaryRef,
}: UseCopyOperationsProps) {

  // Helper function to fetch ALL transcripts for copying (not just paginated data)
  const fetchAllTranscripts = useCallback(async (meetingId: string): Promise<Transcript[]> => {
    try {
      console.log('📊 Fetching all transcripts for copying:', meetingId);

      // First, get total count by fetching first page
      const firstPage = await invokeTauri('api_get_meeting_transcripts', {
        meetingId,
        limit: 1,
        offset: 0,
      }) as { transcripts: Transcript[]; total_count: number; has_more: boolean };

      const totalCount = firstPage.total_count;
      console.log(`📊 Total transcripts in database: ${totalCount}`);

      if (totalCount === 0) {
        return [];
      }

      // Fetch all transcripts in one call
      const allData = await invokeTauri('api_get_meeting_transcripts', {
        meetingId,
        limit: totalCount,
        offset: 0,
      }) as { transcripts: Transcript[]; total_count: number; has_more: boolean };

      console.log(`✅ Fetched ${allData.transcripts.length} transcripts from database for copying`);
      return allData.transcripts;
    } catch (error) {
      console.error('❌ Error fetching all transcripts:', error);
      toast.error('Kunne ikke hente transkripsjoner for kopiering');
      return [];
    }
  }, []);

  // Copy transcript to clipboard
  const handleCopyTranscript = useCallback(async () => {
    // CHANGE: Fetch ALL transcripts from database, not from pagination state
    console.log('📊 Fetching all transcripts for copying...');
    const allTranscripts = await fetchAllTranscripts(meeting.id);

    if (!allTranscripts.length) {
      const error_msg = 'No transcripts available to copy';
      console.log(error_msg);
      toast.error(error_msg);
      return;
    }

    console.log(`✅ Copying ${allTranscripts.length} transcripts to clipboard`);

    // Format timestamps as recording-relative [MM:SS] instead of wall-clock time
    const formatTime = (seconds: number | undefined, fallbackTimestamp: string): string => {
      if (seconds === undefined) {
        // For old transcripts without audio_start_time, use wall-clock time
        return fallbackTimestamp;
      }
      const totalSecs = Math.floor(seconds);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
    };

    const header = `# Transkripsjon av møtet: ${meeting.id} - ${meetingTitle ?? meeting.title}\n\n`;
    const date = `## Dato: ${new Date(meeting.created_at).toLocaleDateString()}\n\n`;
    const fullTranscript = allTranscripts
      .map(t => `${formatTime(t.audio_start_time, t.timestamp)} ${t.text}  `)
      .join('\n');

    await navigator.clipboard.writeText(header + date + fullTranscript);
    toast.success("Transkripsjon kopiert til utklippstavlen");

    // Track copy analytics
    const wordCount = allTranscripts
      .map(t => t.text.split(/\s+/).length)
      .reduce((a, b) => a + b, 0);

    await Analytics.trackCopy('transcript', {
      meeting_id: meeting.id,
      transcript_length: allTranscripts.length.toString(),
      word_count: wordCount.toString()
    });
  }, [meeting, meetingTitle, fetchAllTranscripts]);

  // Resolve the current summary as markdown: BlockNote editor first,
  // then the stored markdown, then the legacy section/block format.
  const getSummaryMarkdown = useCallback(async (): Promise<string> => {
    let summaryMarkdown = '';

    // Try to get markdown from BlockNote editor first
    if (blockNoteSummaryRef.current?.getMarkdown) {
      summaryMarkdown = await blockNoteSummaryRef.current.getMarkdown();
    }

    // Fallback: Check if aiSummary has markdown property
    if (!summaryMarkdown && aiSummary && 'markdown' in aiSummary) {
      summaryMarkdown = (aiSummary as any).markdown || '';
    }

    // Fallback: Check for legacy format
    if (!summaryMarkdown && aiSummary) {
      const sections = Object.entries(aiSummary)
        .filter(([key]) => {
          // Skip non-section keys
          return key !== 'markdown' && key !== 'summary_json' && key !== '_section_order' && key !== 'MeetingName';
        })
        .map(([, section]) => {
          if (section && typeof section === 'object' && 'title' in section && 'blocks' in section) {
            const sectionTitle = `## ${section.title}\n\n`;
            const sectionContent = section.blocks
              .map((block: any) => `- ${block.content}`)
              .join('\n');
            return sectionTitle + sectionContent;
          }
          return '';
        })
        .filter(s => s.trim())
        .join('\n\n');
      summaryMarkdown = sections;
    }

    return summaryMarkdown;
  }, [aiSummary, blockNoteSummaryRef]);

  const buildMarkdownHeader = useCallback((verb: string) => {
    const dateFormat: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return `# Møtesammendrag: ${meetingTitle}\n\n` +
      `**Møte-ID:** ${meeting.id}\n` +
      `**Dato:** ${new Date(meeting.created_at).toLocaleDateString('nb-NO', dateFormat)}\n` +
      `**${verb}:** ${new Date().toLocaleDateString('nb-NO', dateFormat)}\n\n---\n\n`;
  }, [meeting, meetingTitle]);

  // Copy summary to clipboard
  const handleCopySummary = useCallback(async () => {
    try {
      const summaryMarkdown = await getSummaryMarkdown();

      // If still no summary content, show message
      if (!summaryMarkdown.trim()) {
        console.error('❌ No summary content available to copy');
        toast.error('Ingen sammendragsinnhold tilgjengelig for kopiering');
        return;
      }

      const fullMarkdown = buildMarkdownHeader('Kopiert') + summaryMarkdown;
      await navigator.clipboard.writeText(fullMarkdown);

      toast.success("Sammendrag kopiert til utklippstavlen");

      // Track copy analytics
      await Analytics.trackCopy('summary', {
        meeting_id: meeting.id,
        has_markdown: (!!aiSummary && 'markdown' in aiSummary).toString()
      });
    } catch (error) {
      console.error('❌ Failed to copy summary:', error);
      toast.error("Kunne ikke kopiere sammendrag");
    }
  }, [aiSummary, meeting, getSummaryMarkdown, buildMarkdownHeader]);

  // Export summary as a Markdown file via the native save dialog
  const handleExportSummary = useCallback(async () => {
    try {
      const summaryMarkdown = await getSummaryMarkdown();

      if (!summaryMarkdown.trim()) {
        toast.error('Ingen sammendragsinnhold tilgjengelig for eksport');
        return;
      }

      const { save } = await import('@tauri-apps/plugin-dialog');
      const safeTitle = (meetingTitle || 'motesammendrag')
        .replace(/[\\/:*?"<>|]/g, '-')
        .slice(0, 80);
      const filePath = await save({
        title: 'Eksporter sammendrag',
        defaultPath: `${safeTitle}.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });
      if (!filePath) return; // User cancelled

      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      await writeTextFile(filePath, buildMarkdownHeader('Eksportert') + summaryMarkdown);

      toast.success('Sammendrag eksportert', {
        description: filePath,
      });
    } catch (error) {
      console.error('❌ Failed to export summary:', error);
      toast.error('Kunne ikke eksportere sammendrag');
    }
  }, [meetingTitle, getSummaryMarkdown, buildMarkdownHeader]);

  return {
    handleCopyTranscript,
    handleCopySummary,
    handleExportSummary,
  };
}
