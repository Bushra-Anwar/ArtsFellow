import express from "express";
import {
  getAllArtworks,
  getArtworksByIds,
  incrementDownload,
  searchArtworks,
  getTopRatedArt,
  getLatestArt,
  visionSearch
} from "../controllers/artwork.controller.js";

const router = express.Router();

router.get("/", getAllArtworks); // /api/artworks
router.get("/search", searchArtworks); // /api/artworks/search
router.get("/top-rated", getTopRatedArt); // /api/artworks/top-rated
router.get("/latest", getLatestArt); // /api/artworks/latest
router.post("/batch", getArtworksByIds); // /api/artworks/batch
router.post("/:id/download", incrementDownload); // /api/artworks/:id/download
router.post("/vision-search", visionSearch); // /api/artworks/vision-search

export default router;
