import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { getDatabase } from "./lib/mongo.js";
import { ObjectId } from "mongodb";

let io: Server;

// ─── Online users tracker ──────────────────────────────────────
const onlineUsers = new Map<string, Set<string>>(); // userId → Set<socketId>

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ─── Auth middleware ───────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret",
      );
      (socket as any).user = decoded;
      next();
    } catch (e) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    const userId = user.id || user._id || user.userId;

    console.log(`⚡ Socket connected: ${userId} (${socket.id})`);

    // ── Track online status ──────────────────────────────────
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join personal room
    socket.join(userId);

    // Broadcast online status to everyone
    io.emit("userOnline", { userId });

    // Send current online users list to newly connected user
    const currentOnline = Array.from(onlineUsers.keys());
    socket.emit("onlineUsers", currentOnline);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. SEND MESSAGE (WebSocket-first)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("sendMessage", async (data, callback) => {
      try {
        const { receiverId, content, type, attachmentUrl, category } = data;
        if (!receiverId || (!content && !attachmentUrl)) {
          return callback?.({ error: "Missing fields" });
        }

        const db = await getDatabase();
        const newMessage: any = {
          senderId: userId,
          receiverId,
          content: content || (type === "image" ? "Sent an image" : "Sent a file"),
          timestamp: new Date(),
          read: false,
          type: type || "text",
          attachmentUrl: attachmentUrl || undefined,
          category: category || "general",
        };

        const result = await db.collection("messages").insertOne(newMessage);
        newMessage._id = result.insertedId;

        // Emit to receiver's room
        io.to(receiverId).emit("receiveMessage", newMessage);

        // Confirm back to sender
        callback?.({ status: "ok", data: newMessage });

        // ── Chatbot auto-reply ────────────────────────────────
        if (receiverId === "chatbot") {
          const botReply = getBotResponse(content);
          const botMessage: any = {
            senderId: "chatbot",
            receiverId: userId,
            content: botReply,
            timestamp: new Date(),
            read: true,
            type: "text",
            category: "bot",
          };
          const botResult = await db.collection("messages").insertOne(botMessage);
          botMessage._id = botResult.insertedId;

          // Small delay for natural feel
          setTimeout(() => {
            io.to(userId).emit("receiveMessage", botMessage);
          }, 600);
        }

        // Notify receiver to refresh contacts (for contact list updates)
        io.to(receiverId).emit("contactsUpdated");

      } catch (err: any) {
        console.error("sendMessage error:", err);
        callback?.({ error: err.message });
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. TYPING INDICATORS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("typing", ({ receiverId }) => {
      io.to(receiverId).emit("userTyping", { userId });
    });

    socket.on("stopTyping", ({ receiverId }) => {
      io.to(receiverId).emit("userStopTyping", { userId });
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. READ RECEIPTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("markRead", async ({ conversationWith }) => {
      try {
        const db = await getDatabase();
        await db.collection("messages").updateMany(
          { senderId: conversationWith, receiverId: userId, read: false },
          { $set: { read: true } },
        );
        // Notify the sender that their messages have been read
        io.to(conversationWith).emit("messagesRead", {
          readBy: userId,
          conversationWith: userId,
        });
      } catch (err) {
        console.error("markRead error:", err);
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. EDIT MESSAGE (real-time broadcast)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("editMessage", async ({ messageId, content, receiverId }, callback) => {
      try {
        const db = await getDatabase();
        const result = await db.collection("messages").updateOne(
          { _id: new ObjectId(messageId), senderId: userId },
          { $set: { content, isEdited: true } },
        );
        if (result.matchedCount === 0) {
          return callback?.({ error: "Message not found" });
        }
        // Broadcast edit to the other user
        io.to(receiverId).emit("messageEdited", { messageId, content });
        callback?.({ status: "ok" });
      } catch (err: any) {
        console.error("editMessage error:", err);
        callback?.({ error: err.message });
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. DELETE MESSAGE (real-time broadcast)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("deleteMessage", async ({ messageId, type, receiverId }, callback) => {
      try {
        const db = await getDatabase();
        if (type === "everyone") {
          await db.collection("messages").updateOne(
            { _id: new ObjectId(messageId), senderId: userId },
            { $set: { isDeletedForEveryone: true, content: "This message was deleted" } },
          );
          // Broadcast to the other user
          io.to(receiverId).emit("messageDeleted", { messageId, type: "everyone" });
        } else {
          await db.collection("messages").updateOne(
            { _id: new ObjectId(messageId) },
            { $addToSet: { deletedFor: userId } as any },
          );
        }
        callback?.({ status: "ok" });
      } catch (err: any) {
        console.error("deleteMessage error:", err);
        callback?.({ error: err.message });
      }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // DISCONNECT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${userId} (${socket.id})`);
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          // Broadcast offline status
          io.emit("userOffline", { userId, lastSeen: new Date() });
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
};

// ─── Chatbot helper (unchanged) ───────────────────────────────
function getBotResponse(input: string): string {
  const text = input.toLowerCase();

  if (text.includes("hello") || text.includes("hi") || text.includes("hey") || text.includes("namaste")) {
    return "Greetings, creative soul! I am the ArtsFellow Guardian, your spiritual guide through this realm of masterpieces. What knowledge do you seek today?";
  }
  if (text.includes("art") || text.includes("work") || text.includes("explore") || text.includes("gallery")) {
    return "Our sacred gallery is filled with visions from the most talented souls. Visit the 'Explore' section to discover masterpieces that speak to your spirit. Do any particular styles call to you?";
  }
  if (text.includes("order") || text.includes("buy") || text.includes("purchase") || text.includes("price")) {
    return "To acquire an artwork (a 'Prophecy'), navigate to its unique page and select 'Buy Now'. Your contribution supports the artist directly and helps our community flourish.";
  }
  if (text.includes("payment") || text.includes("pay") || text.includes("secure") || text.includes("money")) {
    return "Fear not, traveler! All transactions within ArtsFellow are protected by divine encryption (Secure SSL). Your spiritual and financial data remain strictly under the Guardian's protection.";
  }
  if (text.includes("report") || text.includes("help") || text.includes("issue") || text.includes("support")) {
    return "If you encounter a shadow across your path (an issue) or wish to speak with the High Council, start a 'Report' chat. This ensures your words reach the Administrators directly for swift resolution.";
  }
  if (text.includes("artist") || text.includes("sell") || text.includes("join") || text.includes("become")) {
    return "To join our ranks as a certified Artist, navigate to 'Become an Artist' in your profile settings. Once the High Council approves your vision, you may begin sharing your soul's work with the world.";
  }
  if (text.includes("who are you") || text.includes("what do you do") || text.includes("bot")) {
    return "I am the ArtsFellow Guardian, an AI construct of pure creative energy. I am here to guide you, answer your inquiries, and ensure the harmony of this platform remains intact.";
  }
  if (text.includes("thank") || text.includes("thanks") || text.includes("shukriya")) {
    return "The pleasure is mine, creative traveler! May your journey through ArtsFellow be filled with inspiration and light. Is there anything else you wish to know?";
  }
  return "Your words carry depth, but the Guardian's translation is currently limited. Try asking me about 'Art Gallery', 'Ordering', 'Security', or 'Joining as an Artist'. How else can I guide you?";
}
