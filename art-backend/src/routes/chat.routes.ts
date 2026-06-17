import express from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/mongo.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getIO } from "../socket.js";

const router = express.Router();

router.use(verifyToken);

// Enhanced Bot Response Utility
function getBotResponse(input: string): string {
  const text = input.toLowerCase();

  // Greetings
  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey") ||
    text.includes("namaste")
  ) {
    return "Greetings, creative soul! I am the ArtsFellow Guardian, your spiritual guide through this realm of masterpieces. What knowledge do you seek today?";
  }

  // Platform & Art
  if (
    text.includes("art") ||
    text.includes("work") ||
    text.includes("explore") ||
    text.includes("gallery")
  ) {
    return "Our sacred gallery is filled with visions from the most talented souls. Visit the 'Explore' section to discover masterpieces that speak to your spirit. Do any particular styles call to you?";
  }

  // Orders & Purchasing
  if (
    text.includes("order") ||
    text.includes("buy") ||
    text.includes("purchase") ||
    text.includes("price")
  ) {
    return "To acquire an artwork (a 'Prophecy'), navigate to its unique page and select 'Buy Now'. Your contribution supports the artist directly and helps our community flourish.";
  }

  // Payments & Security
  if (
    text.includes("payment") ||
    text.includes("pay") ||
    text.includes("secure") ||
    text.includes("money")
  ) {
    return "Fear not, traveler! All transactions within ArtsFellow are protected by divine encryption (Secure SSL). Your spiritual and financial data remain strictly under the Guardian's protection.";
  }

  // Reports & Support (The Council)
  if (
    text.includes("report") ||
    text.includes("help") ||
    text.includes("issue") ||
    text.includes("support")
  ) {
    return "If you encounter a shadow across your path (an issue) or wish to speak with the High Council, start a 'Report' chat. This ensures your words reach the Administrators directly for swift resolution.";
  }

  // Artist Registration
  if (
    text.includes("artist") ||
    text.includes("sell") ||
    text.includes("join") ||
    text.includes("become")
  ) {
    return "To join our ranks as a certified Artist, navigate to 'Become an Artist' in your profile settings. Once the High Council approves your vision, you may begin sharing your soul's work with the world.";
  }

  // Identity & Purpose
  if (
    text.includes("who are you") ||
    text.includes("what do you do") ||
    text.includes("bot")
  ) {
    return "I am the ArtsFellow Guardian, an AI construct of pure creative energy. I am here to guide you, answer your inquiries, and ensure the harmony of this platform remains intact.";
  }

  // Gratitude
  if (
    text.includes("thank") ||
    text.includes("thanks") ||
    text.includes("shukriya")
  ) {
    return "The pleasure is mine, creative traveler! May your journey through ArtsFellow be filled with inspiration and light. Is there anything else you wish to know?";
  }

  // Default
  return "Your words carry depth, but the Guardian's translation is currently limited. Try asking me about 'Art Gallery', 'Ordering', 'Security', or 'Joining as an Artist'. How else can I guide you?";
}

// POST /api/chat/send
router.post("/send", async (req: any, res) => {
  try {
    const { receiverId, content, type, attachmentUrl, category } = req.body;
    if (!receiverId || (!content && !attachmentUrl)) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing fields" });
    }

    const senderId = req.user._id.toString();

    const newMessage: any = {
      senderId,
      receiverId,
      content: content || (type === "image" ? "Sent an image" : "Sent a file"),
      timestamp: new Date(),
      read: false,
      type: type || "text",
      attachmentUrl,
      category: category || "general", // 'general', 'report', 'bot'
    };

    const db = await getDatabase();
    const result = await db.collection("messages").insertOne(newMessage);
    newMessage._id = result.insertedId;

    // Emit to receiver via Socket.io
    try {
      const io = getIO();
      io.to(receiverId).emit("receiveMessage", newMessage);
    } catch (e) {
      console.error("Socket emit failed", e);
    }

    // --- Chatbot Logic ---
    if (receiverId === "chatbot") {
      const botResponseContent = getBotResponse(content);
      const botMessage = {
        senderId: "chatbot",
        receiverId: senderId,
        content: botResponseContent,
        timestamp: new Date(),
        read: true, // Bot messages are read-by-default for user? No, but let's say true to not flag unread
        type: "text",
        category: "bot",
      };

      await db.collection("messages").insertOne(botMessage);

      // Emit bot response back to user
      try {
        const io = getIO();
        io.to(senderId).emit("receiveMessage", botMessage);
      } catch (e) {
        console.error("Bot socket emit failed", e);
      }
    }

    res.json({ status: "ok", message: "Message sent", data: newMessage });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: (error as Error).message });
  }
});

// GET /api/chat/history/:userId
router.get("/history/:userId", async (req: any, res) => {
  try {
    const userId = req.user._id.toString();
    const otherUserId = req.params.userId;

    // Fetch conversation
    const db = await getDatabase();
    const messages = await db
      .collection("messages")
      .find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        deletedFor: { $ne: userId },
      })
      .sort({ timestamp: 1 })
      .toArray();

    // Mark incoming messages as read
    await db
      .collection("messages")
      .updateMany(
        { senderId: otherUserId, receiverId: userId, read: false },
        { $set: { read: true } },
      );

    res.json({ status: "ok", messages });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: (error as Error).message });
  }
});

// GET /api/chat/contacts
router.get("/contacts", async (req: any, res) => {
  try {
    const userIdObj = req.user._id;
    const userIdStr = req.user._id.toString();
    const db = await getDatabase();

    // Aggregate to get unique contacts and last message
    const pipeline = [
      {
        $match: {
          $or: [
            { senderId: { $in: [userIdObj, userIdStr] } },
            { receiverId: { $in: [userIdObj, userIdStr] } },
          ],
        },
      },
      {
        $addFields: {
          senderIdStr: { $toString: "$senderId" },
          receiverIdStr: { $toString: "$receiverId" },
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$senderIdStr", userIdStr] },
              then: "$receiverIdStr",
              else: "$senderIdStr",
            },
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userIdStr: "$_id" },
          pipeline: [
            { $addFields: { userIdString: { $toString: "$_id" } } },
            { $match: { $expr: { $eq: ["$userIdString", "$$userIdStr"] } } },
          ],
          as: "userDetails",
        },
      },
      {
        $project: {
          userId: "$_id",
          name: {
            $ifNull: [{ $arrayElemAt: ["$userDetails.name", 0] }, "System Bot"],
          },
          avatar: { $arrayElemAt: ["$userDetails.avatar", 0] },
          role: { $arrayElemAt: ["$userDetails.role", 0] },
          lastMessageContent: "$lastMessage.content",
          lastMessageTime: "$lastMessage.timestamp",
          category: "$lastMessage.category", // Include category for frontend sorting
          unread: {
            $cond: [
              {
                $and: [
                  { $eq: ["$lastMessage.receiverIdStr", userIdStr] },
                  { $eq: ["$lastMessage.read", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ];

    let contacts = await db
      .collection("messages")
      .aggregate(pipeline)
      .toArray();

    // Ensure Chatbot is always present for the user
    const botExists = contacts.some((c) => c.userId === "chatbot");
    if (!botExists) {
      contacts.push({
        userId: "chatbot",
        name: "ArtsFellow Guardian",
        avatar: "https://cdn-icons-png.flaticon.com/512/8943/8943377.png",
        role: "bot",
        lastMessageContent: "Greetings! I am your guide.",
        lastMessageTime: new Date(),
        category: "bot",
        unread: 0,
      });
    }

    // Filter contacts based on Custom Request status (Except for Admin and Bot)
    if (req.user.role !== "admin") {
      const activeRequests = await db
        .collection("custom_requests")
        .find({
          $or: [
            { clientId: req.user._id.toString() },
            { artistId: req.user._id.toString() },
          ],
          status: { $nin: ["delivered", "completed", "rejected", "cancelled"] },
        })
        .toArray();

      const allowedContactIds = new Set<string>();
      activeRequests.forEach((req: any) => {
        if (req.clientId) allowedContactIds.add(req.clientId.toString());
        if (req.artistId) allowedContactIds.add(req.artistId.toString());
      });

      contacts = contacts.filter((c: any) => {
        if (
          c.role === "admin" ||
          c.userId === "chatbot" ||
          c.category === "report"
        )
          return true;
        return allowedContactIds.has(c.userId.toString());
      });
    }

    res.json({ status: "ok", contacts });
  } catch (error) {
    console.error("Contacts error", error);
    res
      .status(500)
      .json({ status: "error", message: (error as Error).message });
  }
});

// DELETE /api/chat/history/:userId
router.delete("/history/:userId", async (req: any, res) => {
  try {
    const userId = req.user._id.toString();
    const otherUserId = req.params.userId;
    const db = await getDatabase();
    await db.collection("messages").deleteMany({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    });
    res.json({ status: "ok", message: "Chat history cleared" });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: (error as Error).message });
  }
});

// PATCH /api/chat/message/:messageId
router.patch("/message/:messageId", async (req: any, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id.toString();
    if (!content)
      return res
        .status(400)
        .json({ status: "error", message: "Content required" });
    const db = await getDatabase();
    const result = await db
      .collection("messages")
      .updateOne(
        { _id: new ObjectId(messageId), senderId: userId },
        { $set: { content, isEdited: true } },
      );
    if (result.matchedCount === 0)
      return res
        .status(404)
        .json({ status: "error", message: "Message not found" });
    res.json({ status: "ok", message: "Message edited" });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: (error as Error).message });
  }
});

// DELETE /api/chat/message/:messageId/:type
router.delete("/message/:messageId/:type", async (req: any, res) => {
  try {
    const { messageId, type } = req.params;
    const userId = req.user._id.toString();
    const db = await getDatabase();
    if (type === "everyone") {
      await db
        .collection("messages")
        .updateOne(
          { _id: new ObjectId(messageId), senderId: userId },
          {
            $set: {
              isDeletedForEveryone: true,
              content: "This message was deleted",
            },
          },
        );
    } else {
      await db
        .collection("messages")
        .updateOne(
          { _id: new ObjectId(messageId) },
          { $addToSet: { deletedFor: userId } },
        );
    }
    res.json({ status: "ok", message: "Message deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: (error as Error).message });
  }
});

export default router;
