import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/mongo.js";

export interface OrderItem {
  artworkId: string;
  title: string;
  artistId: string; // To query orders by artist
  price: number;
  quantity: number;
  image: string;
  variantId?: string;
  variantLabel?: string;
}

export interface Order {
  _id?: ObjectId;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    zip: string;
    country: string;
  };
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderModel {
  static async create(orderData: Order) {
    const db = await getDatabase();
    const result = await db.collection("orders").insertOne({
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { ...orderData, _id: result.insertedId };
  }

  static async findByArtistId(artistId: string) {
    const db = await getDatabase();
    // Find orders where ANY item has this artistId
    return db
      .collection("orders")
      .find({ "items.artistId": artistId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async findByUserId(userId: string) {
    const db = await getDatabase();
    return db
      .collection("orders")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  static async getTotalRevenue() {
    const db = await getDatabase();
    const result = await db
      .collection("orders")
      .aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }])
      .toArray();
    return result.length > 0 ? result[0].total : 0;
  }

  static async getTotalSales() {
    const db = await getDatabase();
    return db.collection("orders").countDocuments({});
  }

  static async updateStatus(id: string, status: string) {
    const db = await getDatabase();
    return db
      .collection("orders")
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, updatedAt: new Date() } },
      );
  }

  // Identify which items belong to the artist in a mixed order is handled in controller usually,
  // but the DB query returns the whole order.
}
