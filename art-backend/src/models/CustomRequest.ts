export interface CustomRequest {
  _id?: string;
  clientId: string; // The user asking for art
  clientName: string; // Cached for ease
  clientEmail: string;
  description: string;
  style: string;
  size: string;
  budget: string; // e.g., "$100 - $300"
  deadline: string;
  signatureRequirement?: string; // e.g. "With Signature", "Without Signature"
  signaturePlacement?: string; // e.g. "Front", "Back"
  referenceImage?: string;

  // Workflow
  artistId?: string; // If requested from a specific artist
  status: "pending" | "accepted" | "rejected" | "completed" | "in_progress";

  // Negotiation
  artistPriceQuote?: number;
  artistEstimatedTime?: string;
  artistNote?: string;

  createdAt: Date;
  updatedAt: Date;
}
