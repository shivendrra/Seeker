import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import LeftSidebar from './components/LeftSidebar';
import ResponseDisplay from './components/ResponseDisplay';
import QueryInput from './components/QueryInput';
import ProfileSetupScreen from './components/ProfileSetupScreen';
import SettingsScreen from './components/SettingsScreen';
import TraceView from './components/TraceView';
import MobileHeader from './components/MobileHeader';
import { Message, ChatSession, Trace, Source } from './types';
import {
  getUserSessions,
  createSession,
  getSessionMessages,
  addMessageToSession,
  updateMessageInSession,
  updateSessionTitle,
  finalizeBotMessageInSession,
  deleteSession,
} from './services/firebaseService';
import { runResearchAgentStream } from './services/geminiService';
import { extractTraceAndContent } from './utils/parsing';

function App() {
  const { user, userProfile, loading, isProfileIncomplete } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTrace, setActiveTrace] = useState<Trace | null>(null);
  const [sessionSources, setSessionSources] = useState<Source[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTraceViewOpen, setIsTraceViewOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasTraceDetails = !!(activeTrace || (sessionSources && sessionSources.length > 0));

  useEffect(() => {
    if (userProfile?.settings?.theme) {
      setTheme(userProfile.settings.theme);
    }
  }, [userProfile]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (user) {
      const unsubscribe = getUserSessions(user.uid, setSessions);
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (activeSessionId) {
      const unsubscribe = getSessionMessages(activeSessionId, setMessages);
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);
  
  useEffect(() => {
    // Trace is only for the last bot message
    const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot');
    setActiveTrace(lastBotMessage?.trace || null);

    // Sources are accumulated for the whole session and de-duplicated
    const allSources = messages.flatMap(msg => (msg.sender === 'bot' && msg.sources) ? msg.sources : []);
    const uniqueSources = Array.from(new Map(allSources.map(source => [source.id, source])).values());
    
    // Sort sources by date, most recent first, if date is available
    uniqueSources.sort((a, b) => {
        try {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        } catch (e) {
            return 0; // Don't sort if dates are invalid
        }
    });

    setSessionSources(uniqueSources);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleNewSession = async () => {
    if (user) {
      const newSessionId = await createSession(user.uid);
      setActiveSessionId(newSessionId);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
    await deleteSession(sessionId);
  };

  const handleSend = async (query: string) => {
    if (!activeSessionId || !user) return;

    const isNewSession = messages.length === 0;
    setIsLoading(true);

    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      text: query,
      sender: 'user',
    };
    await addMessageToSession(activeSessionId, userMessage);

    if (isNewSession) {
        const newTitle = query.length > 30 ? query.substring(0, 27) + '...' : query;
        await updateSessionTitle(activeSessionId, newTitle);
    }

    const botMessage: Omit<Message, 'id' | 'timestamp' | 'trace'> = {
      text: '',
      sender: 'bot',
    };
    const botMessageRef = await addMessageToSession(activeSessionId, botMessage);

    try {
      const stream = await runResearchAgentStream(query, messages);
      let responseText = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          responseText += chunkText;
          await updateMessageInSession(activeSessionId, botMessageRef.id, responseText);
        }
      }

      // After stream is complete, parse for trace and update final message
      const { content, trace, sources } = extractTraceAndContent(responseText);
      await finalizeBotMessageInSession(activeSessionId, botMessageRef.id, content, trace, sources);

    } catch (error) {
      console.error('Error streaming response:', error);
      await updateMessageInSession(activeSessionId, botMessageRef.id, "I'm sorry, but the research could not be completed due to an error. Please try your query again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900">
        <div className="w-16 h-16 border-4 border-t-indigo-600 border-gray-200 dark:border-zinc-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }
  
  if (isProfileIncomplete || !userProfile) {
    return <ProfileSetupScreen user={user} />;
  }

  return (
    <>
      <div className="flex h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 overflow-hidden">
        {/* Left Sidebar - visible from MD, slide-out below */}
        <div
          className={`
            fixed inset-y-0 left-0 z-40 w-72 
            transition-transform duration-300 ease-in-out 
            md:relative md:translate-x-0 md:inset-auto md:z-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <LeftSidebar
            user={user}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onNewSession={() => {
              handleNewSession();
              setIsSidebarOpen(false);
            }}
            onSelectSession={(id) => {
              setActiveSessionId(id);
              setIsSidebarOpen(false);
            }}
            onOpenSettings={() => {
              setIsSettingsOpen(true);
              setIsSidebarOpen(false);
            }}
            onDeleteSession={handleDeleteSession}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>

        {/* Left Sidebar Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onToggleTraceView={() => setIsTraceViewOpen(!isTraceViewOpen)}
            hasTraceDetails={hasTraceDetails}
          />
          <main className="flex-1 flex flex-col overflow-hidden">
            <ResponseDisplay messages={messages} />
            <div ref={messagesEndRef} />
          </main>
          <QueryInput onSend={handleSend} isLoading={isLoading} activeSessionId={activeSessionId} />
        </div>

        {/* Right TraceView (Static on XL+) */}
        <div className="hidden xl:flex xl:flex-shrink-0 w-80">
          {(userProfile?.settings?.showTrace !== false) && <TraceView trace={activeTrace} sources={sessionSources} onClose={() => setIsTraceViewOpen(false)} />}
        </div>
        
        {/* Right TraceView (Slide-out on < XL) */}
        <div
          className={`
            fixed inset-y-0 right-0 z-50 w-80
            transition-transform duration-300 ease-in-out xl:hidden
            ${isTraceViewOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {(userProfile?.settings?.showTrace !== false) && <TraceView trace={activeTrace} sources={sessionSources} onClose={() => setIsTraceViewOpen(false)} />}
        </div>
        
        {/* Right TraceView Backdrop */}
        {isTraceViewOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
            onClick={() => setIsTraceViewOpen(false)}
          ></div>
        )}
      </div>
      {isSettingsOpen && (
        <SettingsScreen
          user={user}
          userProfile={userProfile}
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
        />
      )}
    </>
  );
}

export default App;