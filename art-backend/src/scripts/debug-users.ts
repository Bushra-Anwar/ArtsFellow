import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
import { getDatabase } from "../lib/mongo.js";

async function checkArtists() {
  try {
    const db = await getDatabase();
    const artists = await db
      .collection("users")
      .find({ role: "artist" })
      .toArray();
    console.log("--- FOUND ARTISTS ---");
    console.log(
      JSON.stringify(
        artists.map((a) => ({
          _id: a._id,
          name: a.name,
          email: a.email,
          role: a.role,
          artistStatus: a.artistStatus,
          isArtistVerified: a.isArtistVerified,
        })),
        null,
        2,
      ),
    );

    console.log("\n--- DIAGNOSIS ---");
    const pending = await db
      .collection("users")
      .find({
        role: "artist",
        $or: [
          { artistStatus: "pending" },
          { artistStatus: { $exists: false }, isArtistVerified: { $ne: true } },
        ],
      })
      .toArray();
    console.log("Pending query found:", pending.length, "artists");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkArtists();
