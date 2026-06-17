import { api } from "./api";

export const RatingService = {
  rateArtwork: async (artworkId: string, artistId: string, customerId: string, rating: number) => {
    return api.post<any>("/ratings/rate", { artworkId, artistId, customerId, rating });
  },
  getCustomerRatings: async (customerId: string) => {
    return api.get<any>(`/ratings/customer/${customerId}`);
  },
  getArtistRatings: async (artistId: string) => {
    return api.get<any>(`/ratings/artist/${artistId}`);
  }
};
