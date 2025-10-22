import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import LeftSidebar from './components/LeftSidebar';
import ResponseDisplay from './components/ResponseDisplay';
import QueryInput from './components/QueryInput';
import ProfileSetupScreen from './components/ProfileSetupScreen';
import { Message, ChatSession } from './types';
import {
  getUserSessions,
  createSession,
  getSessionMessages,
  addMessageToSession,
  updateMessageInSession,
  updateSessionTitle
} from './services/firebaseService';
import { runResearchAgentStream } from './services/geminiService';

function App() {
  const { user, loading, isProfileIncomplete } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (query: string) => {
    if (!activeSessionId || !user) return;

    const isNewSession = messages.length === 0;

    setIsLoading(true);

    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      text: query,
      sender: 'user',
    };
    await addMessageToSession(activeSessionId, userMessage);

    // If it's the first message, update the session title
    if (isNewSession) {
        const newTitle = query.length > 30 ? query.substring(0, 27) + '...' : query;
        await updateSessionTitle(activeSessionId, newTitle);
    }

    const botMessage: Omit<Message, 'id' | 'timestamp'> = {
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
          // Update the message in Firestore, which will trigger the onSnapshot listener
          await updateMessageInSession(activeSessionId, botMessageRef.id, responseText);
        }
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      await updateMessageInSession(activeSessionId, botMessageRef.id, 'Sorry, I encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }
  
  if (isProfileIncomplete) {
    return <ProfileSetupScreen user={user} />;
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      <LeftSidebar
        user={user}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={handleNewSession}
        onSelectSession={setActiveSessionId}
      />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex flex-col overflow-hidden">
          <ResponseDisplay messages={messages} />
          <div ref={messagesEndRef} />
        </main>
        <QueryInput onSend={handleSend} isLoading={isLoading} disabled={!activeSessionId} />
      </div>
    </div>
  );
}

export default App;
