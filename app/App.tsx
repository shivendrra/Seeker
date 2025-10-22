import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import LeftSidebar from './components/LeftSidebar';
import ResponseDisplay from './components/ResponseDisplay';
import QueryInput from './components/QueryInput';
import ProfileSetupScreen from './components/ProfileSetupScreen';
import SettingsScreen from './components/SettingsScreen';
import TraceView from './components/TraceView';
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
  const [activeSources, setActiveSources] = useState<Source[] | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // When messages update, find the last bot message to display its trace/sources
    const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot');
    if (lastBotMessage) {
        setActiveTrace(lastBotMessage.trace || null);
        setActiveSources(lastBotMessage.sources || null);
    } else {
        setActiveTrace(null);
        setActiveSources(null);
    }
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
      await updateMessageInSession(activeSessionId, botMessageRef.id, 'Sorry, I encountered an error.');
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
      <div className="flex h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
        <LeftSidebar
          user={user}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewSession={handleNewSession}
          onSelectSession={setActiveSessionId}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onDeleteSession={handleDeleteSession}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 flex flex-col overflow-hidden">
            <ResponseDisplay messages={messages} />
            <div ref={messagesEndRef} />
          </main>
          <QueryInput onSend={handleSend} isLoading={isLoading} activeSessionId={activeSessionId} />
        </div>
        {(userProfile?.settings?.showTrace !== false) && <TraceView trace={activeTrace} sources={activeSources} />}
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