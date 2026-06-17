import express from "express";
import {
  getPendingArtists,
  verifyArtist,
  getArtists,
  getDashboardStats,
  getOrders,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/pending-artists", getPendingArtists);
router.get("/artists", getArtists);
router.get("/stats", getDashboardStats);
router.post("/verify-artist", verifyArtist);
router.get("/orders", getOrders);

export default router;
