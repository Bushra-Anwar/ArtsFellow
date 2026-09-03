import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/image", async (req: any, res: any) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ status: "error", message: "Prompt is required" });
    }

    // Using a free HuggingFace model for image generation
    const model = "prompthero/openjourney"; // A good SD model
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Using provided token if available, otherwise trying unauthenticated
        ...(process.env.HF_API_KEY ? { "Authorization": `Bearer ${process.env.HF_API_KEY}` } : {})
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    res.json({ status: "ok", imageUrl: base64Image });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ status: "error", message: (error as Error).message });
  }
});

export default router;
