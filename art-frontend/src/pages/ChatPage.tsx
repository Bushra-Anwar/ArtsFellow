import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  Send,
  MessageSquare,
  ArrowLeft,
  Search,
  MoreVertical,
  Smile,
  Paperclip,
  Info,
  Check,
  CheckCheck,
  LayoutDashboard,
  Phone,
  Mail,
  Users,
  Settings,
  Maximize2,
  Minimize2,
  X,
  Globe,
  Monitor,
  Smartphone,
  Calendar,
  History,
  Facebook,
  Twitter,
  Instagram,
  Mic,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Cpu,
  LifeBuoy,
  Image as ImageIcon,
  FileText,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useChat } from "../context/ChatContext";

const ChatPage = () => {
  const { user } = useAuth();
  const { socket, onlineUsers, typingUsers, emitTyping, emitStopTyping } = useChat();
  const location = useLocation();
  const [messages, setMessages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfile, setShowProfile] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    bot: true,
    reports: true,
    new: true,
    open: true,
    history: false,
  });

  // Typing debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Initial load
  useEffect(() => {
    if (location.state?.chatWith) {
      setActiveChatUser(location.state.chatWith);
    }
  }, [location.state]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SOCKET EVENT HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: any) => {
      if (
        activeChatUser &&
        (message.senderId === activeChatUser.id ||
          message.senderId === activeChatUser._id ||
          (message.senderId === "chatbot" && activeChatUser.id === "chatbot"))
      ) {
        setMessages((prev) => [...prev, message]);
      }
      fetchContacts();
    };

    const handleMessageEdited = ({ messageId, content }: any) => {
      setMessages((prev) =>
        prev.map((m) =>
          (m._id === messageId || m._id?.toString() === messageId)
            ? { ...m, content, isEdited: true }
            : m,
        ),
      );
    };

    const handleMessageDeleted = ({ messageId, type }: any) => {
      if (type === "everyone") {
        setMessages((prev) =>
          prev.map((m) =>
            (m._id === messageId || m._id?.toString() === messageId)
              ? { ...m, content: "This message was deleted", isDeletedForEveryone: true }
              : m,
          ),
        );
      }
    };

    const handleMessagesRead = ({ readBy }: any) => {
      if (activeChatUser && (readBy === activeChatUser.id || readBy === activeChatUser._id)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user?._id ? { ...m, read: true } : m,
          ),
        );
      }
    };

    const handleContactsUpdated = () => {
      fetchContacts();
    };

    socket.on("receiveMessage", handleMessage);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("contactsUpdated", handleContactsUpdated);

    return () => {
      socket.off("receiveMessage", handleMessage);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("contactsUpdated", handleContactsUpdated);
    };
  }, [activeChatUser, socket, user]);

  // Fetch messages (initial load only — then socket handles updates)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !activeChatUser) return;
      try {
        const token = localStorage.getItem("art_token");
        const id = activeChatUser.id || activeChatUser._id;
        const res = await fetch(`/api/chat/history/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === "ok") {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };

    if (activeChatUser) {
      fetchMessages();
      // Mark messages as read via socket
      const id = activeChatUser.id || activeChatUser._id;
      if (id !== "chatbot") {
        socket?.emit("markRead", { conversationWith: id });
      }
    }
  }, [activeChatUser, user]);

  // Fetch contacts
  const fetchContacts = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("art_token");
      const res = await fetch("/api/chat/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "ok") {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SEND MESSAGE — WebSocket first!
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSend = async (
    e?: React.FormEvent,
    customContent?: { content: string; type?: string; attachmentUrl?: string },
  ) => {
    if (e) e.preventDefault();

    const finalContent = customContent?.content || text;
    const finalType = customContent?.type || "text";
    const finalUrl = customContent?.attachmentUrl || "";

    if (!finalContent.trim() && !finalUrl) return;
    if (!user || !activeChatUser || !socket) return;

    setText("");
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    // Stop typing indicator
    const receiverId = activeChatUser.id || activeChatUser._id;
    emitStopTyping(receiverId);

    const category =
      activeChatUser.id === "chatbot"
        ? "bot"
        : activeChatUser.role === "admin"
          ? "report"
          : "general";

    const messageData = {
      receiverId,
      content: finalContent,
      type: finalType,
      attachmentUrl: finalUrl,
      category: category,
    };

    // ── Send via WebSocket with acknowledgment ───────────
    socket.emit("sendMessage", messageData, (response: any) => {
      if (response?.status === "ok") {
        setMessages((prev) => [...prev, response.data]);
        fetchContacts();
      } else if (response?.error) {
        console.error("Send failed:", response.error);
      }
    });

    setTimeout(() => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPING HANDLER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    setShowEmojiPicker(false);

    if (activeChatUser) {
      const receiverId = activeChatUser.id || activeChatUser._id;
      emitTyping(receiverId);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(receiverId);
      }, 2000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    setShowAttachMenu(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("art_token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.status === "ok") {
        const type = file.type.startsWith("image/") ? "image" : "file";
        handleSend(undefined, {
          content: `Sent ${type === "image" ? "an image" : "a file"}: ${file.name}`,
          type: type,
          attachmentUrl: data.url,
        });
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredContacts = contacts.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.lastMessageContent || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const sections = {
    bot: filteredContacts.filter((c) => c.userId === "chatbot"),
    reports: filteredContacts.filter(
      (c) =>
        (c.category === "report" || c.role === "admin") &&
        c.userId !== "chatbot",
    ),
    new: filteredContacts.filter(
      (c) =>
        c.unread > 0 &&
        c.category !== "report" &&
        c.role !== "admin" &&
        c.userId !== "chatbot",
    ),
    open: filteredContacts.filter(
      (c) =>
        c.unread === 0 &&
        c.category !== "report" &&
        c.role !== "admin" &&
        c.userId !== "chatbot" &&
        new Date().getTime() - new Date(c.lastMessageTime).getTime() <
          86400000 * 2,
    ),
    history: filteredContacts.filter(
      (c) =>
        c.unread === 0 &&
        c.category !== "report" &&
        c.role !== "admin" &&
        c.userId !== "chatbot" &&
        new Date().getTime() - new Date(c.lastMessageTime).getTime() >=
          86400000 * 2,
    ),
  };

  // Check if selected user is typing
  const isContactTyping =
    activeChatUser && typingUsers.has(activeChatUser.id || activeChatUser._id || "");
  const isContactOnline =
    activeChatUser && onlineUsers.has(activeChatUser.id || activeChatUser._id || "");

  if (!user)
    return <div className="p-10 text-center">Please login to chat.</div>;

  return (
    <div
      className={`flex h-screen w-full overflow-hidden pt-20 transition-all duration-500 ${isDarkMode ? "bg-[#071c22]" : "bg-[#ced7dc]"}`}
    >
      {/* 1. Sidebar Nav - teal gradient (HIDDEN on mobile) */}
      <div
        className={`hidden md:flex w-[70px] flex-col items-center py-8 gap-10 z-50 shrink-0 ${isDarkMode ? "bg-gradient-to-b from-[#051318] to-[#071c22]" : "bg-[#b6bfc5]"}`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl cursor-pointer hover:scale-105 transition-all ${isDarkMode ? "bg-cyan-600 shadow-cyan-600/10" : "bg-[#2b5468] shadow-slate-900/10"}`}
        >
          <MessageSquare size={20} />
        </div>
        <div
          className={`flex flex-col gap-8 ${isDarkMode ? "text-slate-500" : "text-[#4a6375]"}`}
        >
          <Phone
            size={20}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          />
          <Mail
            size={20}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          />
          <Users
            size={20}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          />
          <LayoutDashboard
            size={20}
            className="hover:text-cyan-400 transition-colors cursor-pointer"
          />
        </div>
        <Settings
          size={20}
          className={`mt-auto pb-8 hover:text-cyan-400 transition-colors cursor-pointer ${isDarkMode ? "text-slate-500" : "text-[#4a6375]"}`}
        />
      </div>

      {/* Main Center Container */}
      <div
        className={`flex-1 flex overflow-hidden m-1 md:m-2 rounded-[20px] md:rounded-[30px] shadow-2xl border transition-all duration-500 relative ${isDarkMode ? "bg-[#0a1e26] border-white/5" : "bg-[#e2e8f0]/80 backdrop-blur-3xl border-white/40"}`}
      >
        {/* 2. Messages List - gradient panel (full-width on mobile, hidden when chat active) */}
        <div
          className={`${activeChatUser ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[380px] border-r flex-col shrink-0 ${isDarkMode ? "border-white/5" : "bg-transparent border-white/20"}`}
          style={
            isDarkMode
              ? {
                  background:
                    "linear-gradient(180deg, #081920 0%, #0a1e26 100%)",
                }
              : {}
          }
        >
          <div className="p-4 md:p-6 lg:p-10 flex flex-col h-full overflow-hidden">
            <div className="mb-8">
              <h1
                className={`text-xl md:text-2xl lg:text-3xl font-bold tracking-tight mb-1 font-serif italic ${isDarkMode ? "text-cyan-400" : "text-[#2b5468]"}`}
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Artistic Whispers
              </h1>
              <p
                className={`text-[9px] font-black tracking-[0.4em] uppercase ${isDarkMode ? "text-white opacity-60" : "text-[#ffffff] drop-shadow-sm"}`}
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Your Prophecies
              </p>
            </div>
            <div className={`relative mb-6`}>
              <Search
                className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-white/20" : "text-slate-400"}`}
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full border-none rounded-[20px] py-3 pl-12 pr-4 font-medium text-xs ${isDarkMode ? "bg-white/5 text-white placeholder:text-white/10" : "bg-white/60 text-slate-800"}`}
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-8">
              <SectionTitle
                title="DIVINE GUARDIAN"
                expanded={expandedSections.bot}
                onToggle={() => toggleSection("bot")}
                colorClass={
                  isDarkMode ? "text-cyan-500/60" : "text-[#2b5468]/60"
                }
                icon={<PlusCircle size={12} className="animate-spin-slow" />}
              />
              <AnimatePresence>
                {expandedSections.bot && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {sections.bot.map((c) => (
                      <ContactCard
                        key={c.userId}
                        contact={c}
                        activeAt={activeChatUser?.id === c.userId}
                        onClick={() =>
                          setActiveChatUser({
                            id: c.userId,
                            name: c.name,
                            avatar: c.avatar,
                            role: c.role,
                          })
                        }
                        isDarkMode={isDarkMode}
                        isBot
                        isOnline={true}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <SectionTitle
                title="HIGH COUNCIL"
                expanded={expandedSections.reports}
                onToggle={() => toggleSection("reports")}
                colorClass={isDarkMode ? "text-red-400/60" : "text-red-600/60"}
                icon={<ShieldAlert size={12} />}
              />
              <AnimatePresence>
                {expandedSections.reports && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {sections.reports.map((c) => (
                      <ContactCard
                        key={c.userId}
                        contact={c}
                        activeAt={activeChatUser?.id === c.userId}
                        onClick={() =>
                          setActiveChatUser({
                            id: c.userId,
                            name: c.name,
                            avatar: c.avatar,
                            role: c.role,
                          })
                        }
                        isDarkMode={isDarkMode}
                        isOnline={onlineUsers.has(c.userId)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <SectionTitle
                title={`CONVERSATIONS (${sections.open.length})`}
                expanded={expandedSections.open}
                onToggle={() => toggleSection("open")}
                colorClass={isDarkMode ? "text-white/20" : "text-slate-400"}
              />
              <AnimatePresence>
                {expandedSections.open && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {sections.open.map((c) => (
                      <ContactCard
                        key={c.userId}
                        contact={c}
                        activeAt={activeChatUser?.id === c.userId}
                        onClick={() =>
                          setActiveChatUser({
                            id: c.userId,
                            name: c.name,
                            avatar: c.avatar,
                            role: c.role,
                          })
                        }
                        isDarkMode={isDarkMode}
                        isOnline={onlineUsers.has(c.userId)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 3. Main Chat View (full-width on mobile, hidden when no active chat) */}
        <div
          className={`${activeChatUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative ${isDarkMode ? "bg-[#0c2530]" : "bg-white/40"}`}
        >
          {activeChatUser ? (
            <>
              {/* Chat Header */}
              <div
                className={`h-20 md:h-24 flex items-center justify-between px-4 md:px-8 border-b z-30 ${isDarkMode ? "bg-[#081920] border-white/5" : "bg-white/40 border-white/20 backdrop-blur-md"}`}
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  {/* Mobile back button */}
                  <button
                    onClick={() => setActiveChatUser(null)}
                    className={`md:hidden p-2 rounded-full shrink-0 ${isDarkMode ? "text-white/40 hover:text-cyan-400" : "text-slate-500 hover:text-[#2b5468]"}`}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="relative shrink-0">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-full p-0.5 border-2 ${isDarkMode ? "border-cyan-500/40" : "border-[#2b5468]/30"} overflow-hidden`}
                    >
                      <img
                        src={
                          activeChatUser.id === "chatbot"
                            ? "https://cdn-icons-png.flaticon.com/512/8943/8943377.png"
                            : activeChatUser.avatar || "/default-avatar.png"
                        }
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    {/* Online indicator */}
                    {(isContactOnline || activeChatUser.id === "chatbot") && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#081920] shadow-lg shadow-emerald-400/50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`font-bold text-[15px] md:text-[18px] leading-tight font-serif italic flex items-center gap-2 truncate ${isDarkMode ? "text-cyan-400" : "text-[#2b5468]"}`}
                    >
                      {activeChatUser.name}
                      {activeChatUser.id === "chatbot" && (
                        <Sparkles
                          size={14}
                          className="text-cyan-400 animate-pulse"
                        />
                      )}
                    </h3>
                    <p
                      className={`text-[10px] font-black tracking-widest uppercase ${isDarkMode ? "text-white/20" : "text-[#2b5468]/30"}`}
                    >
                      {isContactTyping ? (
                        <span className={`${isDarkMode ? "text-cyan-400" : "text-[#2b5468]"} animate-pulse`}>
                          typing...
                        </span>
                      ) : activeChatUser.id === "chatbot" ? (
                        "DIVINE AI INTERFACE"
                      ) : isContactOnline ? (
                        <span className="text-emerald-400">ONLINE</span>
                      ) : (
                        "OFFLINE"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className={`hidden md:block p-3 rounded-full hover:bg-white/5 ${isDarkMode ? "text-white/10 hover:text-cyan-400" : "text-slate-400 hover:text-white/60"}`}
                  >
                    <Info size={20} />
                  </button>
                  <button
                    onClick={() => setActiveChatUser(null)}
                    className={`hidden md:block p-3 rounded-full hover:bg-white/5 ${isDarkMode ? "text-white/10 hover:text-cyan-400" : "text-slate-400 hover:text-white/60"}`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Messages List Area — dot pattern */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-8 space-y-6 md:space-y-10 custom-scrollbar relative"
                style={
                  isDarkMode
                    ? {
                        backgroundImage:
                          "radial-gradient(circle, rgba(6,182,212,0.07) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                        backgroundColor: "#0c2530",
                      }
                    : {}
                }
              >
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user._id;
                  const isBot = msg.senderId === "chatbot";
                  return (
                    <div
                      key={idx}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} group animate-in slide-in-from-bottom-2`}
                    >
                      <div
                        className={`flex gap-3 max-w-[85%] lg:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div className="shrink-0 self-end">
                          <img
                            src={
                              isMe
                                ? user.avatar || "/default-avatar.png"
                                : isBot
                                  ? "https://cdn-icons-png.flaticon.com/512/8943/8943377.png"
                                  : activeChatUser.avatar ||
                                    "/default-avatar.png"
                            }
                            className={`w-8 h-8 rounded-full border border-white/5 object-cover ${isBot ? "bg-cyan-500/10" : ""}`}
                          />
                        </div>
                        <div
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`px-5 py-3 rounded-[22px] text-[14px] font-medium leading-[1.5] shadow-lg transition-all
                                                        ${
                                                          isMe
                                                            ? isDarkMode
                                                              ? "bg-gradient-to-br from-cyan-500 to-cyan-700 text-white rounded-tr-none shadow-cyan-900/40"
                                                              : "bg-gradient-to-br from-[#2b5468] to-[#1a3a4a] text-white rounded-tr-none shadow-slate-400/20"
                                                            : isBot
                                                              ? isDarkMode
                                                                ? "bg-white/5 text-cyan-100 border border-cyan-400/20 rounded-tl-none backdrop-blur-md shadow-cyan-950/30"
                                                                : "bg-[#e2e8f0] text-[#2b5468] rounded-tl-none border border-white/60"
                                                              : isDarkMode
                                                                ? "bg-white/8 backdrop-blur-sm text-slate-100 rounded-tl-none border border-white/5"
                                                                : "bg-white text-slate-700 rounded-tl-none shadow-sm"
                                                        }`}
                          >
                            {msg.type === "image" && msg.attachmentUrl ? (
                              <div className="space-y-2">
                                <img
                                  src={msg.attachmentUrl}
                                  className="max-w-[200px] lg:max-w-[300px] rounded-[15px] cursor-pointer hover:opacity-90"
                                  onClick={() =>
                                    window.open(msg.attachmentUrl, "_blank")
                                  }
                                />
                              </div>
                            ) : msg.type === "file" && msg.attachmentUrl ? (
                              <div
                                className="flex items-center gap-3 p-3 bg-black/10 rounded-xl cursor-pointer hover:bg-black/20"
                                onClick={() =>
                                  window.open(msg.attachmentUrl, "_blank")
                                }
                              >
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                  <FileText size={18} />
                                </div>
                                <span className="text-[12px] font-bold underline truncate max-w-[150px]">
                                  {msg.content}
                                </span>
                              </div>
                            ) : (
                              <span
                                className={isBot ? "italic font-serif" : ""}
                              >
                                {msg.content}
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-1.5 mt-1`}>
                            <span
                              className={`text-[9px] font-bold ${isDarkMode ? "text-white/10" : "text-slate-400"}`}
                            >
                              {new Date(msg.timestamp)
                                .toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                                .toLowerCase()}
                            </span>
                            {/* Read receipts for sent messages */}
                            {isMe && (
                              <span className={`${msg.read ? "text-cyan-400" : isDarkMode ? "text-white/15" : "text-slate-300"}`}>
                                {msg.read ? <CheckCheck size={13} /> : <Check size={13} />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator in chat area */}
                {isContactTyping && (
                  <div className="flex justify-start animate-in slide-in-from-bottom-2">
                    <div className="flex gap-3">
                      <div className="shrink-0 self-end">
                        <img
                          src={
                            activeChatUser.id === "chatbot"
                              ? "https://cdn-icons-png.flaticon.com/512/8943/8943377.png"
                              : activeChatUser.avatar || "/default-avatar.png"
                          }
                          className="w-8 h-8 rounded-full border border-white/5 object-cover"
                        />
                      </div>
                      <div
                        className={`px-5 py-3 rounded-[22px] rounded-tl-none flex items-center gap-1.5 ${
                          isDarkMode
                            ? "bg-white/5 border border-white/5"
                            : "bg-white border border-slate-100"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                      Guardian is receiving your file...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Footer */}
              <div className="px-3 md:px-6 py-3 md:py-4 pb-4 md:pb-8 relative safe-bottom">
                <form
                  onSubmit={handleSend}
                  className={`rounded-[20px] md:rounded-[25px] px-2 md:px-3 py-2 flex items-center gap-1 md:gap-2 transition-all ring-1 ${
                    isDarkMode
                      ? "bg-white/5 ring-cyan-500/10 focus-within:ring-cyan-500/30 focus-within:bg-white/8 backdrop-blur-sm"
                      : "bg-white/60 ring-gray-200 shadow-sm focus-within:ring-teal-400/40"
                  }`}
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className={`p-3 rounded-full transition-all ${isDarkMode ? "text-white/20 hover:text-cyan-400" : "text-slate-400 hover:text-[#2b5468]"}`}
                    >
                      <Paperclip
                        size={20}
                        className={
                          showAttachMenu ? "rotate-45 text-cyan-500" : ""
                        }
                      />
                    </button>
                    <AnimatePresence>
                      {showAttachMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: -10 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`absolute bottom-full left-0 mb-4 rounded-[20px] shadow-2xl border p-2 flex flex-col gap-1 z-50 ${isDarkMode ? "bg-[#141d26] border-white/10" : "bg-white border-slate-100"}`}
                        >
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDarkMode ? "hover:bg-cyan-500/10 text-slate-300" : "hover:bg-slate-50 text-slate-600"}`}
                          >
                            <ImageIcon size={18} className="text-cyan-500" />{" "}
                            <span className="text-xs font-bold">Image</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDarkMode ? "hover:bg-cyan-500/10 text-slate-300" : "hover:bg-slate-50 text-slate-600"}`}
                          >
                            <FileText size={18} className="text-blue-500" />{" "}
                            <span className="text-xs font-bold">Document</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    type="text"
                    value={text}
                    onChange={handleTextChange}
                    onFocus={() => {
                      setShowAttachMenu(false);
                      setShowEmojiPicker(false);
                    }}
                    placeholder={
                      activeChatUser.id === "chatbot"
                        ? "Query the Guardian..."
                        : "Speak your mind..."
                    }
                    className={`flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-medium px-2 ${isDarkMode ? "text-white" : "text-slate-700"}`}
                  />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-3 rounded-full ${isDarkMode ? "text-white/20 hover:text-cyan-400" : "text-slate-400 hover:text-[#2b5468]"}`}
                    >
                      <Smile size={22} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl">
                        <EmojiPicker
                          onEmojiClick={(e) =>
                            setText((prev) => prev + e.emoji)
                          }
                          theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className={`p-4 rounded-[18px] shadow-lg transition-all disabled:opacity-50 ${isDarkMode ? "bg-cyan-600 shadow-cyan-600/20 text-white" : "bg-[#2b5468] text-white shadow-slate-900/20"} hover:scale-105`}
                  >
                    <Send size={20} className="rotate-[-10deg]" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
              <LifeBuoy size={48} className="animate-spin-slow mb-4" />
              <h3 className="text-xl font-serif italic">Artistic Realm</h3>
            </div>
          )}
        </div>

        {/* 4. Profile Sidebar (HIDDEN on mobile) */}
        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 320 }}
              exit={{ width: 0 }}
              className={`hidden lg:flex flex-col p-10 overflow-hidden shrink-0 border-l ${isDarkMode ? "bg-[#081920] border-white/5" : "bg-gradient-to-b from-[#b6bfc5] to-[#f0f2f5] border-white/20"}`}
            >
              <div className="flex flex-col items-center mb-12 w-full">
                <div className="relative">
                  <div
                    className={`w-28 h-28 rounded-full border-4 p-1 overflow-hidden shadow-2xl ${isDarkMode ? "border-cyan-500/20" : "border-white/60"}`}
                  >
                    <img
                      src={
                        activeChatUser?.id === "chatbot"
                          ? "https://cdn-icons-png.flaticon.com/512/8943/8943377.png"
                          : activeChatUser?.avatar || "/default-avatar.png"
                      }
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  {/* Online dot on profile sidebar */}
                  {(isContactOnline || activeChatUser?.id === "chatbot") && (
                    <span className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-400 rounded-full border-3 border-[#081920] shadow-lg shadow-emerald-400/50" />
                  )}
                </div>
                <h2
                  className={`text-xl font-serif italic mt-6 ${isDarkMode ? "text-cyan-400" : "text-[#2b5468]"}`}
                >
                  {activeChatUser?.name}
                </h2>
                <p
                  className={`text-[10px] font-black uppercase mt-2 tracking-widest ${isDarkMode ? "text-white/20" : "text-[#2b5468]/30"}`}
                >
                  {activeChatUser?.role === "bot"
                    ? "DIVINE ENTITY"
                    : activeChatUser?.id === "chatbot"
                      ? "DIVINE ENTITY"
                      : (isContactOnline
                          ? "🟢 ONLINE"
                          : "⚫ OFFLINE"
                        ) + ` · ${activeChatUser?.role?.toUpperCase() || "USER"}`}
                </p>
              </div>
              <div className="space-y-6 w-full">
                {activeChatUser?.id === "chatbot" ? (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                        Capabilities
                      </h4>
                      <p className="text-xs text-white/40 leading-relaxed italic">
                        • Platform Guidance
                        <br />• Order Support
                        <br />• Sacred Translations
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <DetailItem
                      icon={<Globe size={18} />}
                      label="Vantage"
                      value="Oslo, Norway"
                      isDarkMode={isDarkMode}
                    />
                    <DetailItem
                      icon={<Phone size={18} />}
                      label="Oracle"
                      value="+33 1 45 55"
                      isDarkMode={isDarkMode}
                    />
                    <DetailItem
                      icon={<Mail size={18} />}
                      label="Spirit"
                      value="support@art.com"
                      isDarkMode={isDarkMode}
                    />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Internal Components
const SectionTitle = ({ title, expanded, onToggle, colorClass, icon }: any) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between text-[10px] font-black tracking-widest uppercase mb-4 ${colorClass}`}
  >
    <span className="flex items-center gap-2">
      {icon} {title}
    </span>
    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
  </button>
);

const ContactCard = ({
  contact,
  activeAt,
  onClick,
  isDarkMode,
  isBot,
  isOnline,
}: any) => (
  <button
    onClick={onClick}
    className={`w-full p-4 flex items-center gap-4 rounded-[30px] transition-all relative overflow-hidden ${activeAt ? (isDarkMode ? "bg-cyan-600/10 border border-cyan-500/20 shadow-lg shadow-cyan-950/20" : "bg-white shadow-xl border border-white/60") : isDarkMode ? "bg-[#0d2530]/80 border border-transparent hover:bg-white/5" : "bg-white/40 border border-white/20 hover:bg-white shadow-sm"}`}
  >
    <div className="relative">
      <img
        src={
          contact.userId === "chatbot"
            ? "https://cdn-icons-png.flaticon.com/512/8943/8943377.png"
            : contact.avatar || "/default-avatar.png"
        }
        className={`shrink-0 w-12 h-12 rounded-full border transition-all ${isDarkMode ? "border-white/5 bg-[#0a1e26]" : "border-white/60 bg-[#dae4ea] shadow-inner"}`}
      />
      {isBot && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a1e26] rounded-full flex items-center justify-center p-0.5 shadow-lg">
          <Cpu size={10} className="text-cyan-400" />
        </div>
      )}
      {!isBot && isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0a1e26] shadow-sm shadow-emerald-400/50" />
      )}
    </div>
    <div className="flex-1 text-left min-w-0 pr-1">
      <div className="flex justify-between items-baseline mb-1">
        <span
          className={`font-bold text-[15px] truncate font-serif italic ${isDarkMode ? (activeAt ? "text-cyan-400" : "text-slate-300") : "text-[#2b5468]"}`}
        >
          {contact.name}
        </span>
        <span
          className={`text-[8px] font-bold ${isDarkMode ? "text-white/10" : "text-[#2b5468]/20"}`}
        >
          {new Date(contact.lastMessageTime).toLocaleDateString([], {
            month: "numeric",
            day: "numeric",
          })}
        </span>
      </div>
      <p className="text-[12px] truncate font-serif italic text-slate-500">
        {contact.lastMessageContent}
      </p>
    </div>
    {!activeAt && contact.unread > 0 && (
      <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"></div>
    )}
  </button>
);

const DetailItem = ({ icon, label, value, isDarkMode }: any) => (
  <div className="flex items-center gap-4 group">
    <div
      className={`w-10 h-10 rounded-[15px] flex items-center justify-center border transition-all ${isDarkMode ? "bg-white/5 text-white/10 border-white/5 group-hover:text-cyan-400 shadow-inner" : "bg-white/40 text-[#2b5468]/40 border-white/60 group-hover:text-[#2b5468] shadow-sm"}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p
        className={`text-[8px] font-black uppercase mb-0.5 tracking-[0.2em] ${isDarkMode ? "text-white/10" : "text-[#2b5468]/20"}`}
      >
        {label}
      </p>
      <p
        className={`text-[13px] truncate font-serif italic ${isDarkMode ? "text-white/60" : "text-[#2b5468]"}`}
      >
        {value}
      </p>
    </div>
  </div>
);

export default ChatPage;
