import { api } from "./api";
import type { ApiResponse } from "../models/ApiResponse";

export const ArtworkService = {
  getAllArtworks: async (filters?: { maxPrice?: number, categories?: string[], style?: string, orientation?: string }) => {
    let url = "/artworks";
    if (filters) {
      const params = new URLSearchParams();
      if (filters.maxPrice !== undefined) params.append("maxPrice", filters.maxPrice.toString());
      if (filters.categories && filters.categories.length > 0) params.append("categories", filters.categories.join(','));
      if (filters.style && filters.style !== "All") params.append("style", filters.style);
      if (filters.orientation && filters.orientation !== "All") params.append("orientation", filters.orientation);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }
    return api.get<ApiResponse>(url);
  },

  getArtworksByIds: async (ids: string[]) => {
    return api.post<ApiResponse>("/artworks/batch", { ids });
  },

  incrementDownload: async (id: string) => {
    return api.post<ApiResponse>(`/artworks/${id}/download`, {});
  },

  searchArtworks: async (query: string) => {
    return api.get<ApiResponse>(`/artworks/search?query=${encodeURIComponent(query)}`);
  },

  getTopRatedArt: async (limit: number = 10) => {
    return api.get<ApiResponse>(`/artworks/top-rated?limit=${limit}`);
  },

  getLatestArt: async (limit: number = 12) => {
    return api.get<ApiResponse>(`/artworks/latest?limit=${limit}`);
  },

  visionSearch: async (file?: File) => {
    // We send a POST request. In a real app we would use FormData to upload the file.
    // Here we just hit the endpoint.
    return api.post<ApiResponse>("/artworks/vision-search", {});
  }
};
