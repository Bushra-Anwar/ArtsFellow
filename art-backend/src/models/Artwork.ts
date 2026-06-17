import { ObjectId } from "mongodb";
import { getDatabase } from "../lib/mongo.js";

export class Artwork {
  static async create(artworkData: any) {
    const db = await getDatabase();
    // Default stock to 1 if not provided
    const doc = { ...artworkData, stock: artworkData.stock !== undefined ? artworkData.stock : 1 };
    const result = await db.collection("artworks").insertOne(doc);
    return { ...doc, _id: result.insertedId };
  }

  static async findByArtistId(artistId: string) {
    const db = await getDatabase();
    return db.collection("artworks").find({ artistId }).toArray();
  }

  static async findAll() {
    const db = await getDatabase();
    // return db.collection('artworks').find({}).toArray()
    return db
      .collection("artworks")
      .aggregate([
        {
          $addFields: {
            artistObjectId: { $toObjectId: "$artistId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "artistObjectId",
            foreignField: "_id",
            as: "artist",
          },
        },
        {
          $unwind: {
            path: "$artist",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { "artist.artistStatus": "approved" },
              {
                "artist.isArtistVerified": true,
                "artist.artistStatus": { $exists: false },
              },
            ],
          },
        },
        {
          $addFields: {
            artistName: "$artist.name",
            artistBrandName: "$artist.brandName",
          },
        },
        {
          $project: {
            artist: 0,
            artistObjectId: 0,
          },
        },
      ])
      .toArray();
  }

  static async findByIds(ids: string[]) {
    const db = await getDatabase();
    const objectIds = ids
      .map((id) => {
        try {
          return new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter((id) => id !== null) as ObjectId[];

    if (objectIds.length === 0) return [];

    // return db.collection('artworks').find({ _id: { $in: objectIds } }).toArray()
    return db
      .collection("artworks")
      .aggregate([
        {
          $match: {
            _id: { $in: objectIds },
          },
        },
        {
          $addFields: {
            artistObjectId: { $toObjectId: "$artistId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "artistObjectId",
            foreignField: "_id",
            as: "artist",
          },
        },
        {
          $unwind: {
            path: "$artist",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { "artist.artistStatus": "approved" },
              {
                "artist.isArtistVerified": true,
                "artist.artistStatus": { $exists: false },
              },
            ],
          },
        },
        {
          $addFields: {
            artistName: "$artist.name",
            artistBrandName: "$artist.brandName",
          },
        },
        {
          $project: {
            artist: 0,
            artistObjectId: 0,
          },
        },
      ])
      .toArray();
  }

  static async delete(id: string) {
    const db = await getDatabase();
    return db.collection("artworks").deleteOne({ _id: new ObjectId(id) });
  }

  static async incrementDownload(id: string) {
    const db = await getDatabase();
    return db.collection("artworks").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { downloads: 1 } },
      { returnDocument: 'after' }
    );
  }

  static async reduceStock(id: string, quantity: number = 1) {
    const db = await getDatabase();
    return db.collection("artworks").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { stock: -quantity } }
    );
  }

  static async search(query: string) {
    const db = await getDatabase();
    const regex = new RegExp(query, "i");
    return db
      .collection("artworks")
      .aggregate([
        {
          $addFields: {
            artistObjectId: { $toObjectId: "$artistId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "artistObjectId",
            foreignField: "_id",
            as: "artist",
          },
        },
        {
          $unwind: {
            path: "$artist",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $and: [
              {
                $or: [
                  { "artist.artistStatus": "approved" },
                  { "artist.isArtistVerified": true, "artist.artistStatus": { $exists: false } },
                ]
              },
              {
                $or: [
                  { title: regex },
                  { category: regex },
                  { description: regex },
                  { "artist.name": regex },
                  { "artist.brandName": regex },
                ],
              }
            ]
          },
        },
        {
          $addFields: {
            artistName: "$artist.name",
            artistBrandName: "$artist.brandName",
          },
        },
        {
          $project: {
            artist: 0,
            artistObjectId: 0,
          },
        },
      ])
      .toArray();
  }

  static async getTopRated(limit: number = 10) {
    const db = await getDatabase();
    return db
      .collection("artworks")
      .aggregate([
        {
          $addFields: {
            artistObjectId: { $toObjectId: "$artistId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "artistObjectId",
            foreignField: "_id",
            as: "artist",
          },
        },
        {
          $unwind: {
            path: "$artist",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            artistName: "$artist.name",
            artistBrandName: "$artist.brandName",
          },
        },
        {
          $sort: { rating: -1, downloads: -1 },
        },
        { $limit: limit },
        {
          $project: {
            artist: 0,
            artistObjectId: 0,
          },
        },
      ])
      .toArray();
  }

  static async getLatest(limit: number = 12) {
    const db = await getDatabase();
    return db
      .collection("artworks")
      .aggregate([
        {
          $addFields: {
            artistObjectId: { $toObjectId: "$artistId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "artistObjectId",
            foreignField: "_id",
            as: "artist",
          },
        },
        {
          $unwind: {
            path: "$artist",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            artistName: "$artist.name",
            artistBrandName: "$artist.brandName",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        { $limit: limit },
        {
          $project: {
            artist: 0,
            artistObjectId: 0,
          },
        },
      ])
      .toArray();
  }
}
