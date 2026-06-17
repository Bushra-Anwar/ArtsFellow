import { api } from "./api";
import type { ApiResponse } from "../models/ApiResponse";

export const ArtistService = {
  getAllArtists: async () => {
    return api.get<ApiResponse>("/artist");
  },

  getTopArtists: async (limit: number = 5) => {
    return api.get<ApiResponse>(`/artist/top?limit=${limit}`);
  },

  getArtistById: async (id: string) => {
    return api.get<ApiResponse>(`/artist/${id}`);
  },

  getArtistArtworks: async (id: string) => {
    return api.get<ApiResponse>(`/artist/${id}/artworks`);
  },

  getDashboardStats: async (id: string) => {
    return api.get<ApiResponse>(`/artist/${id}/stats`);
  },

  getArtistOrders: async (id: string) => {
    return api.get<ApiResponse>(`/artist/${id}/orders`);
  },

  createArtwork: async (artworkData: any) => {
    return api.post<ApiResponse>("/artist/artworks", artworkData);
  },

  addPortfolioImage: async (email: string, imageUrl: string) => {
    return api.post<ApiResponse>("/artist/portfolio/add", { email, imageUrl });
  },

  deletePortfolioImage: async (email: string, imageUrl: string) => {
    return api.post<ApiResponse>("/artist/portfolio/delete", {
      email,
      imageUrl,
    });
  },

  deleteArtwork: async (id: string) => {
    // Using 'api' helper which handles headers/token.
    // Note: api.get/post exist, but need to check if 'delete' works with api helper or if we need to use fetch directly or add api.delete
    // Looking at api.ts, it only has get, post, postFormData. We should add delete to api.ts or use fetch here.
    // Let's modify api.ts first or just use fetch here properly.
    // Actually, let's keep it simple and use raw fetch or update api.ts.
    // Ideally update api.ts but for now let's just use the api helper if I update it, or add it here.
    // Wait, I can't see api.ts content right now in memory easily to be 100% sure without looking back.
    // I will assume I need to add 'delete' to api.ts or implement it here.
    // Let's implement it here using clean fetch for safety or better yet, verify api.ts.
    // Previous view_file of api.ts showed get, post, postFormData. No delete.
    // So I will add delete to api.ts in a separate step or just use fetch here.
    // I'll update api.ts in the next step to be clean.
    return api.delete<ApiResponse>(`/artist/artworks/${id}`);
  },
};
