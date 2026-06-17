import { Router } from "express";
import { getDatabase } from "../lib/mongo.js";
import { CustomRequest } from "../models/CustomRequest.js";
import { ObjectId } from "mongodb";

const router = Router();

// Create a new request (Client)
router.post("/", async (req, res) => {
  try {
    const db = await getDatabase();
    const requestData: Omit<CustomRequest, "_id"> = {
      ...req.body,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection("custom_requests")
      .insertOne(requestData);
    res.json({ status: "ok", requestId: result.insertedId });
  } catch (error) {
    console.error("Create request error", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to create request" });
  }
});

// Get requests for a specific artist (Artist)
// If artistId is provided (Direct Request) OR if it's an open request (no artistId)
router.get("/artist/:artistId", async (req, res) => {
  try {
    const db = await getDatabase();
    const { artistId } = req.params;

    // Find requests specifically for this artist OR open requests (artistId is null/undefined)
    // For now, let's assume we implement "Direct Requests" first as per user flow description
    const requests = await db
      .collection("custom_requests")
      .find({
        $or: [
          { artistId: artistId },
          { artistId: { $exists: false } },
          { artistId: null },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ status: "ok", requests });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch requests" });
  }
});

// Get requests for a client
router.get("/client/:clientId", async (req, res) => {
  try {
    const db = await getDatabase();
    const { clientId } = req.params;
    const requests = await db
      .collection("custom_requests")
      .find({ clientId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ status: "ok", requests });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch requests" });
  }
});

// Update request status (Artist accepts/rejects)
router.patch("/:id/status", async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const {
      status,
      artistPriceQuote,
      artistEstimatedTime,
      artistNote,
      artistId,
    } = req.body;

    const updateData: any = { status, updatedAt: new Date() };
    if (artistPriceQuote) updateData.artistPriceQuote = artistPriceQuote;
    if (artistEstimatedTime)
      updateData.artistEstimatedTime = artistEstimatedTime;
    if (artistNote) updateData.artistNote = artistNote;
    if (artistId && status === "accepted") updateData.artistId = artistId; // Claim the request if open

    await db
      .collection("custom_requests")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    res.json({ status: "ok" });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to update request" });
  }
});

export default router;
