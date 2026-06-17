import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/mongo.js";

export class User {
  static async findByEmail(email: string) {
    const db = await getDatabase();
    return db
      .collection("users")
      .findOne({ email: email.trim().toLowerCase() });
  }

  static async findById(id: string) {
    const db = await getDatabase();
    return db.collection("users").findOne({ _id: new ObjectId(id) });
  }

  static async create(userData: any) {
    const db = await getDatabase();
    const result = await db.collection("users").insertOne(userData);
    return { ...userData, _id: result.insertedId };
  }

  static async update(id: string | ObjectId, updates: any) {
    const db = await getDatabase();
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return db.collection("users").updateOne({ _id }, { $set: updates });
  }

  static async delete(id: string | ObjectId) {
    const db = await getDatabase();
    const _id = typeof id === "string" ? new ObjectId(id) : id;
    return db.collection("users").deleteOne({ _id });
  }

  static async updateByEmail(email: string, updates: any) {
    const db = await getDatabase();
    return db
      .collection("users")
      .updateOne({ email: email.trim().toLowerCase() }, { $set: updates });
  }

  static async findAllArtistsOfStatus(
    status?: "approved" | "pending" | "rejected" | "disabled" | "all",
  ) {
    const db = await getDatabase();
    const query: any = {};

    if (status === "approved") {
      query.$or = [{ artistStatus: "approved" }, { isArtistVerified: true }];
    } else if (status === "pending") {
      query.role = "artist";
      query.$or = [
        { artistStatus: "pending" },
        { artistStatus: { $exists: false }, isArtistVerified: { $ne: true } },
      ];
    } else if (status === "rejected") {
      query.artistStatus = "rejected";
    } else if (status === "disabled") {
      query.artistStatus = "disabled";
    } else {
      // All 'artists', including verified ones (even if role mismatch) and pending ones
      query.$or = [{ role: "artist" }, { isArtistVerified: true }];
    }

    return db.collection("users").find(query).toArray();
  }

  static async findPendingArtists() {
    const db = await getDatabase();
    return db
      .collection("users")
      .find({
        role: "artist",
        $or: [
          { artistStatus: "pending" },
          { artistStatus: { $exists: false }, isArtistVerified: { $ne: true } },
        ],
      })
      .toArray();
  }

  static async findAllVerifiedArtists() {
    const db = await getDatabase();
    return db
      .collection("users")
      .aggregate([
        {
          $match: {
            role: "artist",
            $or: [{ artistStatus: "approved" }, { isArtistVerified: true }],
          },
        },
        {
          $lookup: {
            from: "orders",
            let: { artistId: { $toString: "$_id" } },
            pipeline: [
              { $match: { status: { $ne: "cancelled" } } },
              { $unwind: "$items" },
              { $match: { $expr: { $eq: ["$items.artistId", "$$artistId"] } } },
              {
                $group: {
                  _id: null,
                  sales: { $sum: "$items.quantity" },
                  revenue: {
                    $sum: { $multiply: ["$items.price", "$items.quantity"] },
                  },
                },
              },
            ],
            as: "stats",
          },
        },
        {
          $addFields: {
            totalSales: { $ifNull: [{ $arrayElemAt: ["$stats.sales", 0] }, 0] },
            totalRevenue: {
              $ifNull: [{ $arrayElemAt: ["$stats.revenue", 0] }, 0],
            },
          },
        },
        { $project: { stats: 0 } },
      ])
      .toArray();
  }

  static async findTopArtists(limit: number = 5) {
    const db = await getDatabase();
    return db
      .collection("users")
      .aggregate([
        {
          $match: {
            role: "artist",
            $or: [{ artistStatus: "approved" }, { isArtistVerified: true }],
          },
        },
        {
          $lookup: {
            from: "orders",
            let: { artistId: { $toString: "$_id" } },
            pipeline: [
              { $match: { status: { $ne: "cancelled" } } },
              { $unwind: "$items" },
              { $match: { $expr: { $eq: ["$items.artistId", "$$artistId"] } } },
              {
                $group: {
                  _id: null,
                  sales: { $sum: "$items.quantity" },
                  revenue: {
                    $sum: { $multiply: ["$items.price", "$items.quantity"] },
                  },
                },
              },
            ],
            as: "stats",
          },
        },
        {
          $addFields: {
            totalSales: { $ifNull: [{ $arrayElemAt: ["$stats.sales", 0] }, 0] },
            totalRevenue: {
              $ifNull: [{ $arrayElemAt: ["$stats.revenue", 0] }, 0],
            },
          },
        },
        {
          $sort: {
            totalSales: -1,
            totalRevenue: -1,
            "followers.length": -1,
            ratings: -1,
          },
        },
        { $limit: limit },
        { $project: { stats: 0 } },
      ])
      .toArray();
  }

  static async countUsers() {
    const db = await getDatabase();
    return db.collection("users").countDocuments({});
  }

  static async countArtists() {
    const db = await getDatabase();
    return db.collection("users").countDocuments({ role: "artist" });
  }

  static async addPortfolioImage(email: string, imageUrl: string) {
    const db = await getDatabase();
    return db
      .collection("users")
      .updateOne({ email: email.trim().toLowerCase() }, {
        $push: { portfolio: imageUrl },
      } as any);
  }

  static async removePortfolioImage(email: string, imageUrl: string) {
    const db = await getDatabase();
    return db
      .collection("users")
      .updateOne({ email: email.trim().toLowerCase() }, {
        $pull: { portfolio: imageUrl },
      } as any);
  }
  static async addToWishlist(email: string, artId: string) {
    const db = await getDatabase();
    return db
      .collection("users")
      .updateOne({ email: email.trim().toLowerCase() }, {
        $addToSet: { wishlist: artId },
      } as any);
  }

  static async removeFromWishlist(email: string, artId: string) {
    const db = await getDatabase();
    return db
      .collection("users")
      .updateOne({ email: email.trim().toLowerCase() }, {
        $pull: { wishlist: artId },
      } as any);
  }

  static async followUser(followerId: string, targetuserId: string) {
    const db = await getDatabase();
    const fId = new ObjectId(followerId);
    const tId = new ObjectId(targetuserId);

    // Add target to follower's 'following' list
    await db
      .collection("users")
      .updateOne({ _id: fId }, {
        $addToSet: { following: targetuserId },
      } as any);

    // Add follower to target's 'followers' list
    await db
      .collection("users")
      .updateOne({ _id: tId }, { $addToSet: { followers: followerId } } as any);
  }

  static async unfollowUser(followerId: string, targetuserId: string) {
    const db = await getDatabase();
    const fId = new ObjectId(followerId);
    const tId = new ObjectId(targetuserId);

    // Remove target from follower's 'following' list
    await db
      .collection("users")
      .updateOne({ _id: fId }, { $pull: { following: targetuserId } } as any);

    // Remove follower from target's 'followers' list
    await db
      .collection("users")
      .updateOne({ _id: tId }, { $pull: { followers: followerId } } as any);
  }
}
