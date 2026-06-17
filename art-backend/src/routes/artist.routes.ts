import express from "express";
import {
  getArtists,
  getArtistById,
  getTopArtists,
  createArtwork,
  getArtistArtworks,
  addPortfolioImage,
  deletePortfolioImage,
  deleteArtwork,
  getArtistStats,
  getArtistOrders,
  toggleFollow,
} from "../controllers/artist.controller.js";

const router = express.Router();

// Public artist routes
router.get("/", getArtists); // /api/artists
router.get("/top", getTopArtists); // /api/artists/top
router.get("/:id", getArtistById);
router.get("/:id/artworks", getArtistArtworks);
router.get("/:id/stats", getArtistStats);
router.get("/:id/orders", getArtistOrders);

// Artist protected/action routes
// Note: In a real app we would add authentication middleware here
router.post("/follow", toggleFollow);
router.post("/artworks", createArtwork);
router.post("/portfolio/add", addPortfolioImage);
router.post("/portfolio/delete", deletePortfolioImage);
router.delete("/artworks/:id", deleteArtwork);

export default router;
