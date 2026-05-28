import { create } from 'zustand';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  time?: string;
};

type ChatStore = {
  messagesByAnalysis: Record<string, ChatMessage[]>;
  setMessages: (analysisId: string, messages: ChatMessage[]) => void;
  addMessage: (analysisId: string, message: ChatMessage) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messagesByAnalysis: {},
  setMessages: (analysisId, messages) =>
    set((state) => ({
      messagesByAnalysis: { ...state.messagesByAnalysis, [analysisId]: messages },
    })),
  addMessage: (analysisId, message) =>
    set((state) => ({
      messagesByAnalysis: {
        ...state.messagesByAnalysis,
        [analysisId]: [...(state.messagesByAnalysis[analysisId] || []), message],
      },
    })),
}));
