import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface ChatUser {
  id: string;
  _id?: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface ChatContextType {
  activeChatUser: ChatUser | null;
  isOpen: boolean;
  openChat: (user: ChatUser) => void;
  closeChat: () => void;
  toggleChat: () => void;
  backToContacts: () => void;
  socket: Socket | null;
  onlineUsers: Set<string>;
  typingUsers: Map<string, boolean>;
  emitTyping: (receiverId: string) => void;
  emitStopTyping: (receiverId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("art_token");
      const apiUrl =
        (import.meta.env.VITE_API_BASE_URL || "").replace("/api", "") ||
        "http://localhost:5005";

      const newSocket = io(apiUrl, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // ─── Online status ──────────────────────────────────────
      newSocket.on("onlineUsers", (users: string[]) => {
        setOnlineUsers(new Set(users));
      });

      newSocket.on("userOnline", ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      });

      newSocket.on("userOffline", ({ userId }: { userId: string }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      // ─── Typing indicators ─────────────────────────────────
      newSocket.on("userTyping", ({ userId }: { userId: string }) => {
        setTypingUsers((prev) => new Map(prev).set(userId, true));

        // Auto-clear after 3s inactivity
        const existing = typingTimeouts.current.get(userId);
        if (existing) clearTimeout(existing);
        typingTimeouts.current.set(
          userId,
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.delete(userId);
              return next;
            });
          }, 3000),
        );
      });

      newSocket.on("userStopTyping", ({ userId }: { userId: string }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
        const existing = typingTimeouts.current.get(userId);
        if (existing) clearTimeout(existing);
      });

      newSocket.on("connect", () => {
        console.log("🟢 Socket connected");
      });

      newSocket.on("disconnect", () => {
        console.log("🔴 Socket disconnected");
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        // Clean typing timeouts
        typingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
        typingTimeouts.current.clear();
      };
    } else {
      setSocket(null);
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
    }
  }, [user?._id]);

  const emitTyping = useCallback(
    (receiverId: string) => {
      socket?.emit("typing", { receiverId });
    },
    [socket],
  );

  const emitStopTyping = useCallback(
    (receiverId: string) => {
      socket?.emit("stopTyping", { receiverId });
    },
    [socket],
  );

  const openChat = useCallback((user: ChatUser) => {
    setActiveChatUser(user);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const backToContacts = useCallback(() => {
    setActiveChatUser(null);
  }, []);

  const contextValue = React.useMemo(() => ({
    activeChatUser,
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    backToContacts,
    socket,
    onlineUsers,
    typingUsers,
    emitTyping,
    emitStopTyping,
  }), [
    activeChatUser,
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    backToContacts,
    socket,
    onlineUsers,
    typingUsers,
    emitTyping,
    emitStopTyping,
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
