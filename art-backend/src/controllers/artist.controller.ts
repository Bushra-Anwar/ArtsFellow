import { Request, Response } from "express";
import { User } from "../models/User.js";
import { Artwork } from "../models/Artwork.js";
import { OrderModel } from "../models/Order.js";
import { getDatabase } from "../lib/mongo.js";

export const getArtists = async (req: Request, res: Response) => {
  try {
    const artists = await User.findAllVerifiedArtists();
    res.json({ status: "ok", artists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch artists" });
  }
};

export const getTopArtists = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const artists = await User.findTopArtists(limit);
    res.json({ status: "ok", artists });
  } catch (error) {
    console.error("Error fetching top artists:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch top artists" });
  }
};

export const getArtistById = async (req: Request, res: Response) => {
  try {
    const artist = await User.findById(req.params.id as string);
    if (!artist) {
      res.status(404).json({ status: "error", message: "Artist not found" });
      return;
    }
    res.json({ status: "ok", artist });
  } catch (error) {
    console.error("Error fetching artist:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch artist" });
  }
};

export const deletePortfolioImage = async (req: Request, res: Response) => {
  try {
    const { email, imageUrl } = req.body;
    if (!email || !imageUrl) {
      res
        .status(400)
        .json({ status: "error", message: "Email and Image URL are required" });
      return;
    }

    await User.removePortfolioImage(email, imageUrl);

    res.json({ status: "ok", message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting portfolio image:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to delete image" });
  }
};

export const addPortfolioImage = async (req: Request, res: Response) => {
  try {
    const { email, imageUrl } = req.body;
    if (!email || !imageUrl) {
      res
        .status(400)
        .json({ status: "error", message: "Email and Image URL are required" });
      return;
    }

    await User.addPortfolioImage(email, imageUrl);

    res.json({ status: "ok", message: "Image added successfully" });
  } catch (error) {
    console.error("Error adding portfolio image:", error);
    res.status(500).json({ status: "error", message: "Failed to add image" });
  }
};

export const createArtwork = async (req: Request, res: Response) => {
  try {
    const { artistId } = req.body;

    const user = await User.findById(artistId);

    if (!user) {
      res.status(404).json({ status: "error", message: "Artist not found" });
      return;
    }

    // if (user.role === 'artist' && !user.isArtistVerified) {
    //     res.status(403).json({ status: 'error', message: 'Your account is pending verification. You cannot publish yet.' })
    //     return
    // }

    const artwork = { ...req.body, createdAt: new Date() };
    const result = await Artwork.create(artwork);
    res.json({ status: "ok", artwork: result });
  } catch (error) {
    console.error("Error creating artwork:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to create artwork" });
  }
};

export const getArtistArtworks = async (req: Request, res: Response) => {
  try {
    const artistId = req.params.id as string;
    const artist = await User.findById(artistId);

    const isApproved =
      artist &&
      (artist.artistStatus === "approved" ||
        (artist.isArtistVerified === true && !artist.artistStatus));

    if (!artist || !isApproved) {
      // Return empty list if artist is not approved/found
      // This hides artworks from the public profile of pending/rejected artists
      res.json({ status: "ok", artworks: [] });
      return;
    }

    const artworks = await Artwork.findByArtistId(artistId);
    res.json({ status: "ok", artworks });
  } catch (error) {
    console.error("Error fetching artist artworks:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch artworks" });
  }
};

export const deleteArtwork = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await Artwork.delete(id);
    res.json({ status: "ok", message: "Artwork deleted successfully" });
  } catch (error) {
    console.error("Error deleting artwork:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to delete artwork" });
  }
};

export const getArtistStats = async (req: Request, res: Response) => {
  try {
    const artistId = req.params.id as string;
    const db = await getDatabase();

    // 1. Total Sales (Earnings from Delivered orders)
    const completedOrders = await db
      .collection("orders")
      .find({
        "items.artistId": artistId,
        status: "delivered",
      })
      .toArray();

    let totalEarnings = 0;
    completedOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        if (item.artistId === artistId) {
          totalEarnings += item.price * item.quantity;
        }
      });
    });

    // 2. Total Artworks
    const totalArtworks = await db
      .collection("artworks")
      .countDocuments({ artistId });

    // 3. Pending Requests
    const pendingRequests = await db
      .collection("custom_requests")
      .countDocuments({
        artistId,
        status: "pending",
      });

    // 4. Avg Rating (Mock for now or implies reviews collection)
    const avgRating = 0;

    // 5. Recent Orders (Last 5)
    const recentOrders = await OrderModel.findByArtistId(artistId);
    const recent5 = recentOrders.slice(0, 5).map((o: any) => {
      // Filter items for this artist only
      const artistItems = o.items.filter((i: any) => i.artistId === artistId);
      const orderTotalForArtist = artistItems.reduce(
        (acc: number, curr: any) => acc + curr.price * curr.quantity,
        0,
      );
      return {
        _id: o._id,
        items: artistItems.map((i: any) => i.title).join(", "),
        total: orderTotalForArtist,
        status: o.status,
        createdAt: o.createdAt,
      };
    });

    // Calculate daily sales for chart (Mon-Sun)
    const last7Days = [0, 0, 0, 0, 0, 0, 0];
    completedOrders.forEach((order: any) => {
      let orderEarnings = 0;
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.artistId === artistId) {
            orderEarnings += item.price * item.quantity;
          }
        });
      }

      if (orderEarnings > 0 && order.createdAt) {
        const date = new Date(order.createdAt);
        const day = date.getDay(); // 0 = Sun, 1 = Mon ...
        // Map to 0=Mon, ... 6=Sun
        const index = day === 0 ? 6 : day - 1;
        last7Days[index] += orderEarnings;
      }
    });

    res.json({
      status: "ok",
      stats: {
        totalEarnings,
        totalArtworks,
        pendingRequests,
        avgRating,
        recentOrders: recent5,
        last7Days,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch stats" });
  }
};

export const getArtistOrders = async (req: Request, res: Response) => {
  try {
    const artistId = req.params.id as string;
    const orders = await OrderModel.findByArtistId(artistId);

    // Clean up orders to only show relevant items
    const artistOrders = orders.map((o: any) => {
      return {
        ...o,
        items: o.items.filter((i: any) => i.artistId === artistId),
      };
    });

    res.json({ status: "ok", orders: artistOrders });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch orders" });
  }
};

export const toggleFollow = async (req: Request, res: Response) => {
  try {
    const { artistId, userId } = req.body; // userId is the follower (current user), artistId is target

    if (!artistId || !userId) {
      res
        .status(400)
        .json({ status: "error", message: "Artist ID and User ID required" });
      return;
    }

    if (artistId === userId) {
      res
        .status(400)
        .json({ status: "error", message: "You cannot follow yourself." });
      return;
    }

    const user = await User.findById(userId);
    const artist = await User.findById(artistId);

    if (!user || !artist) {
      res
        .status(404)
        .json({ status: "error", message: "User or Artist not found" });
      return;
    }

    const following = user.following || [];
    const isFollowing = following.includes(artistId);

    let newFollowingList = [];
    let newFollowersList = [];

    if (isFollowing) {
      // Unfollow
      await User.unfollowUser(userId, artistId);
      newFollowingList = following.filter((id: string) => id !== artistId);
      newFollowersList = (artist.followers || []).filter(
        (id: string) => id !== userId,
      );
    } else {
      // Follow
      await User.followUser(userId, artistId);
      newFollowingList = [...following, artistId];
      newFollowersList = [...(artist.followers || []), userId];
    }

    res.json({
      status: "ok",
      isFollowing: !isFollowing,
      followersCount: newFollowersList.length,
      followingCount: newFollowingList.length,
    });
  } catch (error) {
    console.error("Follow toggle error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to toggle follow status" });
  }
};
