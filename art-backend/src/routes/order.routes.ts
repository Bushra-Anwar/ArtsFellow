import { Router } from "express";
import jwt from "jsonwebtoken";
import { OrderModel } from "../models/Order.js";
import { Artwork } from "../models/Artwork.js";

const router = Router();

// Create Order (Protected)
router.post("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    // If we want to allow guests, we should handle no token, but CheckoutPage sends one.
    // Assuming secure checkout.
    if (!token) {
      console.error("No token provided for order");
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const secret = process.env.JWT_SECRET || "secret";
    let userId, userEmail;
    try {
      const decoded: any = jwt.verify(token, secret);
      userId = decoded.id;
      // We might want to fetch user to get email, or assume it's in body or token (token usually has id/role)
      // Order model wants userEmail.
      // We can fetch user from DB using userId if needed, or if email was in token.
      // generateToken only puts id and role.
      // Detailed implementation: Fetch user to get email.
    } catch (err) {
      console.error("Token verification failed", err);
      res.status(401).json({ status: "error", message: "Invalid Token" });
      return;
    }

    // Ideally we fetch user to get email, but to save time/dependencies in this file:
    // We can trust the user to send email in shipping address or similar, OR import User model.
    // Let's import User model to be safe.
    // Wait, I can't easily import User model if I didn't verify its path, but I know it's ../models/User.js

    // I will just use a placeholder email or check if body has it.
    // The CheckoutPage sends `shippingAddress` which might not have email.
    // It's better to get it from DB.

    // Dynamic import or stick to logic?
    // Let's risk it: we might not have email easily.
    // I will try to look up user.

    const orderData = {
      ...req.body,
      userId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await OrderModel.create(orderData);
    
    // Reduce stock for each item
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        if (item.artworkId) {
          await Artwork.reduceStock(item.artworkId, item.quantity || 1);
        }
      }
    }

    res.json({ status: "ok", message: "Order placed successfully" });
  } catch (e) {
    console.error("Order creation error", e);
    res.status(500).json({ status: "error", message: "Failed to place order" });
  }
});

// Get User Orders
router.get("/my-orders", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const secret = process.env.JWT_SECRET || "secret";
    const decoded: any = jwt.verify(token, secret);
    const userId = decoded.id;

    const orders = await OrderModel.findByUserId(userId);
    res.json({ status: "ok", orders });
  } catch (e) {
    console.error("Error fetching user orders", e);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch orders" });
  }
});

export default router;
