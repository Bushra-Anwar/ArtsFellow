export type UserRole = "admin" | "artist" | "customer" | null;

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  // Artist specific
  brandName?: string;
  isVerified?: boolean;
  bio?: string;
  experience?: number;
  artStyles?: string[];
  isArtistVerified?: boolean;
  artistStatus?: "pending" | "approved" | "rejected" | "disabled";
  // Marketplace Data
  wishlist: string[]; // Array of artwork IDs
  addresses: Address[];
  portfolio?: string[]; // Array of URLs
  following?: string[]; // Array of artist IDs
  followers?: string[]; // Array of user IDs
}
