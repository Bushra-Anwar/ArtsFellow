import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, X, Send, Bot, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AiCurator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>(() => {
    const saved = localStorage.getItem("ai_chat_history");
    return saved ? JSON.parse(saved) : [
      { role: "ai", text: "Hello! I am your AI Curator. I've analyzed your browsing patterns. Are you looking for Digital Art or physical canvas paintings today?" }
    ];
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("ai_chat_history", JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    // Simple mockup of an AI brain based on user's query
    setTimeout(() => {
      let aiResponse = "I can definitely help you find that. As your AI Curator, I'm logging this preference to refine your future recommendations!";

      const lower = userMsg.toLowerCase();
      if (lower.includes("digital art")) {
        aiResponse = "I noticed you asked about Digital Art! I have an excellent collection. I'm taking you to the Digital Art gallery now.";
        setTimeout(() => navigate("/search?query=Digital Art"), 2000);
      } else if (lower.includes("painting") || lower.includes("canvas")) {
        aiResponse = "Canvas paintings carry such a unique texture. Let me refine our collection to show you the top oil and acrylic masterpieces.";
        setTimeout(() => navigate("/search?query=Paintings"), 2000);
      } else if (lower.includes("exhibition") || lower.includes("map") || lower.includes("near me")) {
        aiResponse = "Looking for physical galleries? I am pulling up the Live Map to show you exhibitions within 5km of your location.";
        setTimeout(() => {
          const section = document.getElementById('exhibition-discovery');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
          else navigate('/search');
        }, 2000);
      } else if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
        aiResponse = "Greetings! My intelligence model uses your search history to recommend the perfect masterpiece. What draws your eye?";
      } else if (lower.includes("help") || lower.includes("support")) {
        aiResponse = "If you need system support or have platform issues, please open the main ChatPage and select the 'Admin' or 'High Council' to receive direct support.";
      } else if (lower.includes("price") || lower.includes("buy") || lower.includes("cost")) {
        aiResponse = "To buy an artwork, click on it to open its details page and select the Purchase option. Let me know if you would like me to take you to the Search Page.";
      }

      setMessages((prev) => [...prev, { role: "ai", text: aiResponse }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 left-6 z-[999] bg-[#00a3ad] text-white rounded-full p-4 shadow-[0_10px_30px_rgba(0,163,173,0.4)] flex items-center justify-center border border-white/20"
          >
            <User size={26} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, transition: { duration: 0.2 } }}
            className="fixed bottom-6 left-6 w-[350px] sm:w-[400px] h-[500px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.2)] rounded-3xl overflow-hidden z-[1000] flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#00a3ad]/10 dark:bg-[#00a3ad]/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00a3ad] flex items-center justify-center text-white shadow-sm overflow-hidden relative">
                  <Bot size={16} />
                  <div className="absolute inset-0 border-2 border-white rounded-full animate-ping opacity-30" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">AI Curator</h3>
                  <p className="text-[10px] text-[#00a3ad] dark:text-teal-400 font-bold">Online & Analyzing</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm("Clear all chat history?")) {
                      const initialMsg = [
                        { role: "ai" as const, text: "Hello! I am your AI Curator. I've analyzed your browsing patterns. Are you looking for Digital Art or physical canvas paintings today?" }
                      ];
                      setMessages(initialMsg);
                      localStorage.setItem("ai_chat_history", JSON.stringify(initialMsg));
                    }
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Clear Chat History"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 pb-2 min-h-0 space-y-4">
              <div className="text-center pb-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Secure AI Connection Established</span>
              </div>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "ai"
                      ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm"
                      : "bg-[#00a3ad] text-white rounded-tr-sm"
                    }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask me to find art..."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 rounded-full pl-4 pr-12 py-3 outline-none border border-slate-200 dark:border-slate-700 focus:border-teal-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-teal-600 !text-white rounded-full flex items-center justify-center hover:bg-teal-700 disabled:opacity-50 disabled:bg-slate-400 transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-slate-400 font-medium">Memory model adapts to your preferences.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
