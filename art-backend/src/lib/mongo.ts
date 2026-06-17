import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let mongoClient: MongoClient | null = null;
let database: Db | null = null;

export async function getDatabase(): Promise<Db> {
  if (database && mongoClient) {
    return database;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB ?? "art";

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  database = mongoClient.db(dbName);
  return database;
}

export async function closeDatabase(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    database = null;
  }
}
