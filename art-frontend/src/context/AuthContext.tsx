import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, UserRole, Address } from "../models/User";
import { AuthService } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Methods
  loginWithEmail: (
    email: string,
    pass: string,
  ) => Promise<{ success: boolean; message?: string }>;
  loginWithOtp: (
    identity: string,
    otp: string,
    isEmail: boolean,
  ) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (
    email: string | null,
    phone: string | null,
    isLogin: boolean,
    isArtistRegistration?: boolean,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  forgotPassword: (
    email: string,
  ) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (
    email: string,
    otp: string,
    newPass: string,
  ) => Promise<{ success: boolean; message?: string }>;

  // Registration (Now essentially verifies OTP and updates profile)
  verifySignup: (data: any) => Promise<{ success: boolean; message?: string }>;

  // Marketplace Actions
  toggleWishlist: (artId: string) => void;
  addAddress: (addr: Omit<Address, "id">) => void;
  initiateQrLogin: () => string;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("art_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setRole(parsed.role);
      } catch (e) {
        localStorage.removeItem("art_user");
      }
    }
    setIsLoading(false);
  }, []);

  const saveUserSession = (userData: User, token?: string) => {
    setUser(userData);
    setRole(userData.role);
    localStorage.setItem("art_user", JSON.stringify(userData));
    if (token) {
      localStorage.setItem("art_token", token);
    }
    setIsLoading(false);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    saveUserSession(
      updatedUser,
      localStorage.getItem("art_token") || undefined,
    );
  };

  // 1. Send OTP
  const sendOtp = async (
    email: string | null,
    phone: string | null,
    isLogin: boolean,
    isArtistRegistration: boolean = false,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await AuthService.sendOtp(
        email,
        phone,
        isLogin,
        isArtistRegistration,
      );
      if (data.status === "ok") return { success: true, message: data.message };
      return { success: false, message: data.message || "Failed to send OTP" };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Network error" };
    }
  };

  // 2. Login with OTP
  const loginWithOtp = async (
    identity: string,
    otp: string,
    isEmail: boolean,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await AuthService.loginWithOtp(identity, otp, isEmail);
      if (data.status === "ok" && data.user) {
        saveUserSession(data.user, data.token);
        return { success: true };
      }
      return { success: false, message: data.message || "Login failed" };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Network error" };
    }
  };

  // 3. Login with Password (Admin)
  const loginWithEmail = async (
    email: string,
    pass: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await AuthService.loginWithEmail(email, pass);
      if (data.status === "ok" && data.user) {
        saveUserSession(data.user, data.token);
        return { success: true };
      }
      return { success: false, message: data.message || "Login failed" };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Network error" };
    }
  };

  // 4. Forgot Password (Send OTP)
  const forgotPassword = async (
    email: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await AuthService.forgotPassword(email);
      if (data.status === "ok") {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || "Failed to send OTP" };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Network error" };
    }
  };

  // 5. Reset Password (Verify OTP + New Pass)
  const resetPassword = async (
    email: string,
    otp: string,
    newPass: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await AuthService.resetPassword(email, otp, newPass);
      if (data.status === "ok") {
        return { success: true };
      }
      return {
        success: false,
        message: data.message || "Failed to reset password",
      };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Network error" };
    }
  };

  // 4. Verify Signup (Complete Registration)
  const verifySignup = async (
    payload: any,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await AuthService.verifySignup(payload);
      if (data.status === "ok" && data.user) {
        saveUserSession(data.user, data.token);
        return { success: true };
      }
      if (data.status === "pending_approval") {
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || "Verification failed" };
    } catch (e) {
      console.error(e);
      return { success: false, message: "Network error" };
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("art_user");
    localStorage.removeItem("art_token");
    window.location.href = "/";
  };

  // Marketplace Actions
  const toggleWishlist = async (artId: string) => {
    if (!user || !user.email) return;

    // Optimistic update
    const currentWishlist = user.wishlist || [];
    const isAdded = !currentWishlist.includes(artId);
    const newWishlist = isAdded
      ? [...currentWishlist, artId]
      : currentWishlist.filter((id) => id !== artId);

    // Update local state immediately
    const updatedUser = { ...user, wishlist: newWishlist };
    setUser(updatedUser);
    localStorage.setItem("art_user", JSON.stringify(updatedUser)); // Persist locally

    try {
      await AuthService.toggleWishlist(user.email, artId);
    } catch (e) {
      console.error(e);
      // Revert on error could be implemented here
    }
  };

  const addAddress = (addr: Omit<Address, "id">) => {
    if (!user) return;
    const newAddr: Address = {
      ...addr,
      id: Math.random().toString(),
      isDefault: user.addresses?.length === 0,
    };
    const updatedAddresses = [...user.addresses, newAddr];
    updateProfile({ addresses: updatedAddresses });
  };

  const initiateQrLogin = () => {
    return "mock-qr-session-" + Math.random().toString(36).substring(7);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        loginWithEmail,
        loginWithOtp,
        sendOtp,
        logout,
        forgotPassword,
        resetPassword,
        verifySignup,
        toggleWishlist,
        addAddress,
        initiateQrLogin,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
