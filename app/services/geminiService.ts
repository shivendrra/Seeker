import { GoogleGenAI, Content } from '@google/genai';
import { SYSTEM_PROMPT } from '../constants';
import { Message } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper to transform our Message[] into Gemini's Content[] format
const buildHistory = (messages: Message[]): Content[] => {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));
};

export const runResearchAgentStream = async (
  currentMessage: string,
  history: Message[]
) => {
  try {
    // Fix: Pass systemInstruction as a string inside the config object, as per the coding guidelines.
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-pro',
      contents: [
        ...buildHistory(history),
        { role: 'user', parts: [{ text: currentMessage }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT
      },
    });
    return stream;
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    throw error;
  }
};