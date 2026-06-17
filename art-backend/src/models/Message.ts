import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/mongo.js";

export interface Message {
  _id?: ObjectId;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type?: "text" | "image" | "file";
  attachmentUrl?: string;
}

export class MessageModel {
  static async create(msg: Message) {
    const db = await getDatabase();
    return db.collection("messages").insertOne(msg);
  }

  static async getConversation(userId1: string, userId2: string) {
    const db = await getDatabase();
    return db
      .collection<Message>("messages")
      .find({
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      })
      .sort({ timestamp: 1 })
      .toArray();
  }

  static async getContacts(userId: string) {
    const db = await getDatabase();
    // Aggregation to find unique interlocutors and get the last message
    // This is a simplified version: get all messages involving user, then group by 'other' party
    const pipeline = [
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      // Lookup user details
      {
        $lookup: {
          from: "users",
          let: { userId: "$_id" }, // Local Field (the string ID)
          pipeline: [
            { $addFields: { stringId: { $toString: "$_id" } } },
            { $match: { $expr: { $eq: ["$stringId", "$$userId"] } } },
          ],
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          userId: "$_id",
          name: "$userDetails.name",
          avatar: "$userDetails.avatar",
          role: "$userDetails.role",
          lastMessage: "$lastMessage.content",
          timestamp: "$lastMessage.timestamp",
          read: "$lastMessage.read",
        },
      },
      { $sort: { timestamp: -1 } },
    ];

    return db.collection("messages").aggregate(pipeline).toArray();
  }

  static async markAsRead(conversationWith: string, currentUser: string) {
    const db = await getDatabase();
    return db
      .collection("messages")
      .updateMany(
        { senderId: conversationWith, receiverId: currentUser, read: false },
        { $set: { read: true } },
      );
  }
}
