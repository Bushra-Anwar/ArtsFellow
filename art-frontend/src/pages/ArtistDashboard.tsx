import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Image as ImageIcon,
  ShoppingBag,
  DollarSign,
  Settings,
  Upload,
  Plus,
  Search,
  CheckCircle,
  Trash2,
  MessageSquare,
  Check,
  X,
  Shield,
  Edit3,
  Mail,
  Download,
} from "lucide-react";

import { ArtistService } from "../services/artist.service";
import { AuthService } from "../services/auth.service";
import { artCategories } from "../constants/artCategories";

import { useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ArtistDashboard: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { openChat } = useChat();
  const [activeTab, setActiveTab] = useState<
    "overview" | "artworks" | "orders" | "earnings" | "settings" | "requests"
  >("overview");
  const [isPortfolioUploading, setIsPortfolioUploading] = useState(false);

  // Sync Active Tab with URL Path
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes("/artist/artworks")) setActiveTab("artworks");
    else if (path.includes("/artist/requests")) setActiveTab("requests");
    else if (path.includes("/artist/orders")) setActiveTab("orders");
    else if (path.includes("/artist/earnings")) setActiveTab("earnings");
    else if (path.includes("/artist/settings"))
      setActiveTab("settings"); // Note: settings route isn't explicit in routes but we handle it
    else setActiveTab("overview");
  }, [location.pathname]);

  // Artwork State
  const [artworks, setArtworks] = useState<any[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
  const [artworkFilter, setArtworkFilter] = useState("All Status");

  // Requests State
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Real Data State
  const [statsData, setStatsData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    brandName: "",
    phone: "",
    bio: "",
    avatar: "",
  });

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        brandName: user.brandName || "",
        phone: user.phone || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
      });
    }
  }, [user, activeTab]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB");
        return;
      }

      try {
        setIsAvatarUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setProfileForm((prev) => ({ ...prev, avatar: data.url }));
        } else {
          alert(data.message || "Upload failed");
        }
      } catch (err) {
        console.error(err);
        alert("Upload error");
      } finally {
        setIsAvatarUploading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!user?.email) return;
      // @ts-ignore
      const res = await AuthService.updateProfile(user.email, profileForm);
      // @ts-ignore
      if (res.status === "ok") {
        updateProfile(profileForm);
        setIsEditingProfile(false);
        alert("Profile updated successfully!");
      } else {
        // @ts-ignore
        alert(res.message || "Failed to update profile");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating profile");
    }
  };

  React.useEffect(() => {
    if (activeTab === "artworks" && user?._id) fetchArtworks();
    if (activeTab === "requests" && user?._id) fetchRequests();
    if (activeTab === "overview" && user?._id) fetchStats();
    if (activeTab === "orders" && user?._id) fetchOrders();
    if (activeTab === "earnings" && user?._id) fetchStats();
  }, [activeTab, user?._id]);

  const fetchStats = async () => {
    try {
      const res: any = await ArtistService.getDashboardStats(user!._id);
      if (res.status === "ok") setStatsData(res.stats);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res: any = await ArtistService.getArtistOrders(user!._id);
      if (res.status === "ok") setOrders(res.orders);
    } catch (e) {
      console.error(e);
    }
    setIsLoadingOrders(false);
  };

  const fetchRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const res = await fetch(`/api/custom-requests/artist/${user!._id}`);
      const data = await res.json();
      if (data.status === "ok") {
        setCustomRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleRequestAction = async (
    id: string,
    action: "accepted" | "rejected",
  ) => {
    let body: any = { status: action, artistId: user!._id };

    if (action === "accepted") {
      const price = prompt("Enter your price quote (₹):");
      if (!price) return;
      const time = prompt("Estimated time (e.g. 2 weeks):");
      if (!time) return;

      body.artistPriceQuote = parseFloat(price);
      body.artistEstimatedTime = time;
    }

    try {
      const res = await fetch(`/api/custom-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        alert(`Request ${action}!`);
        fetchRequests();
      } else {
        alert("Action failed");
      }
    } catch (e) {
      alert("Error");
    }
  };

  const requestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await ArtistService.deleteArtwork(deleteId);
      if (res.status === "ok") {
        setArtworks((prev) => prev.filter((art) => art._id !== deleteId));
        setDeleteId(null);
      } else {
        alert("Failed to delete artwork");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting artwork");
    }
  };

  const fetchArtworks = async () => {
    try {
      setIsLoadingArtworks(true);
      const res: any = await ArtistService.getArtistArtworks(user!._id);
      if (res.artworks) {
        setArtworks(res.artworks);
      } else if (res.data && Array.isArray(res.data)) {
        setArtworks(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch artworks", error);
    } finally {
      setIsLoadingArtworks(false);
    }
  };

  // MOCK DATA for Dashboard -> REAL DATA
  const stats = [
    {
      title: "Total Sales",
      value: statsData
        ? `₹${Number(statsData.totalEarnings || 0).toLocaleString()}`
        : "...",
      change: "",
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Total Artworks",
      value: statsData?.totalArtworks || "...",
      change: "",
      icon: ImageIcon,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Pending Requests",
      value:
        statsData?.pendingRequests ||
        customRequests.filter((r) => r.status === "pending").length.toString(),
      change: "New",
      icon: MessageSquare,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Avg. Rating",
      value: statsData?.avgRating || "0.0",
      change: "",
      icon: CheckCircle,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  // Upload & Manage State
  const [isUploadMode, setIsUploadMode] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("");

  // State for Variants
  const [variants, setVariants] = useState<{ size: string; price: string }[]>([
    { size: "A1", price: "" },
  ]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        alert("File too large. Max 50MB");
        return;
      }
      setSelectedFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleVariantChange = (
    index: number,
    field: "size" | "price",
    value: string,
  ) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { size: "", price: "" }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handlePublish = async () => {
    // Validate variants
    const validVariants = variants.filter((v) => v.size && v.price);
    if (!title.trim() || validVariants.length === 0 || !selectedFile) {
      let missing = [];
      if (!title.trim()) missing.push("Title");
      if (validVariants.length === 0) missing.push("At least one Size & Price");
      if (!selectedFile) missing.push("Artwork Image");

      alert(`Please fill in all required fields: ${missing.join(", ")}`);
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      // 1. Upload File
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(uploadData.message);

      // Calculate Max and Min Price
      const prices = validVariants.map((v) => parseFloat(v.price));
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      // 2. Create Artwork Record
      const artworkData = {
        artistId: user!._id,
        title,
        price: maxPrice, // Main price
        minPrice: minPrice,
        variants: validVariants.map((v) => ({
          size: v.size,
          price: parseFloat(v.price),
        })),
        category: category || "Painting",
        description: desc,
        images: [uploadData.url],
        availability: "available",
        deliveryType: "physical",
      };

      const createRes = await fetch("/api/artist/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(artworkData),
      });

      if (createRes.ok) {
        alert("Artwork published successfully!");
        setIsUploadMode(false);
        setTitle("");
        setVariants([{ size: "A1", price: "" }]);
        setDesc("");
        setSelectedFile(null);
        setUploadPreview(null);
        fetchArtworks(); // Refresh list
      } else {
        const errorData = await createRes.json();
        throw new Error(errorData.message || "Failed to create listing");
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  // Delete Portfolio Image
  const handleDeletePortfolio = async (imgUrl: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this image from your portfolio?",
      )
    )
      return;

    try {
      const res = await fetch("/api/artist/portfolio/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email, imageUrl: imgUrl }),
      });
      const data = await res.json();

      if (data.status === "ok") {
        const newPortfolio =
          user?.portfolio?.filter((url) => url !== imgUrl) || [];
        updateProfile({ portfolio: newPortfolio });
      } else {
        alert(data.message || "Failed to delete image");
      }
    } catch (e) {
      alert("Network error");
    }
  };

  // Add Portfolio Image
  const handleAddPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.email) {
      alert("User email not found. Please login again.");
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        alert("File too large. Max 50MB");
        return;
      }

      try {
        setIsPortfolioUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.message);

        const addRes = await fetch("/api/artist/portfolio/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, imageUrl: uploadData.url }),
        });

        const addData = await addRes.json();

        if (addRes.ok) {
          let currentPortfolio = user?.portfolio || [];
          if (currentPortfolio.length >= 3) {
            currentPortfolio = currentPortfolio.slice(1);
          }
          const newPortfolio = [...currentPortfolio, uploadData.url];
          updateProfile({ portfolio: newPortfolio });
        } else {
          throw new Error(addData.message || "Failed to add image");
        }
      } catch (err: any) {
        alert(err.message || "Failed to upload");
      } finally {
        setIsPortfolioUploading(false);
      }
    }
  };

  const handleSupport = async () => {
    try {
      const res = await fetch("/api/auth/admin-contact");
      const data = await res.json();
      if (data.status === "ok") {
        // Navigate to chat page instead of opening sidebar
        navigate("/chat", {
          state: {
            chatWith: {
              id: data.admin._id,
              name: data.admin.name || "Support Team",
              avatar: data.admin.avatar,
              role: "admin",
            },
          },
        });
      } else {
        alert("Support contact not available");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to contact support");
    }
  };

  if (!user || user.role !== "artist") {
    return (
      <div className="p-10 text-center text-red-500 pt-32">
        Access Denied. Artist only area.
      </div>
    );
  }

  // Check for Pending Status
  const isPending =
    user.artistStatus === "pending" ||
    (user.isArtistVerified === false && !user.artistStatus);

  if (isPending) {
    return (
      <div className="min-h-screen bg-transparent dark:bg-transparent pt-24 px-4 flex flex-col items-center justify-center page-enter">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-[32px] shadow-2xl max-w-2xl w-full border border-gray-100 dark:border-slate-800 overflow-hidden"
        >
          {/* Status Header */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-8 flex flex-col items-center border-b border-yellow-100 dark:border-yellow-900/20 text-center">
            <div className="w-20 h-20 bg-white dark:bg-[var(--card-bg)] text-yellow-500 rounded-full flex items-center justify-center shadow-lg mb-4">
              <CheckCircle size={40} className="animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold dark:text-white mb-2">
              Application Under Review
            </h1>
            <p className="text-yellow-700 dark:text-yellow-400 font-medium">
              We're verifying your artistic profile
            </p>
          </div>

          <div className="p-10 text-center">
            {/* Profile Summary */}
            <div className="mb-10 p-6 bg-white dark:bg-[var(--card-bg)]/50 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden mb-4 bg-gray-200">
                <img
                  src={user.avatar || "https://upload.wikimedia.org/wikipedia/commons/b/b2/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg"}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold dark:text-white">
                {user.name}
              </h2>
              <p className="text-[var(--color-primary)] font-medium mb-3">
                {user.brandName || "Independent Artist"}
              </p>
              <p className="text-gray-500 dark:text-[var(--text-muted)] text-sm max-w-md line-clamp-3">
                {user.bio ||
                  "Thank you for sharing your journey with us. Our curation team is currently reviewing your portfolio and experience."}
              </p>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <p className="text-[var(--text-muted)] dark:text-[var(--text-muted)] mb-6 leading-relaxed">
                Approval usually takes 24-48 hours. Once approved, you'll get
                full access to your artist dashboard and gallery.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleSupport}
                  className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-2xl shadow-lg hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare size={20} />
                  Chat Admin
                </button>
                <a
                  href="mailto:support@artsfellow.com"
                  className="w-full py-4 bg-white dark:bg-[var(--card-bg)] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 font-bold rounded-2xl shadow-sm hover:bg-white dark:hover:bg-slate-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <Mail size={20} />
                  Email Us
                </a>
              </div>

              <button
                onClick={() => logout()}
                className="mt-8 text-[var(--text-muted)] hover:text-red-500 text-sm font-bold flex items-center gap-2 mx-auto transition-colors"
              >
                <X size={16} /> Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Check for Rejected Status
  // Check for Rejected Status
  if (user.artistStatus === "rejected") {
    return (
      <div className="min-h-screen bg-transparent dark:bg-transparent pt-24 px-4 flex flex-col items-center justify-center page-enter">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white dark:bg-[var(--bg-primary)]/50 p-10 rounded-[32px] shadow-2xl max-w-lg w-full border border-gray-100 dark:border-slate-800 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
          <button
            onClick={handleSupport}
            className="absolute top-6 right-6 p-3 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all"
            title="Chat with Admin"
          >
            <MessageSquare size={20} />
          </button>

          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <X size={40} />
          </div>
          <h1 className="text-2xl font-bold dark:text-white mb-6 text-center">
            Application Update
          </h1>

          <div className="text-gray-500 dark:text-[var(--text-muted)] mb-8 text-left space-y-4 text-sm leading-relaxed">
            <p>Dear Artist,</p>
            <p>
              Thank you for your interest in joining <strong>ArtsFellow</strong>
              . We truly appreciate the time and effort you invested in sharing
              your portfolio with us.
            </p>
            <p>
              After a careful review, we regret to inform you that we are unable
              to approve your artist application at this time.
            </p>
            <p>We wish you continued success in your artistic journey.</p>
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800 mt-6">
              <p className="font-bold text-[var(--text-main)]">Warm regards,</p>
              <p className="text-[var(--color-primary)] font-medium">
                Admin Team
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <a
              href="mailto:support@artsfellow.com"
              className="w-full py-4 bg-white dark:bg-[var(--card-bg)] text-gray-700 dark:text-gray-200 font-bold rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center justify-center gap-2 hover:bg-white transition-all"
            >
              <Mail size={18} /> Contact via Email
            </a>
            <button
              onClick={() => logout()}
              className="w-full py-4 text-[var(--text-muted)] hover:text-red-500 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <X size={16} /> Sign Out & Browse as Guest
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Check for Disabled Status
  if (user.artistStatus === "disabled") {
    return (
      <div className="min-h-screen bg-transparent dark:bg-transparent pt-24 px-4 flex flex-col items-center justify-center page-enter">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[var(--bg-primary)]/50 p-10 rounded-[32px] shadow-2xl max-w-lg w-full border border-gray-100 dark:border-slate-800 text-center"
        >
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield size={40} />
          </div>
          <h1 className="text-3xl font-bold dark:text-white mb-4">
            Account Disabled
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your artist account has been temporarily disabled by the
            administration. Please contact us to resolve any issues.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleSupport}
              className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-2xl shadow-lg hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              Chat Admin
            </button>
            <a
              href="mailto:support@artsfellow.com"
              className="w-full py-4 bg-white dark:bg-[var(--card-bg)] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 font-bold rounded-2xl hover:bg-white transition-all flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              Email Support
            </a>
          </div>

          <button
            onClick={() => logout()}
            className="text-[var(--text-muted)] hover:text-red-500 text-sm font-bold flex items-center gap-2 mx-auto transition-colors"
          >
            <X size={16} /> Logout
          </button>
        </motion.div>
      </div>
    );
  }

  const SidebarItem = ({
    id,
    label,
    icon: Icon,
  }: {
    id: typeof activeTab;
    label: string;
    icon: any;
  }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setIsUploadMode(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === id ? "bg-[var(--color-primary)] text-white shadow-lg" : "text-gray-500 hover:bg-white dark:hover:bg-slate-800 dark:text-[var(--text-muted)]"}`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  const filteredArtworksList = artworks.filter((art) => {
    if (artworkFilter === "All Status") return true;
    if (artworkFilter === "Available") return art.availability === "available";
    if (artworkFilter === "Sold") return art.availability === "sold";
    return true;
  });

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent flex flex-col md:flex-row pt-20 page-enter">
      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[var(--bg-primary)] border-t border-gray-100 dark:border-slate-800 safe-bottom">
        <div className="flex justify-around items-center py-2">
          {[
            { id: 'overview' as const, icon: LayoutDashboard, label: 'Home' },
            { id: 'artworks' as const, icon: ImageIcon, label: 'Art' },
            { id: 'requests' as const, icon: MessageSquare, label: 'Requests' },
            { id: 'orders' as const, icon: ShoppingBag, label: 'Orders' },
            { id: 'earnings' as const, icon: DollarSign, label: 'Earnings' },
            { id: 'settings' as const, icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsUploadMode(false); }}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${activeTab === item.id ? 'text-[var(--color-primary)]' : 'text-gray-400 dark:text-gray-500'}`}
            >
              <item.icon size={20} />
              <span className="text-[9px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar (desktop only) */}
      <aside className="w-64 fixed h-full bg-white dark:bg-[var(--bg-primary)]/50 border-r border-gray-100 dark:border-slate-800 p-6 hidden md:block z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            {user.name?.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold dark:text-white text-sm">
              {user.brandName || user.name}
            </h3>
            <p className="text-xs text-gray-500">Artist Account</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SidebarItem id="overview" label="Overview" icon={LayoutDashboard} />
          <SidebarItem id="artworks" label="My Artworks" icon={ImageIcon} />
          <SidebarItem
            id="requests"
            label="Custom Requests"
            icon={MessageSquare}
          />
          <SidebarItem id="orders" label="Orders" icon={ShoppingBag} />
          <SidebarItem id="earnings" label="Earnings" icon={DollarSign} />
          <SidebarItem id="settings" label="Settings" icon={Settings} />

          <button
            onClick={handleSupport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-gray-500 hover:bg-white dark:hover:bg-slate-800 dark:text-[var(--text-muted)] mt-4 border-t border-gray-100 dark:border-slate-800"
          >
            <MessageSquare size={20} />
            Contact Support
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 px-4 py-6 md:p-8 pb-24 md:pb-8">
        {/* Overview View */}
        {activeTab === "overview" && !isUploadMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-3xl font-bold dark:text-white mb-2">
                Dashboard Overview
              </h1>
              <p className="text-gray-500">
                Here's what's happening with your art business today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[var(--bg-primary)]/50 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon size={22} />
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith("+") ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold dark:text-white mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                </div>
              ))}
            </div>

            {/* Recent Activity Mock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-[var(--bg-primary)]/50 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 h-80">
                <h3 className="font-bold dark:text-white mb-4">
                  Sales Analytics
                </h3>
                <h3 className="font-bold dark:text-white mb-4">
                  Sales Analytics (Last 7 Days)
                </h3>
                <div className="h-full w-full pr-4 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        {
                          name: "Mon",
                          sales: statsData?.last7Days?.[0] || 4000,
                        },
                        {
                          name: "Tue",
                          sales: statsData?.last7Days?.[1] || 3000,
                        },
                        {
                          name: "Wed",
                          sales: statsData?.last7Days?.[2] || 2000,
                        },
                        {
                          name: "Thu",
                          sales: statsData?.last7Days?.[3] || 2780,
                        },
                        {
                          name: "Fri",
                          sales: statsData?.last7Days?.[4] || 1890,
                        },
                        {
                          name: "Sat",
                          sales: statsData?.last7Days?.[5] || 2390,
                        },
                        {
                          name: "Sun",
                          sales: statsData?.last7Days?.[6] || 3490,
                        },
                      ]}
                    >
                      <defs>
                        <linearGradient
                          id="colorSales"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-primary)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-primary)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="var(--color-primary)"
                        fillOpacity={1}
                        fill="url(#colorSales)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white dark:bg-[var(--bg-primary)]/50 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 h-80">
                <h3 className="font-bold dark:text-white mb-4">
                  Recent Orders
                </h3>
                <div className="space-y-4">
                  {statsData?.recentOrders ? (
                    statsData.recentOrders.map((order: any) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-lg flex items-center justify-center text-[var(--color-primary)]">
                            <ShoppingBag size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm dark:text-white line-clamp-1">
                              {order.items}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-green-600 font-bold text-sm">
                          +₹{Number(order.total || 0).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[var(--text-muted)] py-10">
                      No recent orders
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Custom Requests View */}
        {activeTab === "requests" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold dark:text-white">
                  Custom Requests
                </h1>
                <p className="text-gray-500">
                  Manage commission requests from clients.
                </p>
              </div>

              {isLoadingRequests ? (
                <div className="text-center py-20">Loading requests...</div>
              ) : customRequests.length > 0 ? (
                <div className="space-y-4">
                  {customRequests.map((req: any) => (
                    <div
                      key={req._id}
                      className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-6"
                    >
                      {req.referenceImage && (
                        <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden bg-white shrink-0">
                          <img
                            src={req.referenceImage}
                            alt="Ref"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg dark:text-white">
                              {req.description}
                            </h3>
                            <p className="text-sm text-gray-500">
                              From {req.clientName}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${req.status === "pending" ? "bg-yellow-100 text-yellow-600" : req.status === "accepted" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white dark:bg-[var(--card-bg)] p-4 rounded-xl">
                          <div>
                            <span className="block text-gray-500 text-xs">
                              Style
                            </span>
                            <span className="font-medium">{req.style}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500 text-xs">
                              Size
                            </span>
                            <span className="font-medium">{req.size}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500 text-xs">
                              Budget
                            </span>
                            <span className="font-medium">{req.budget}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500 text-xs">
                              Deadline
                            </span>
                            <span className="font-medium">
                              {req.deadline
                                ? new Date(req.deadline).toLocaleDateString()
                                : "None"}
                            </span>
                          </div>
                        </div>

                        {req.status === "pending" && (
                          <div className="flex gap-4 pt-2">
                            <button
                              onClick={() =>
                                handleRequestAction(req._id, "accepted")
                              }
                              className="flex-1 bg-[var(--color-primary)] text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
                            >
                              <Check size={18} /> Accept
                            </button>
                            <button
                              onClick={() =>
                                handleRequestAction(req._id, "rejected")
                              }
                              className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-200 transition"
                            >
                              <X size={18} /> Decline
                            </button>
                          </div>
                        )}

                        {req.status === "accepted" && (
                          <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl text-sm border border-green-100 dark:border-green-900/30">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-green-700 dark:text-green-400 font-bold flex items-center gap-2">
                                  <CheckCircle size={16} /> Accepted
                                </p>
                                <div className="mt-2 flex gap-4 text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                                  <span>
                                    Quote: <b>${req.artistPriceQuote}</b>
                                  </span>
                                  <span>
                                    Time: <b>{req.artistEstimatedTime}</b>
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  openChat({
                                    id: req.clientId,
                                    name: req.clientName,
                                    avatar: "",
                                    role: "customer",
                                  })
                                }
                                className="px-4 py-2 bg-white dark:bg-[var(--card-bg)] text-[var(--color-primary)] font-bold rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-white flex items-center gap-2"
                              >
                                <MessageSquare size={16} /> Chat
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                  <MessageSquare
                    size={48}
                    className="mx-auto text-gray-300 mb-4"
                  />
                  <p className="text-gray-500">No requests yet.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Artworks View */}
        {activeTab === "artworks" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {!isUploadMode ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold dark:text-white">
                      My Artworks
                    </h1>
                    <p className="text-gray-500">
                      Manage your portfolio and listings.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadMode(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all"
                  >
                    <Plus size={20} /> Add New Artwork
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search your artworks..."
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[var(--bg-primary)]/50 rounded-xl border border-gray-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <select
                    className="px-4 py-3 bg-white dark:bg-[var(--bg-primary)]/50 rounded-xl border border-gray-100 dark:border-slate-800 outline-none"
                    value={artworkFilter}
                    onChange={(e) => setArtworkFilter(e.target.value)}
                  >
                    <option>All Status</option>
                    <option>Available</option>
                    <option>Sold</option>
                  </select>
                </div>

                {/* Artworks Grid */}
                {isLoadingArtworks ? (
                  <div className="text-center py-20">Loading artworks...</div>
                ) : filteredArtworksList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArtworksList.map((art: any) => (
                      <div
                        key={art._id}
                        className={`bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition group relative ${art.availability === "sold" ? "opacity-75" : ""}`}
                      >
                        <div className="aspect-[4/3] bg-white relative">
                          <img
                            src={
                              art.images?.[0]?.startsWith("http") ||
                              art.images?.[0]?.includes("/assets")
                                ? art.images[0]
                                : `http://localhost:5005${art.images?.[0]}`
                            }
                            alt={art.title}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${art.availability === "available" ? "bg-green-500 text-white" : "bg-white0 text-white"}`}
                          >
                            {art.availability === "available"
                              ? "Available"
                              : "Sold"}
                          </span>
                          {/* Delete Button - Visible on Hover */}
                          <button
                            onClick={(e) => requestDelete(art._id, e)}
                            className="absolute top-3 left-3 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                            title="Delete Artwork"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold dark:text-white mb-1 truncate">
                            {art.title}
                          </h3>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[var(--color-primary)] font-bold">
                              ${art.price}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {art.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-slate-800 w-fit px-2 py-1 rounded-md">
                            <Download size={14} /> {art.downloads || 0} Downloads
                          </div>
                        </div>
                        {art.availability === "sold" && (
                          <div className="absolute inset-0 bg-white/10 pointer-events-none flex items-center justify-center"></div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                    <ImageIcon
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <p className="text-gray-500">No artworks found.</p>
                  </div>
                )}
              </div>
            ) : (
              // UPLOAD FORM
              <div className="max-w-4xl mx-auto">
                <button
                  onClick={() => setIsUploadMode(false)}
                  className="mb-6 text-sm text-gray-500 hover:text-[var(--color-primary)] flex items-center gap-1"
                >
                  &larr; Back to List
                </button>
                <div className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-slate-800">
                  <h2 className="text-2xl font-bold dark:text-white mb-8 border-b border-gray-100 dark:border-slate-800 pb-4">
                    Create New Listing
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="font-bold text-xs uppercase text-gray-500">
                          Title
                        </label>
                        <input
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          type="text"
                          className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border-none outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:text-white"
                          placeholder="Name of your masterpiece"
                        />
                      </div>
                      <div className="space-y-6">
                        {/* Sizes & Prices Section */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="font-bold text-xs uppercase text-gray-500">
                              Sizes & Prices
                            </label>
                            <button
                              onClick={addVariant}
                              className="text-[var(--color-primary)] text-xs font-bold hover:underline"
                            >
                              + Add Size
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {variants.map((v, idx) => (
                              <div
                                key={idx}
                                className="relative p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border border-gray-200 dark:border-slate-600"
                              >
                                <div className="flex gap-3 items-center">
                                  <div className="flex-1">
                                    <input
                                      placeholder="Size (e.g. A1)"
                                      value={v.size}
                                      onChange={(e) =>
                                        handleVariantChange(
                                          idx,
                                          "size",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full p-3 rounded-lg bg-white dark:bg-[var(--bg-primary)]/50 outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-bold text-lg dark:text-white"
                                    />
                                  </div>
                                  <div className="flex-1 relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold text-lg">
                                      $
                                    </span>
                                    <input
                                      placeholder="0"
                                      type="number"
                                      value={v.price}
                                      onChange={(e) =>
                                        handleVariantChange(
                                          idx,
                                          "price",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full pl-8 pr-4 py-3 rounded-lg bg-white dark:bg-[var(--bg-primary)]/50 outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-bold text-lg dark:text-white"
                                    />
                                  </div>
                                  {variants.length > 1 && (
                                    <button
                                      onClick={() => removeVariant(idx)}
                                      className="p-3 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  )}
                                </div>
                                {/* Display Preview of Size & Price */}
                                {v.size && v.price && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-600">
                                    <p className="text-xs text-gray-500 dark:text-[var(--text-muted)]">
                                      Preview:{" "}
                                      <span className="font-bold text-[var(--color-primary)]">
                                        {v.size}
                                      </span>{" "}
                                      -{" "}
                                      <span className="font-bold text-green-600">
                                        ${v.price}
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Category Section */}
                        <div className="space-y-2">
                          <label className="font-bold text-xs uppercase text-gray-500">
                            Category
                          </label>
                          <select
                            className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border-none outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:text-white"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                          >
                            <option value="">Select Category</option>
                            {artCategories.map((cat, idx) => (
                              <optgroup key={idx} label={cat.title}>
                                {cat.items.map((item) => (
                                  <option key={item} value={item}>
                                    {item}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-xs uppercase text-gray-500">
                          Description
                        </label>
                        <textarea
                          value={desc}
                          onChange={(e) => setDesc(e.target.value)}
                          rows={5}
                          className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border-none outline-none focus:ring-2 focus:ring-[var(--color-primary)] dark:text-white"
                          placeholder="Tell the story..."
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label
                        className={`block w-full aspect-square rounded-2xl border-2 border-dashed ${uploadPreview ? "border-[var(--color-primary)]" : "border-gray-300 dark:border-slate-700"} flex flex-col items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition`}
                      >
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileSelect}
                          accept="image/*,video/*"
                        />
                        {uploadPreview ? (
                          selectedFile?.type.startsWith("video") ? (
                            <video
                              src={uploadPreview}
                              controls
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            <img
                              src={uploadPreview}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          )
                        ) : (
                          <div className="text-center p-6">
                            <Upload
                              className="mx-auto text-[var(--text-muted)] mb-4"
                              size={48}
                            />
                            <p className="font-bold text-gray-500">
                              Upload Artwork
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                              Max 50MB
                            </p>
                          </div>
                        )}
                      </label>
                      <button
                        onClick={handlePublish}
                        disabled={uploading}
                        className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl shadow-lg hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? "Publishing..." : "Publish Listing"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {/* ... other tabs ... */}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-800"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-center dark:text-white mb-2">
                Delete Artwork?
              </h3>
              <p className="text-center text-gray-500 mb-6">
                Are you sure you want to delete this artwork? This action cannot
                be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 font-bold text-[var(--text-muted)] dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Orders View */}
        {activeTab === "orders" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-3xl font-bold dark:text-white mb-6">Orders</h1>
            {isLoadingOrders ? (
              <div className="text-center">Loading orders...</div>
            ) : (
              <div className="space-y-4">
                {orders.length > 0 ? (
                  orders.map((order: any) => (
                    <div
                      key={order._id}
                      className="bg-white dark:bg-[var(--bg-primary)]/50 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800"
                    >
                      <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800 pb-4 mb-4">
                        <div>
                          <p className="font-bold text-sm text-gray-500">
                            Order ID: {order._id}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === "delivered" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <div className="flex items-center gap-2">
                              {item.image && (
                                <img
                                  src={item.image}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <span className="dark:text-white">
                                {item.title}
                              </span>
                            </div>
                            <span className="font-bold text-[var(--color-primary)]">
                              ${item.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-gray-500">
                    No orders found.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Earnings View */}
        {activeTab === "earnings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-3xl font-bold dark:text-white mb-6">
              Earnings
            </h1>
            <div className="bg-white dark:bg-[var(--bg-primary)]/50 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-center">
              <h2 className="text-5xl font-bold text-[var(--color-primary)] mb-2">
                $
                {statsData?.totalEarnings
                  ? statsData.totalEarnings.toLocaleString()
                  : "0"}
              </h2>
              <p className="text-gray-500">Total Lifetime Earnings</p>
            </div>
          </motion.div>
        )}

        {/* Settings / Profile View */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl"
          >
            <h1 className="text-3xl font-bold dark:text-white mb-2">
              My Profile & Settings
            </h1>
            <p className="text-gray-500 mb-8">
              Manage your account details and verification proof.
            </p>

            <div className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-8">
              <div className="p-8 border-b border-gray-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold dark:text-white">
                    Profile Information
                  </h2>
                  {!isEditingProfile ? (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="flex items-center gap-2 text-[var(--color-primary)] font-bold hover:underline"
                    >
                      <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">
                        <Edit3 size={18} />
                      </div>{" "}
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 text-gray-500 font-bold hover:bg-white dark:hover:bg-slate-800 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-[var(--color-primary)] text-white font-bold rounded-lg shadow-lg hover:opacity-90"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 flex flex-col items-center justify-center mb-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-gray-200">
                          {profileForm.avatar ? (
                            <img
                              src={profileForm.avatar}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-500 text-white text-4xl font-bold">
                              {profileForm.name?.charAt(0) ||
                                user.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-3 bg-[var(--color-primary)] text-white rounded-full cursor-pointer shadow-lg hover:bg-[var(--color-primary)]/90 transition">
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            accept="image/*"
                            disabled={isAvatarUploading}
                          />
                          {isAvatarUploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload size={18} />
                          )}
                        </label>
                      </div>
                      <p className="mt-4 text-xs font-bold text-[var(--text-muted)] uppercase">
                        Change Profile Photo
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl bg-white dark:bg-[var(--card-bg)] border-none outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--text-main)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Email
                      </label>
                      <input
                        type="text"
                        value={user.email}
                        disabled
                        className="w-full p-3 rounded-xl bg-white dark:bg-[var(--bg-primary)] border-none outline-none text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.brandName}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            brandName: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl bg-white dark:bg-[var(--card-bg)] border-none outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--text-main)]"
                        placeholder="e.g. Studio Ghibli"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl bg-white dark:bg-[var(--card-bg)] border-none outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--text-main)]"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Bio
                      </label>
                      <textarea
                        rows={4}
                        value={profileForm.bio}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            bio: e.target.value,
                          })
                        }
                        className="w-full p-3 rounded-xl bg-white dark:bg-[var(--card-bg)] border-none outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--text-main)]"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 flex flex-col items-center justify-center mb-6">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-gray-200">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-500 text-white text-4xl font-bold">
                            {user.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Full Name
                      </label>
                      <p className="font-medium text-[var(--text-main)]">
                        {user.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Email
                      </label>
                      <p className="font-medium text-[var(--text-main)]">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Brand Name
                      </label>
                      <p className="font-medium text-[var(--text-main)]">
                        {user.brandName || "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Phone
                      </label>
                      <p className="font-medium text-[var(--text-main)]">
                        {user.phone || "-"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                        Bio
                      </label>
                      <p className="font-medium text-[var(--text-main)] whitespace-pre-wrap">
                        {user.bio || "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold dark:text-white">
                      Verification Portfolio
                    </h2>
                    <p className="text-sm text-gray-500">
                      Submit exactly 3 works as proof of skill. Adding a 4th
                      will remove the oldest one.
                    </p>
                  </div>
                </div>

                {user.portfolio && user.portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {user.portfolio.map((imgUrl, i) => (
                      <div
                        key={i}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700"
                      >
                        {imgUrl.endsWith(".mp4") || imgUrl.endsWith(".webm") ? (
                          <video
                            src={imgUrl}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={imgUrl}
                            alt={`Portfolio ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute top-2 right-2 bg-transparent/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10">
                          Proof #{i + 1}
                        </div>
                        <button
                          onClick={() => handleDeletePortfolio(imgUrl)}
                          className="absolute bottom-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-red-600"
                          title="Delete Image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    {/* Add New Proof Button */}
                    <label className="group aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-[var(--color-primary)] hover:bg-white dark:hover:bg-slate-800 transition flex flex-col items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleAddPortfolio}
                        accept="image/*,video/*"
                        disabled={isPortfolioUploading}
                      />
                      {isPortfolioUploading ? (
                        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Plus
                            className="text-[var(--text-muted)] group-hover:text-[var(--color-primary)] mb-2"
                            size={32}
                          />
                          <span className="text-xs font-bold text-gray-500 group-hover:text-[var(--color-primary)] uppercase">
                            Update
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-white dark:bg-[var(--card-bg)]/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                    <ImageIcon
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <p className="text-gray-500 mb-4">
                      No portfolio images found.
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg cursor-pointer hover:opacity-90 transition">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleAddPortfolio}
                        accept="image/*,video/*"
                        disabled={isPortfolioUploading}
                      />
                      {isPortfolioUploading ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Plus size={18} /> Update
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ArtistDashboard;
