import { useState, useEffect, useRef } from 'react';
import { Bot, X, Sparkles, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const SafetyBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Olá! Sou seu assistente de Segurança Contra Incêndio. Dúvidas sobre NR-23, classes de fogo ou uso de extintores? Pergunte!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('safety-bot', {
        body: { message: userMsg }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data?.reply || "Desculpe, não consegui processar sua dúvida no momento." 
      }]);
    } catch (error) {
      console.error('Error calling SafetyBot:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "Erro ao conectar com a IA. Tente novamente." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-700">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-6 h-6" />
              <div>
                <span className="font-bold">SafetyBot</span>
                <div className="flex items-center gap-1 text-xs opacity-80">
                  <Sparkles className="w-3 h-3" /> Gemini AI Powered
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80 bg-slate-800/50">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl text-sm max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white ml-auto' 
                    : 'bg-slate-700 text-gray-200'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-slate-700 text-gray-400 p-3 rounded-xl text-sm max-w-[85%] animate-pulse">
                Pensando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-slate-700 flex gap-2 bg-slate-900">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua dúvida..."
              className="flex-1 bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 ${isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-blue-600 to-purple-600'} text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300 hover:scale-110`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-8 h-8" />}
      </button>
    </>
  );
};
