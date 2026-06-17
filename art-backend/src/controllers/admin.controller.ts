import { getDatabase } from "../lib/mongo.js";
import { Request, Response } from "express";
import { User } from "../models/User.js";
import {
  sendArtistApprovedEmail,
  sendArtistRejectedEmail,
} from "../lib/email.js";

export const getPendingArtists = async (req: Request, res: Response) => {
  try {
    const pendingArtists = await User.findPendingArtists();
    res.json({ status: "ok", artists: pendingArtists });
  } catch (error) {
    console.error("Error fetching pending artists:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch pending artists" });
  }
};

export const getArtists = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as any;
    const artists = await User.findAllArtistsOfStatus(status);
    res.json({ status: "ok", artists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch artists" });
  }
};

import { OrderModel } from "../models/Order.js";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalRevenue = await OrderModel.getTotalRevenue();
    const totalArtists = await User.countArtists();
    const pendingArtists = await User.findPendingArtists();
    const totalSales = await OrderModel.getTotalSales();

    res.json({
      status: "ok",
      stats: {
        totalRevenue,
        totalArtists,
        pendingArtists: pendingArtists.length,
        totalSales,
      },
    });
  } catch (e) {
    console.error("Error fetching dashboard stats:", e);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch dashboard stats" });
  }
};

export const verifyArtist = async (req: Request, res: Response) => {
  try {
    const { artistId, action } = req.body; // action: 'approve' | 'reject'
    if (!artistId || !action) {
      res
        .status(400)
        .json({ status: "error", message: "Artist ID and Action required" });
      return;
    }

    const user = await User.findById(artistId);
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    if (action === "approve" || action === "enable") {
      await User.update(artistId, {
        isArtistVerified: true,
        artistStatus: "approved",
      });
      if (user.email && action === "approve")
        await sendArtistApprovedEmail(user.email, user.name);
    } else if (action === "reject") {
      await User.update(artistId, {
        isArtistVerified: false,
        artistStatus: "rejected",
        rejectionDate: new Date(),
      });
      if (user.email) await sendArtistRejectedEmail(user.email, user.name);
    } else if (action === "disable") {
      await User.update(artistId, {
        isArtistVerified: false,
        artistStatus: "disabled",
      });
      // Optional: send email for disabled state
    }

    res.json({ status: "ok", message: `Artist ${action}d successfully` });
  } catch (error) {
    console.error("Error verifying artist:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to verifying artist" });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    // Sorting by newest first
    const orders = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ status: "ok", orders });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    res
      .status(500)
      .json({
        status: "error",
        message: "Failed to fetch customer activities",
      });
  }
};
