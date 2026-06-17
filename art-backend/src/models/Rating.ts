import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/mongo.js";

export class Rating {
  static async addRating(artworkId: string, artistId: string, customerId: string, rating: number) {
    const db = await getDatabase();
    
    // UPSERT
    const existing = await db.collection("ratings").findOne({
      artworkId,
      customerId,
    });
    
    if (existing) {
      await db.collection("ratings").updateOne(
        { _id: existing._id },
        { $set: { rating, updatedAt: new Date() } }
      );
    } else {
      await db.collection("ratings").insertOne({
        artworkId,
        artistId,
        customerId,
        rating,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update Artist Average Rating
    await this.updateArtistAverage(artistId);
  }

  static async updateArtistAverage(artistId: string) {
    const db = await getDatabase();
    const result = await db.collection("ratings").aggregate([
      { $match: { artistId } },
      { $group: { _id: "$artistId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]).toArray();
    
    if (result.length > 0) {
      try {
        await db.collection("users").updateOne(
          { _id: new ObjectId(artistId) },
          { $set: { rating: { average: result[0].avgRating, count: result[0].count } } }
        );
      } catch (e) {
        // artistId might be string but not objectId in some bad data cases
      }
    }
  }

  static async getCustomerRatings(customerId: string) {
    const db = await getDatabase();
    return db.collection("ratings").aggregate([
      { $match: { customerId } },
      { $addFields: { artworkObjectId: { $toObjectId: "$artworkId" } } },
      { $lookup: { from: "artworks", localField: "artworkObjectId", foreignField: "_id", as: "artwork" } },
      { $unwind: { path: "$artwork", preserveNullAndEmptyArrays: true } },
      { $addFields: { artistObjectId: { $toObjectId: "$artistId" } } },
      { $lookup: { from: "users", localField: "artistObjectId", foreignField: "_id", as: "artist" } },
      { $unwind: { path: "$artist", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          artworkId: 1,
          artworkName: "$artwork.title",
          artistName: { $ifNull: ["$artist.brandName", "$artist.name"] },
          imageUrl: { $arrayElemAt: ["$artwork.images", 0] },
          rating: 1,
          date: "$updatedAt"
        }
      }
    ]).toArray();
  }

  static async getArtistRatings(artistId: string) {
    const db = await getDatabase();
    return db.collection("ratings").aggregate([
      { $match: { artistId } },
      { $addFields: { artworkObjectId: { $toObjectId: "$artworkId" } } },
      { $lookup: { from: "artworks", localField: "artworkObjectId", foreignField: "_id", as: "artwork" } },
      { $unwind: { path: "$artwork", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          artworkName: "$artwork.title",
          artistName: "You",
          rating: 1,
          date: "$updatedAt"
        }
      }
    ]).toArray();
  }
}
