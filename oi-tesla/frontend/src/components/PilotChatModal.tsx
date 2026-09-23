'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Shield, Phone, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  sender: 'rider' | 'pilot';
  text: string;
  time: string;
}

interface PilotChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  pilotName?: string;
  vehicleName?: string;
  plateNumber?: string;
  onCallPilot?: () => void;
}

export const PilotChatModal: React.FC<PilotChatModalProps> = ({
  isOpen,
  onClose,
  pilotName = 'Jashim Uddin (জসিম)',
  vehicleName = 'Bullet (বুলেট)',
  plateNumber = 'DH-Metro-TH-14-8821',
  onCallPilot,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'pilot',
      text: 'আসসালামু আলাইকুম! আমি বুলেট নিয়ে বনানী ১১ এর দিকে এগোচ্ছি। ৩ মিনিটের মধ্যে আসছি।',
      time: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    'আমি বনানী ১১ গেটে আছি 📍',
    'গাড়ির রঙ কী? 🛺',
    'বৃষ্টি শুরু হয়েছে, তাড়াতাড়ি আসুন 🌧️',
    'I have small luggage 🧳',
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'rider',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');

    // Simulate Pilot response
    setIsTyping(true);
    setTimeout(() => {
      let reply = 'জি ভাইয়া, পেয়েছি! আর ২ মিনিট সময় লাগবে।';
      if (text.includes('গেটে')) {
        reply = 'ঠিক আছে! আমি ঠিক গেটের মুখে বাম পাশে থামছি। বুলেট দেখা যাচ্ছে!';
      } else if (text.includes('রঙ') || text.includes('colour')) {
        reply = 'আমাদের বুলেট সায়ান ও ডার্ক গ্রিন ট্রিম যুক্ত ৩ সিটের ইলেকট্রিক টেসলা ট্রাইক। প্লেট: ১৪-৮৮২১।';
      } else if (text.includes('বৃষ্টি') || text.includes('rain')) {
        reply = 'চিন্তা করবেন না! বুলেটের ওয়াটারপ্রুফ সাইড কার্টেইন নামানো আছে, আপনি একদম শুকনো থাকবেন।';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `p-${Date.now()}`,
          sender: 'pilot',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface-container-low border border-surface-container-high rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[620px] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-surface-container p-4 border-b border-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center text-sm shadow">
                JU
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-surface-container" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-sora font-bold text-sm text-on-surface">{pilotName}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-semibold">
                  Pilot
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <span>{vehicleName}</span> • <span className="font-mono">{plateNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onCallPilot && (
              <button
                onClick={onCallPilot}
                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-primary transition"
                title="Call Pilot"
              >
                <Phone className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface-variant transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Encrypted Notice Banner */}
        <div className="bg-surface-container-lowest/60 px-4 py-2 border-b border-surface-container-high/40 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span className="flex items-center gap-1 text-primary">
            <Shield className="w-3.5 h-3.5" />
            End-to-End Encrypted Transit Chat
          </span>
          <span className="flex items-center gap-1 text-secondary">
            <Sparkles className="w-3 h-3" />
            Live Pilot Connected
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface-container-lowest/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'rider' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                  msg.sender === 'rider'
                    ? 'bg-primary text-on-primary rounded-br-xs font-medium'
                    : 'bg-surface-container-high text-on-surface rounded-bl-xs border border-surface-container-highest font-medium'
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
              </div>
              <span className="text-[10px] text-on-surface-variant/70 mt-1 px-1">
                {msg.time}
              </span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-on-surface-variant text-xs italic bg-surface-container-high/50 px-3 py-1.5 rounded-full w-fit">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </span>
              <span>Pilot Jashim is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-surface-container-low border-t border-surface-container-high/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(reply)}
              className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-container-highest transition shrink-0 active:scale-95"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-surface-container border-t border-surface-container-high flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message Pilot Jashim..."
            className="flex-1 bg-surface-container-highest text-on-surface placeholder:text-on-surface-variant/60 text-xs px-4 py-3 rounded-full focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary text-on-primary flex items-center justify-center transition active:scale-95 shrink-0 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
