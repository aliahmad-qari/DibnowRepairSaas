import { GoogleGenAI } from "@google/genai";

/**
 * Centralized AI Handshake Service
 * Manages the connection to Gemini and provides standardized prompt engineering.
 */
export const aiService = {
    /**
     * Initialize a new instance of the AI client.
     * Uses process.env.API_KEY injected via the index.html shim.
     */
    getClient: () => {
        return new GoogleGenAI({ apiKey: process.env.API_KEY });
    },

    /**
     * Generates a generic content response from Gemini 3 Flash.
     */
    generate: async (prompt: string, systemInstruction?: string) => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: systemInstruction ? { systemInstruction } : undefined
            });
            return response.text;
        } catch (error) {
            console.error("AI Node Failure:", error);
            throw error;
        }
    },

    /**
     * Specifically for JSON-schema required responses.
     */
    generateJson: async (prompt: string, systemInstruction: string) => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction,
                    responseMimeType: "application/json"
                }
            });
            return JSON.parse(response.text || '{}');
        } catch (error) {
            console.error("AI JSON Node Failure:", error);
            return null;
        }
    },

    /**
     * Multi-turn chat support.
     */
    chat: async (messages: { role: 'user' | 'model', parts: { text: string }[] }[], systemInstruction?: string) => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: messages,
                config: systemInstruction ? { systemInstruction } : undefined
            });
            return response.text;
        } catch (error) {
            console.error("AI Chat Failure:", error);
            throw error;
        }
    }
};
