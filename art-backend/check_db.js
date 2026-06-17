import { getDatabase } from "./src/lib/mongo.js";
import { MongoClient } from "mongodb";

async function checkArtworks() {
  const db = await getDatabase();
  const artwork = await db.collection("artworks").findOne({});
  console.log("Artwork Structure:", JSON.stringify(artwork, null, 2));
  process.exit(0);
}

checkArtworks();
