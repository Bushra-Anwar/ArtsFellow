import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import {
  Send,
  X,
  MessageSquare,
  Image,
  Minimize2,
  ArrowLeft,
  Edit2,
  Trash2,
  Ban,
  Check,
  CheckCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ChatWidget = () => {
  const {
    activeChatUser,
    isOpen,
    closeChat,
    toggleChat,
    backToContacts,
    openChat,
    socket,
    onlineUsers,
    typingUsers,
    emitTyping,
    emitStopTyping,
  } = useChat();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SOCKET EVENT HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: any) => {
      const isChattingWithUser =
        activeChatUser &&
        (message.senderId === activeChatUser.id ||
          message.senderId === activeChatUser._id);
      const isChatWindowVisible = isOpen;
      const isChatPageFocused = location.pathname === "/chat";

      if (
        (isChatWindowVisible && isChattingWithUser) ||
        (isChatPageFocused && isChattingWithUser)
      ) {
        setMessages((prev) => [...prev, message]);
      } else {
        const notifId = Date.now();
        setNotifications((prev) => [...prev, { id: notifId, ...message }]);
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== notifId));
        }, 5000);
      }
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
  }, [activeChatUser, isOpen, socket, location.pathname, user]);

  // Fetch messages (initial load)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user || !activeChatUser) return;
      try {
        const token = localStorage.getItem("art_token");
        const res = await fetch(`/api/chat/history/${activeChatUser.id}`, {
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

    if (isOpen && activeChatUser) {
      fetchMessages();
      // Mark read via socket
      if (activeChatUser.id !== "chatbot") {
        socket?.emit("markRead", { conversationWith: activeChatUser.id });
      }
    }
  }, [isOpen, activeChatUser, user]);

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
    if (isOpen && !activeChatUser && user) {
      fetchContacts();
    }
  }, [isOpen, activeChatUser, user]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SEND MESSAGE — WebSocket first!
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !user || !activeChatUser || !socket) return;

    const content = text;
    setText("");

    // Stop typing
    emitStopTyping(activeChatUser.id);

    if (editingMessage) {
      // Edit via socket
      socket.emit(
        "editMessage",
        {
          messageId: editingMessage._id,
          content,
          receiverId: activeChatUser.id,
        },
        (response: any) => {
          if (response?.status === "ok") {
            setMessages((prev) =>
              prev.map((m) =>
                m._id === editingMessage._id
                  ? { ...m, content, isEdited: true }
                  : m,
              ),
            );
            setEditingMessage(null);
          }
        },
      );
    } else {
      // Send via socket
      socket.emit(
        "sendMessage",
        {
          receiverId: activeChatUser.id,
          content,
          replyTo: replyingTo?._id,
        },
        (response: any) => {
          if (response?.status === "ok") {
            setMessages((prev) => [...prev, response.data]);
            setReplyingTo(null);
            fetchContacts();
          } else {
            console.error("Send failed:", response?.error);
          }
        },
      );
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE MESSAGE — WebSocket!
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleDeleteMessage = (msgId: string, type: "me" | "everyone") => {
    if (!socket || !activeChatUser) return;
    socket.emit(
      "deleteMessage",
      { messageId: msgId, type, receiverId: activeChatUser.id },
      (response: any) => {
        if (response?.status === "ok") {
          if (type === "everyone") {
            setMessages((prev) =>
              prev.map((m) =>
                m._id === msgId
                  ? { ...m, content: "This message was deleted", isDeletedForEveryone: true }
                  : m,
              ),
            );
          } else {
            setMessages((prev) => prev.filter((m) => m._id !== msgId));
          }
        }
      },
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TYPING HANDLER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    if (activeChatUser) {
      emitTyping(activeChatUser.id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(activeChatUser.id);
      }, 2000);
    }
  };

  if (!user) return null;

  const handleContactClick = (contact: any) => {
    openChat({
      id: contact.userId,
      name: contact.name,
      avatar: contact.avatar,
      role: contact.role,
    });
  };

  const isContactTyping =
    activeChatUser && typingUsers.has(activeChatUser.id || "");
  const isContactOnline =
    activeChatUser &&
    (activeChatUser.id === "chatbot" || onlineUsers.has(activeChatUser.id || ""));

  return (
    <div className="font-serif-magic">
      {/* Global Notifications */}
      <div className="fixed bottom-24 right-4 z-[6000] flex flex-col gap-3">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="flex items-center gap-4 bg-[var(--card-bg)] backdrop-blur-xl shadow-xl rounded-2xl p-4 border border-[var(--color-primary)]/30 cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => {
                const contact = contacts.find(
                  (c) => c.userId === notif.senderId,
                );
                if (contact) {
                  openChat({
                    id: contact.userId,
                    name: contact.name,
                    avatar: contact.avatar,
                    role: contact.role,
                  });
                } else {
                  toggleChat();
                }
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== notif.id),
                );
              }}
            >
              <div className="relative flex items-center justify-center w-12 h-12 shrink-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full p-0.5 shadow-lg">
                <div className="bg-[var(--bg-primary)] w-full h-full rounded-full flex items-center justify-center">
                  <MessageSquare
                    size={20}
                    className="text-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[var(--color-primary)] italic">
                  Message Received
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate w-40 italic">
                  {notif.type === "text" ? notif.content : "📷 Shared an image"}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Chat Widget Base (Hidden on /chat) */}
      {location.pathname !== "/chat" && (
        <>
          {!isOpen ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleChat()}
              className="fixed bottom-6 right-6 p-4 rounded-full shadow-xl z-[5000] flex items-center gap-2 bg-[var(--color-primary)] group overflow-hidden border-2 border-white/20"
            >
              <div className="absolute inset-0 bg-white/20 blur-md group-hover:scale-150 transition-transform duration-500"></div>
              <MessageSquare className="w-8 h-8 text-white relative z-10" />
            </motion.button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.9 }}
                className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[580px] max-h-[85vh] bg-[var(--bg-primary)] backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-[var(--color-primary)]/20 flex flex-col overflow-hidden z-[5000]"
              >
                {activeChatUser ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-5 bg-[var(--color-primary)] text-white flex justify-between items-center shadow-lg relative z-10">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={backToContacts}
                          className="hover:bg-white/10 p-2 rounded-full transition-all"
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <div className="relative">
                          {activeChatUser.avatar ? (
                            <img
                              src={activeChatUser.avatar}
                              className="w-10 h-10 rounded-full border-2 border-white/50 object-cover shadow-sm"
                              alt={activeChatUser.name}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg border-2 border-white/20">
                              {activeChatUser.name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          {isContactOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[var(--color-primary)] shadow-sm shadow-emerald-400/50" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">
                            {activeChatUser.name}
                          </h3>
                          <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider">
                            {isContactTyping ? (
                              <span className="animate-pulse">typing...</span>
                            ) : isContactOnline ? (
                              "Online"
                            ) : (
                              "Offline"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleChat()}
                          className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <Minimize2 size={18} />
                        </button>
                        <button
                          onClick={closeChat}
                          className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-white"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div
                      ref={scrollRef}
                      className="flex-1 overflow-y-auto p-5 space-y-4 bg-transparent scroll-smooth custom-scrollbar"
                    >
                      {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] p-8 text-center italic">
                          <MessageSquare
                            size={36}
                            className="opacity-20 mb-4"
                          />
                          <p>Send a message to start the conversation</p>
                        </div>
                      ) : (
                        messages.map((msg, idx) => {
                          const isMe = msg.senderId === user._id;
                          return (
                            <div
                              key={idx}
                              className={`flex relative group ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              {isMe && (
                                <div className="absolute top-0 right-[100%] mr-2 hidden group-hover:flex items-center gap-1 bg-[var(--card-bg)] shadow-lg rounded-xl border border-[var(--border-color)] p-1 z-20">
                                  {msg.type === "text" &&
                                    !msg.isDeletedForEveryone && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMessage(msg);
                                          setText(msg.content);
                                        }}
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-[var(--color-primary)] rounded-lg"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                    )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteMessage(msg._id, "me")
                                    }
                                    className="p-1.5 hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-lg"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteMessage(msg._id, "everyone")
                                    }
                                    className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg"
                                  >
                                    <Ban size={12} />
                                  </button>
                                </div>
                              )}
                              <div
                                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm ${isMe ? "bg-[var(--color-primary)] text-white rounded-br-none" : "bg-[var(--card-bg)] text-[var(--text-main)] rounded-bl-none border border-[var(--border-color)]"}`}
                              >
                                {msg.replyTo && (
                                  <div className="bg-black/10 dark:bg-white/10 rounded-lg p-2 mb-2 text-[10px] border-l-2 border-[var(--color-primary)] opacity-80">
                                    <p className="truncate">
                                      "
                                      {messages.find(
                                        (m) => m._id === msg.replyTo,
                                      )?.content || "Message deleted"}
                                      "
                                    </p>
                                  </div>
                                )}
                                <p
                                  className={
                                    msg.isDeletedForEveryone
                                      ? "opacity-50 italic"
                                      : ""
                                  }
                                >
                                  {msg.content}
                                  {msg.isEdited && (
                                    <span className="text-[10px] ml-2 opacity-50">
                                      (edited)
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-1 mt-1 justify-end">
                                  <p
                                    className={`text-[9px] ${isMe ? "text-white/60" : "text-[var(--text-muted)]"}`}
                                  >
                                    {new Date(msg.timestamp).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </p>
                                  {isMe && (
                                    <span className={`${msg.read ? "text-emerald-300" : "text-white/40"}`}>
                                      {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Typing indicator */}
                      {isContactTyping && (
                        <div className="flex justify-start">
                          <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-[var(--card-bg)] border border-[var(--border-color)] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <form
                      onSubmit={handleSend}
                      className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex flex-col gap-2"
                    >
                      {editingMessage && (
                        <div className="flex items-center justify-between bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl px-4 py-2 text-xs font-bold border border-[var(--color-primary)]/20">
                          <span>Editing message...</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMessage(null);
                              setText("");
                            }}
                            className="p-1 hover:bg-black/5 rounded-full"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      {replyingTo && (
                        <div className="flex items-center justify-between bg-[var(--bg-secondary)] text-[var(--text-main)] rounded-xl px-4 py-2 text-xs">
                          <span className="truncate">
                            Replying to: "{replyingTo.content}"
                          </span>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="p-1 hover:bg-black/5 rounded-full"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          className="p-2 text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                        >
                          <Image size={20} />
                        </button>
                        <input
                          type="text"
                          value={text}
                          onChange={handleTextChange}
                          placeholder="Type a message..."
                          className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-main)] text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] border border-[var(--border-color)]"
                        />
                        <button
                          type="submit"
                          disabled={!text.trim()}
                          className="p-3 bg-[var(--color-primary)] text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  // Contacts List View
                  <div className="flex flex-col h-full">
                    <div className="p-6 bg-[var(--bg-primary)] border-b border-[var(--border-color)] flex justify-between items-center">
                      <h3 className="font-bold text-xl text-[var(--text-main)]">
                        Messages
                      </h3>
                      <button
                        onClick={closeChat}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                      {contacts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-center p-8 opacity-50">
                          <MessageSquare size={48} className="mb-4" />
                          <p>No messages yet</p>
                        </div>
                      ) : (
                        contacts.map((contact: any) => {
                          const contactOnline =
                            contact.userId === "chatbot" ||
                            onlineUsers.has(contact.userId);
                          return (
                            <button
                              key={contact.userId}
                              onClick={() => handleContactClick(contact)}
                              className="w-full p-3 flex items-center gap-4 rounded-2xl hover:bg-[var(--bg-secondary)] transition-all text-left group"
                            >
                              <div className="relative">
                                {contact.avatar ? (
                                  <img
                                    src={contact.avatar}
                                    className="w-12 h-12 rounded-full object-cover border border-[var(--border-color)]"
                                    alt={contact.name}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center font-bold text-[var(--text-muted)] text-lg">
                                    {contact.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                )}
                                {contactOnline && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-[var(--bg-primary)] shadow-sm shadow-emerald-400/50" />
                                )}
                                {contact.unread > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-[var(--bg-primary)] font-bold">
                                    {contact.unread}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                  <span className="font-bold truncate text-[var(--text-main)]">
                                    {contact.name}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    {new Date(
                                      contact.lastMessageTime,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs truncate ${contact.unread > 0 ? "font-bold text-[var(--color-primary)]" : "text-[var(--text-muted)]"}`}
                                >
                                  {contact.lastMessageContent}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  );
};

export default ChatWidget;
