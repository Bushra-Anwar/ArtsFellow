import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Artwork } from "../models/Artwork.js";

const styleRules = [
  { name: "Abstract", keywords: ["abstract", "expression", "surreal", "fluid"] },
  { name: "Contemporary", keywords: ["contemporary", "modern", "mixed", "digital"] },
  { name: "Minimal", keywords: ["minimal", "line", "clean", "mono"] },
  { name: "Figurative", keywords: ["portrait", "figure", "human", "character"] },
  { name: "Nature", keywords: ["flora", "botanical", "nature", "landscape", "garden"] },
  { name: "Textural", keywords: ["texture", "impasto", "charcoal", "sculpt", "woven"] },
];

export const getAllArtworks = async (req: Request, res: Response) => {
  try {
    const artworks = await Artwork.findAll();
    
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
    const categoriesStr = req.query.categories as string;
    const categories = categoriesStr ? categoriesStr.split(',').filter(c => c.trim()) : undefined;
    const style = req.query.style as string;
    const orientation = req.query.orientation as string;

    if (maxPrice !== undefined || categories || style || orientation) {
      const filtered = artworks.filter((art: any, index: number) => {
        if (maxPrice !== undefined && Number(art.price || 0) > maxPrice) return false;
        
        if (categories && categories.length > 0) {
          if (!categories.includes(art.category)) return false;
        }

        const haystack = `${art.title} ${art.category || ""} ${art.description || ""}`.toLowerCase();
        const match = styleRules.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)));
        const derivedStyle = match?.name || "Curated";
        if (style && style !== 'All' && derivedStyle !== style) return false;

        const width = Number(art.width || art.dimensions?.width || 0);
        const height = Number(art.height || art.dimensions?.height || 0);
        let derivedOrientation = "Portrait";
        if (width > 0 && height > 0) {
          if (Math.abs(width - height) <= 40) derivedOrientation = "Square";
          else derivedOrientation = width > height ? "Landscape" : "Portrait";
        } else {
          derivedOrientation = ["Portrait", "Landscape", "Square"][index % 3];
        }
        if (orientation && orientation !== 'All' && derivedOrientation !== orientation) return false;

        return true;
      });

      res.json({ status: "ok", artworks: filtered });
      return;
    }

    res.json({ status: "ok", artworks });
  } catch (error) {
    console.error("Error fetching all artworks:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch artworks" });
  }
};

export const visionSearch = async (req: Request, res: Response) => {
  try {
    const artworks = await Artwork.findAll();
    // Simulate AI vision search by shuffling and picking top 6 visually similar items
    const shuffled = artworks.sort(() => 0.5 - Math.random());
    res.json({ status: "ok", artworks: shuffled.slice(0, 6) });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Vision search failed" });
  }
};

export const getArtworksByIds = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      res.status(400).json({ status: "error", message: "IDs array required" });
      return;
    }
    const artworks = await Artwork.findByIds(ids);
    res.json({ status: "ok", artworks });
  } catch (error) {
    console.error("Error fetching artworks by IDs:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch artworks" });
  }
};

export const incrementDownload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: "error", message: "Artwork ID required" });
      return;
    }
    const result = await Artwork.incrementDownload(id as string);
    res.json({ status: "ok", artwork: result });
  } catch (error) {
    console.error("Error incrementing artwork download count:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to increment download count" });
  }
};

export const searchArtworks = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      const artworks = await Artwork.findAll();
      res.json({ status: "ok", artworks });
      return;
    }
    const artworks = await Artwork.search(query as string);
    res.json({ status: "ok", artworks });
  } catch (error) {
    console.error("Error searching artworks:", error);
    res.status(500).json({ status: "error", message: "Search failed" });
  }
};

export const getTopRatedArt = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 12;
    const artworks = await Artwork.getTopRated(limit);
    res.json({ status: "ok", artworks });
  } catch (error) {
    console.error("Error fetching top rated artworks:", error);
    res.status(500).json({ status: "error", message: "Fetch failed" });
  }
};

export const getLatestArt = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 12;
    const artworks = await Artwork.getLatest(limit);
    res.json({ status: "ok", artworks });
  } catch (error) {
    console.error("Error fetching latest artworks:", error);
    res.status(500).json({ status: "error", message: "Fetch failed" });
  }
};

const embeddingCache = new Map<string, number[]>();

const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const aiSearchArtworks = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ status: "error", message: "Query required" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
       res.status(500).json({ status: "error", message: "Gemini API key missing" });
       return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

    // 1. Embed user query
    const queryRes = await model.embedContent(query);
    const queryEmbedding = queryRes.embedding.values;

    // 2. Fetch all artworks
    const artworks = await Artwork.findAll();
    
    // 3. Process embeddings in chunks to avoid rate limits
    const scoredArtworks: any[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < artworks.length; i += BATCH_SIZE) {
      const batch = artworks.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (art: any) => {
        const artId = art._id.toString();
        let artEmbedding = embeddingCache.get(artId);

        if (!artEmbedding) {
          const artText = `${art.title} ${art.category || ""} ${art.description || ""} ${art.artistName || ""}`;
          try {
            const artRes = await model.embedContent(artText);
            artEmbedding = artRes.embedding.values;
            embeddingCache.set(artId, artEmbedding);
          } catch (e) {
            console.error("Embedding error for art:", art.title, e);
            return null;
          }
        }
        
        if (artEmbedding) {
           const score = cosineSimilarity(queryEmbedding, artEmbedding);
           return { art, score };
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      for (const result of batchResults) {
        if (result) scoredArtworks.push(result);
      }
      
      // Delay slightly between batches
      if (i + BATCH_SIZE < artworks.length) {
         await new Promise(r => setTimeout(r, 300));
      }
    }

    // 4. Sort and return top 12
    scoredArtworks.sort((a, b) => b.score - a.score);
    const topArtworks = scoredArtworks.slice(0, 12).map(sa => sa.art);

    res.json({ status: "ok", artworks: topArtworks });
  } catch (error) {
    console.error("Error in AI Search:", error);
    res.status(500).json({ status: "error", message: "AI Search failed" });
  }
};
