import { Request, Response } from "express";
import sharp from "sharp";
import path from "path";
import fs from "fs";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ status: "error", message: "No file uploaded" });
      return;
    }

    const isImage = req.file.mimetype.startsWith("image/");
    if (isImage) {
      const originalPath = req.file.path;
      const webpFilename = `${path.parse(req.file.filename).name}.webp`;
      const webpPath = path.join(req.file.destination, webpFilename);

      // Compress to ultra-light webp format
      await sharp(originalPath).webp({ quality: 80 }).toFile(webpPath);
      
      // Delete the original uncompressed file to save space
      await fs.promises.unlink(originalPath);

      const url = `/uploads/portfolio/${webpFilename}`;
      res.json({ status: "ok", url });
    } else {
      // Non-image file (e.g. PDF)
      const url = `/uploads/portfolio/${req.file.filename}`;
      res.json({ status: "ok", url });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ status: "error", message: "Failed to upload file" });
  }
};
