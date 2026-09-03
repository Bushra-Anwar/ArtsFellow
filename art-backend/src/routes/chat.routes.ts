import express from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/mongo.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getIO } from "../socket.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

const router = express.Router();

router.use(verifyToken);

async function getBotResponse(input: string): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return "The Guardian's divine connection to the AI realm is currently resting. Please provide a GEMINI_API_KEY in the environment.";
    }

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    });

    const template = `You are the ArtsFellow Guardian, an AI construct of pure creative energy and the spiritual guide of this art gallery platform. 
Maintain a mystical, helpful, and creative persona. 
Guide users about art, purchasing (prophecies), platform security (divine encryption), and artist registration (High Council approval).
Keep your response concise, friendly, and in character. Do not break character.
User message: {input}`;

    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm);

    const result = await chain.invoke({ input });
    return result.content as string;
  } catch (error) {
    console.error("LangChain Gemini API Error:", error);
    return "The energies of the realm are temporarily clouded. I cannot formulate a response right now. Try again later.";
  }
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
      const botResponseContent = await getBotResponse(content);
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
