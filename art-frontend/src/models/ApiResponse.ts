export interface ApiResponse<T = any> {
  status: "ok" | "error" | "pending_approval";
  message?: string;
  data?: T;
  // Specific fields often returned by backend
  user?: any;
  token?: string;
  artists?: any[];
  artist?: any;
  artworks?: any[];
  artwork?: any;
  url?: string;
  wishlist?: string[];
}
