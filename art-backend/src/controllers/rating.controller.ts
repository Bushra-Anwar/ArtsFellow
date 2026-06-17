import { Request, Response } from "express";
import { Rating } from "../models/Rating.js";

export const rateArtwork = async (req: Request, res: Response) => {
  try {
    const { artworkId, artistId, customerId, rating } = req.body;
    
    if (!artworkId || !artistId || !customerId || !rating) {
      res.status(400).json({ status: "error", message: "Missing required fields" });
      return;
    }

    await Rating.addRating(artworkId, artistId, customerId, rating);
    res.json({ status: "ok", message: "Rating saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to save rating" });
  }
};

export const getCustomerRatings = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const ratings = await Rating.getCustomerRatings(customerId as string);
    res.json({ status: "ok", ratings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to fetch ratings" });
  }
};

export const getArtistRatings = async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const ratings = await Rating.getArtistRatings(artistId as string);
    res.json({ status: "ok", ratings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to fetch ratings" });
  }
};
