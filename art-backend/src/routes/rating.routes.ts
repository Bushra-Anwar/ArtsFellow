import express from "express";
import { rateArtwork, getCustomerRatings, getArtistRatings } from "../controllers/rating.controller.js";

const router = express.Router();

router.post("/rate", rateArtwork);
router.get("/customer/:customerId", getCustomerRatings);
router.get("/artist/:artistId", getArtistRatings);

export default router;
