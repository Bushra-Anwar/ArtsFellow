import { api } from "./api";
import type { ApiResponse } from "../models/ApiResponse";

export const AuthService = {
  sendOtp: async (
    email: string | null,
    phone: string | null,
    isLogin: boolean,
    isArtistRegistration: boolean = false,
  ) => {
    const body: any = { isLogin, isArtistRegistration };
    if (email) body.email = email;
    if (phone) body.phone = phone;
    return api.post<ApiResponse>("/auth/send-otp", body);
  },

  loginWithOtp: async (identity: string, otp: string, isEmail: boolean) => {
    const body: any = { otp };
    if (isEmail) body.email = identity;
    else body.phone = identity;
    return api.post<ApiResponse>("/auth/login-otp", body);
  },

  loginWithEmail: async (email: string, pass: string) => {
    return api.post<ApiResponse>("/auth/login-password", {
      email,
      password: pass,
    });
  },

  forgotPassword: async (email: string) => {
    return api.post<ApiResponse>("/auth/forgot-password", { email });
  },

  resetPassword: async (email: string, otp: string, newPass: string) => {
    return api.post<ApiResponse>("/auth/reset-password", {
      email,
      otp,
      newPassword: newPass,
    });
  },

  verifySignup: async (payload: any) => {
    if (payload instanceof FormData) {
      return api.postFormData<ApiResponse>("/auth/verify-signup", payload);
    }
    if (payload.portfolio && payload.portfolio.length > 0) {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key !== "portfolio") {
          formData.append(key, payload[key]);
        }
      });
      payload.portfolio.forEach((file: File) => {
        formData.append("portfolio", file);
      });
      return api.postFormData<ApiResponse>("/auth/verify-signup", formData);
    } else {
      return api.post<ApiResponse>("/auth/verify-signup", payload);
    }
  },

  toggleWishlist: async (email: string, artId: string) => {
    return api.post<ApiResponse>("/auth/toggle-wishlist", { email, artId });
  },

  updateProfile: async (email: string, updates: any) => {
    return api.post<ApiResponse>("/auth/update-profile", { email, ...updates });
  },
};
