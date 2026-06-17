import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "art";

async function setupIndexes() {
  if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    
    console.log("Setting up database indexes for performance...");
    
    await db.collection("users").createIndex({ role: 1 });
    await db.collection("users").createIndex({ email: 1 });
    await db.collection("artworks").createIndex({ artistId: 1 });
    await db.collection("artworks").createIndex({ createdAt: -1 });
    await db.collection("orders").createIndex({ "items.artistId": 1 });
    await db.collection("orders").createIndex({ status: 1 });
    
    console.log("Indexes successfully created!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to setup indexes", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setupIndexes();
