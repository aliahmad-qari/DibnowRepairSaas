
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, X, Send, Sparkles, BrainCircuit, Loader2, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export const AIChatbot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: `Hello ${user?.name || 'there'}! I'm DibAssistant, your specialized AI for the DibNow platform. Need a device diagnosis or help managing your shop?`, 
      timestamp: new Date() 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `
        You are "DibAssistant", the official AI representative for DibNow, a premier SaaS platform for gadget repair shops.
        
        YOUR CORE KNOWLEDGE:
        1. PLATFORM: DibNow offers Inventory, Repair Bookings, POS (Point of Sale), Team Management, and Wallet systems.
        2. TIERS: Starter (1 repair/mo), Basic (£2, 5 repairs), Premium (£5, 7 repairs), Gold (£7, 1000 repairs).
        3. DIAGNOSTICS: You are an expert in diagnosing iPhone, Samsung, Xiaomi, MacBook, and other gadgets.
        
        YOUR PERSONALITY:
        - Professional, technical, yet encouraging.
        - You always refer to the user as a "Shop Partner" or by their name: ${user?.name}.
        - If asked about repairs, provide detailed checklists.
        - If asked about platform features, guide them to the correct sidebar menu.
        
        STRICT RULES:
        - Do not mention other software like Odoo or RepairShopr.
        - Keep responses concise and formatted with bullet points for technical steps.
      `;

      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const aiText = response.text || "I'm having trouble processing that right now. How else can I help your shop today?";
      setMessages(prev => [...prev, { role: 'model', text: aiText, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Service temporary unavailable. Please try again shortly.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-[#0052FF] to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[200] group"
      >
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black animate-bounce">1</div>
        <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 z-[200] flex flex-col transition-all duration-300 ${isMinimized ? 'h-16 w-64' : 'h-[600px] w-[400px]'} shadow-2xl rounded-[2.5rem] overflow-hidden bg-white border border-slate-100`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0052FF] to-indigo-700 p-5 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest leading-none">DibAssistant</h3>
            <p className="text-[10px] font-bold text-blue-200 mt-1 uppercase tracking-tighter">AI Support Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            {isMinimized ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-[#0052FF] text-white' : 'bg-white text-indigo-600 border border-slate-100'}`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-[#0052FF] text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                  }`}>
                    {m.text.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
                    <p className={`text-[8px] mt-2 font-black uppercase opacity-40 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-indigo-600">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none">
                     <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text" 
                placeholder="Ask about diagnostics or platform..." 
                className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-xs font-black transition-all"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:bg-slate-300 shadow-lg shadow-indigo-100"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="flex items-center justify-center gap-2 mt-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">
               <Sparkles size={10} /> Powered by DibNow Intelligence
            </div>
          </div>
        </>
      )}
    </div>
  );
};
