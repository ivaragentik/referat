'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Analytics from '@/lib/analytics';
import { invoke } from '@tauri-apps/api/core';
import { useRecordingState } from '@/contexts/RecordingStateContext';


interface SidebarItem {
  id: string;
  title: string;
  type: 'folder' | 'file' | 'header';
  created_at?: string;
  children?: SidebarItem[];
}

export interface CurrentMeeting {
  id: string;
  title: string;
  created_at?: string;
}

// Group meetings into date buckets with non-interactive header rows,
// newest group first (the list arrives sorted newest-first from the backend).
function groupMeetingsByDate(meetings: CurrentMeeting[]): SidebarItem[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 6);

  const groups: { id: string; label: string; items: CurrentMeeting[] }[] = [
    { id: 'hdr-today', label: 'I dag', items: [] },
    { id: 'hdr-yesterday', label: 'I går', items: [] },
    { id: 'hdr-week', label: 'Tidligere denne uka', items: [] },
    { id: 'hdr-older', label: 'Eldre', items: [] },
  ];

  meetings.forEach(m => {
    const d = m.created_at ? new Date(m.created_at) : null;
    if (!d || isNaN(d.getTime())) {
      groups[3].items.push(m);
    } else if (d >= startOfToday) {
      groups[0].items.push(m);
    } else if (d >= startOfYesterday) {
      groups[1].items.push(m);
    } else if (d >= startOfWeek) {
      groups[2].items.push(m);
    } else {
      groups[3].items.push(m);
    }
  });

  const children: SidebarItem[] = [];
  groups.forEach(g => {
    if (g.items.length === 0) return;
    children.push({ id: g.id, title: g.label, type: 'header' });
    g.items.forEach(m => children.push({ id: m.id, title: m.title, type: 'file', created_at: m.created_at }));
  });
  return children;
}

// Search result type for transcript search
interface TranscriptSearchResult {
  id: string;
  title: string;
  matchContext: string;
  timestamp: string;
};

interface SidebarContextType {
  currentMeeting: CurrentMeeting | null;
  setCurrentMeeting: (meeting: CurrentMeeting | null) => void;
  sidebarItems: SidebarItem[];
  isCollapsed: boolean;
  toggleCollapse: () => void;
  meetings: CurrentMeeting[];
  setMeetings: (meetings: CurrentMeeting[]) => void;
  isMeetingActive: boolean;
  setIsMeetingActive: (active: boolean) => void;
  handleRecordingToggle: () => void;
  searchTranscripts: (query: string) => Promise<void>;
  searchResults: TranscriptSearchResult[];
  isSearching: boolean;
  setServerAddress: (address: string) => void;
  serverAddress: string;
  transcriptServerAddress: string;
  setTranscriptServerAddress: (address: string) => void;
  // Summary polling management
  startSummaryPolling: (meetingId: string, processId: string, onUpdate: (result: any) => void) => void;
  stopSummaryPolling: (meetingId: string) => void;
  // Refetch meetings from backend
  refetchMeetings: () => Promise<void>;

}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [currentMeeting, setCurrentMeeting] = useState<CurrentMeeting | null>({ id: 'intro-call', title: '+ Nytt møte' });
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [meetings, setMeetings] = useState<CurrentMeeting[]>([]);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [serverAddress, setServerAddress] = useState('');
  const [transcriptServerAddress, setTranscriptServerAddress] = useState('');
  // Ref-based so starting/stopping one poll never tears down the others
  // (a state-based map made the cleanup effect clear every active interval on change)
  const activeSummaryPollsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Use recording state from RecordingStateContext (single source of truth)
  const { isRecording } = useRecordingState();

  const pathname = usePathname();
  const router = useRouter();

  // Extract fetchMeetings as a reusable function
  const fetchMeetings = React.useCallback(async () => {
    if (serverAddress) {
      try {
        const meetings = await invoke('api_get_meetings') as Array<{ id: string, title: string, created_at?: string }>;
        const transformedMeetings = meetings.map((meeting: any) => ({
          id: meeting.id,
          title: meeting.title,
          created_at: meeting.created_at
        }));
        setMeetings(transformedMeetings);
        Analytics.trackBackendConnection(true);
      } catch (error) {
        console.error('Error fetching meetings:', error);
        setMeetings([]);
        Analytics.trackBackendConnection(false, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }, [serverAddress]);

  useEffect(() => {
    fetchMeetings();
  }, [serverAddress, fetchMeetings]);

  useEffect(() => {
    const fetchSettings = async () => {
      setServerAddress('http://localhost:5167');
      setTranscriptServerAddress('http://127.0.0.1:8178/stream');
    };
    fetchSettings();
  }, []);

  const baseItems: SidebarItem[] = [
    {
      id: 'meetings',
      title: 'Møtenotater',
      type: 'folder' as const,
      children: groupMeetingsByDate(meetings)
    },
  ];


  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Update current meeting when on home page
  useEffect(() => {
    if (pathname === '/') {
      setCurrentMeeting({ id: 'intro-call', title: '+ Nytt møte' });
    }
    setSidebarItems(baseItems);
  }, [pathname]);

  // Update sidebar items when meetings change
  useEffect(() => {
    setSidebarItems(baseItems);
  }, [meetings]);

  // Function to handle recording toggle from sidebar
  const handleRecordingToggle = useCallback(() => {
    if (!isRecording) {
      // Check if already on home page
      if (pathname === '/') {
        // Already on home - trigger recording directly via custom event
        console.log('Triggering recording from sidebar (already on home page)');
        window.dispatchEvent(new CustomEvent('start-recording-from-sidebar'));
      } else {
        // Not on home - navigate and use auto-start mechanism
        console.log('Navigating to home page with auto-start flag');
        sessionStorage.setItem('autoStartRecording', 'true');
        router.push('/');
      }

      // Track recording initiation from sidebar
      Analytics.trackButtonClick('start_recording', 'sidebar');
    }
    // The actual recording start/stop is handled in the Home component
  }, [isRecording, pathname, router]);

  // Function to search through meeting transcripts
  const searchTranscripts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);


      const results = await invoke('api_search_transcripts', { query }) as TranscriptSearchResult[];
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching transcripts:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Summary polling management
  const startSummaryPolling = useCallback((
    meetingId: string,
    processId: string,
    onUpdate: (result: any) => void
  ) => {
    const polls = activeSummaryPollsRef.current;

    // Stop existing poll for this meeting if any
    if (polls.has(meetingId)) {
      clearInterval(polls.get(meetingId)!);
      polls.delete(meetingId);
    }

    console.log(`📊 Starting polling for meeting ${meetingId}, process ${processId}`);

    let pollCount = 0;
    const MAX_POLLS = 200; // ~16.5 minutes at 5-second intervals (slightly longer than backend's 15-min timeout to avoid race conditions)
    let inFlight = false;

    const stopThisPoll = () => {
      clearInterval(pollInterval);
      polls.delete(meetingId);
    };

    const pollInterval = setInterval(async () => {
      // Skip this tick if the previous request is still pending (slow backend)
      if (inFlight) return;
      pollCount++;

      // Timeout safety
      if (pollCount >= MAX_POLLS) {
        console.warn(`⏱️ Polling timeout for ${meetingId} after ${MAX_POLLS} iterations`);
        stopThisPoll();
        onUpdate({
          status: 'error',
          error: 'Sammendragsgenerering tidsavbrutt etter 15 minutter. Prøv igjen eller sjekk modellkonfigurasjonen din.'
        });
        return;
      }
      try {
        inFlight = true;
        const result = await invoke('api_get_summary', {
          meetingId: meetingId,
        }) as any;

        console.log(`📊 Polling update for ${meetingId}:`, result.status);

        // Call the update callback with result
        onUpdate(result);

        // Stop polling if completed, error, failed, cancelled, or idle (after initial processing)
        if (result.status === 'completed' || result.status === 'error' || result.status === 'failed' || result.status === 'cancelled') {
          console.log(`Polling completed for ${meetingId}, status: ${result.status}`);
          stopThisPoll();
        } else if (result.status === 'idle' && pollCount > 1) {
          // If we get 'idle' after polling started, process completed/disappeared
          console.log(`Process completed or not found for ${meetingId}, stopping poll`);
          stopThisPoll();
        }
      } catch (error) {
        console.error(`Polling error for ${meetingId}:`, error);
        // Report error to callback
        onUpdate({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        stopThisPoll();
      } finally {
        inFlight = false;
      }
    }, 5000); // Poll every 5 seconds

    polls.set(meetingId, pollInterval);
  }, []);

  const stopSummaryPolling = useCallback((meetingId: string) => {
    const pollInterval = activeSummaryPollsRef.current.get(meetingId);
    if (pollInterval) {
      console.log(`⏹️ Stopping polling for meeting ${meetingId}`);
      clearInterval(pollInterval);
      activeSummaryPollsRef.current.delete(meetingId);
    }
  }, []);

  // Cleanup all polling intervals on unmount only
  useEffect(() => {
    const polls = activeSummaryPollsRef.current;
    return () => {
      console.log('🧹 Cleaning up all summary polling intervals');
      polls.forEach(interval => clearInterval(interval));
      polls.clear();
    };
  }, []);



  const contextValue = useMemo(() => ({
    currentMeeting,
    setCurrentMeeting,
    sidebarItems,
    isCollapsed,
    toggleCollapse,
    meetings,
    setMeetings,
    isMeetingActive,
    setIsMeetingActive,
    handleRecordingToggle,
    searchTranscripts,
    searchResults,
    isSearching,
    setServerAddress,
    serverAddress,
    transcriptServerAddress,
    setTranscriptServerAddress,
    startSummaryPolling,
    stopSummaryPolling,
    refetchMeetings: fetchMeetings,
  }), [
    currentMeeting,
    sidebarItems,
    isCollapsed,
    toggleCollapse,
    meetings,
    isMeetingActive,
    handleRecordingToggle,
    searchTranscripts,
    searchResults,
    isSearching,
    serverAddress,
    transcriptServerAddress,
    startSummaryPolling,
    stopSummaryPolling,
    fetchMeetings,
  ]);

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}
