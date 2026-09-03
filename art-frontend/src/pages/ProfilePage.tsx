import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ArtistService } from "../services/artist.service";
import { Link } from "react-router-dom";
import { RatingService } from "../services/rating.service";
import PaintStainsBackground from "../components/PaintStainsBackground";
import {
  User,
  Package,
  Heart,
  LogOut,
  Camera,
  X,
  Sparkles,
  RefreshCw,
  Check,
} from "lucide-react";

const ProfilePage = () => {
  const { user, logout, updateProfile } = useAuth();
  const [artists, setArtists] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [ratedArtCount, setRatedArtCount] = useState(0);
  const [recentRatedArtwork, setRecentRatedArtwork] = useState<string | null>(null);

  useEffect(() => {
    fetchArtists();
    if (user && user.role !== "admin") {
      fetchOrders();
      fetchRatings();
    }
  }, [user]);

  const fetchRatings = async () => {
    if (!user) return;
    try {
      const res = await RatingService.getCustomerRatings(user._id);
      if (res.status === "ok") {
        setRatedArtCount(res.ratings.length);
        if (res.ratings.length > 0) {
          setRecentRatedArtwork(res.ratings[0].imageUrl || null);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("art_token")}`,
        },
      });
      const data = await res.json();
      if (data.status === "ok") setOrders(data.orders);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchArtists = async () => {
    try {
      const res: any = await ArtistService.getAllArtists();
      if (res.status === "ok") setArtists(res.artists);
    } catch (e) {
      console.error(e);
    }
  };

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Mock handlers for new features
  const handleCamera = () => {
    // In a real app, this would trigger camera access.
    // For web, we can trigger the file input with capture="user" (mobile) or just open file picker
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setShowPhotoModal(false);
  };

  const handleGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setShowPhotoModal(false);
  };

  const [showAvatarGen, setShowAvatarGen] = useState(false);
  const [genStyle, setGenStyle] = useState("adventurer"); // Pookie default
  const [genEmotion, setGenEmotion] = useState("happy");
  const [genSeed, setGenSeed] = useState("pookie");

  // Dicebear API styles mapping
  const avatarStyles: any = {
    adventurer: "Pookie (Cute)",
    "fun-emoji": "Mascot (Hello Kitty Vibe)",
    micah: "Modern",
    avataaars: "Classic",
    croodles: "Sketchy (Dark)",
    notionists: "Minimalist",
    "open-peeps": "Hand Drawn",
  };

  // Helper to get params for emotions
  const getEmotionParams = (style: string, emotion: string) => {
    // Default params
    let params = "";

    // Map emotions to standardized API features if possible
    // This is a simplified mapping for demonstration
    switch (style) {
      case "adventurer": // Supports mouth, eyebrows, eyes
        if (emotion === "happy")
          params = "&mouth=smile,laugh&eyebrows=variant02";
        if (emotion === "cool") params = "&mouth=smirk&eyebrows=variant07"; // Sunglasses not guaranteed, smirk works
        if (emotion === "sleepy") params = "&eyes=variant16,variant22"; // Sleepy eyes
        if (emotion === "angry") params = "&mouth=pout&eyebrows=variant11";
        if (emotion === "surprised")
          params = "&mouth=variant14&eyebrows=variant09";
        if (emotion === "pookie") params = "&mouth=variant13&eyes=variant12"; // Cute combo
        break;
      case "micah": // Supports mouth, ears, eyes, hair, nose
        if (emotion === "happy") params = "&mouth=laughing,smile";
        if (emotion === "cool") params = "&mouth=smirk";
        if (emotion === "angry") params = "&mouth=pucker";
        if (emotion === "surprised") params = "&mouth=surprised";
        break;
      case "avataaars": // Classic
        if (emotion === "happy") params = "&mouth=smile&eyebrow=default";
        if (emotion === "angry") params = "&mouth=grimace&eyebrow=angry";
        if (emotion === "sad") params = "&mouth=sad&eyebrow=sad";
        if (emotion === "surprised")
          params = "&mouth=scream&eyebrow=raisedExcited";
        break;
      case "croodles": // Sketchy
        if (emotion === "happy") params = "&mouth=smile,happy";
        if (emotion === "angry") params = "&mouth=angry";
        if (emotion === "surprised") params = "&mouth=surprised";
        break;
      case "fun-emoji": // Mascot / Emoji style
        if (emotion === "happy")
          params = "&mouth=smile,smileLol&eyes=cute,stars";
        if (emotion === "cool") params = "&mouth=lilSmile&eyes=shades,glasses";
        if (emotion === "sleepy") params = "&mouth=plain&eyes=sleep";
        if (emotion === "angry") params = "&mouth=pissed&eyes=pissed";
        if (emotion === "surprised") params = "&mouth=shout&eyes=plain";
        if (emotion === "pookie") params = "&mouth=kiss,tongue&eyes=love,wink";
        break;
      default:
        break;
    }
    return params;
  };

  // Generate URL dynamically
  const getAvatarUrl = () => {
    // Use seed for identity, append emotion params
    const emotionParams = getEmotionParams(genStyle, genEmotion);
    return `https://api.dicebear.com/9.x/${genStyle}/svg?seed=${genSeed}${emotionParams}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  const handleSaveAvatar = () => {
    const url = getAvatarUrl();
    updateProfile({ avatar: url });
    setShowAvatarGen(false);
    setShowPhotoModal(false);
    alert("New Avatar Equiped!");
  };

  const handleAvatarSelect = () => {
    setGenStyle("adventurer");
    setShowAvatarGen(true);
    // Keep photo modal open or close it? Let's keep context clean, maybe close photo modal
    // setShowPhotoModal(false);
  };

  const handleAiGenerate = () => {
    setGenStyle("notionists"); // Or random
    setShowAvatarGen(true);
  };

  const handleInstagramImport = () => {
    alert("Instagram import coming soon!");
    setShowPhotoModal(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await uploadRes.json();

      if (data.status === "ok" && data.url) {
        updateProfile({ avatar: data.url });
        alert("Profile photo updated!");
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  if (!user)
    return (
      <div className="pt-32 text-center">
        Please login to view your profile.
      </div>
    );

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 transition-colors duration-500 relative overflow-hidden page-enter">
      <PaintStainsBackground opacity={0.3} interactive={false} />
      <div className="max-w-7xl mx-auto relative z-10">
      {/* Profile Header Card */}
      <div className="relative mb-24">
        {/* Banner Background */}
        <div className="h-48 md:h-64 rounded-3xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 overflow-hidden shadow-lg relative">
          {recentRatedArtwork && (
            <img src={recentRatedArtwork.startsWith("http") ? recentRatedArtwork : `http://localhost:5005${recentRatedArtwork}`} alt="Banner" className="w-full h-full object-cover rounded-3xl absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
        </div>

        {/* Profile Content */}
        <div className="absolute top-32 md:top-44 left-0 right-0 px-6 md:px-10 flex flex-col md:flex-row items-end gap-6">
          {/* Avatar Group */}
          <div className="group relative shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1.5 bg-white dark:bg-[var(--bg-primary)]/50 shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 relative">
                {user!.avatar ? (
                  <img
                    src={user!.avatar}
                    alt={user!.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--color-primary)] text-white text-4xl font-bold">
                    {user!.name?.[0]?.toUpperCase()}
                  </div>
                )}

                {/* Edit Overlay */}
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute inset-0 bg-transparent/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                >
                  <Camera
                    className="text-white drop-shadow-md scale-90 group-hover:scale-100 transition-transform"
                    size={32}
                  />
                </button>
              </div>
            </div>

            {/* Upload Spinner */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-full z-10">
                <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Hidden Input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
          </div>

          {/* User Info */}
          <div className="flex-1 pb-4 md:pb-6 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight leading-tight mb-1">
              {user!.name}
            </h1>
            <p className="text-gray-500 dark:text-[var(--text-muted)] font-medium text-lg flex items-center justify-center md:justify-start gap-2">
              {user!.email}
              {user!.role === "artist" && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                    user!.artistStatus === "approved" || user!.isArtistVerified
                      ? "bg-green-100 text-green-700"
                      : user!.artistStatus === "rejected"
                        ? "bg-red-100 text-red-700"
                        : user!.artistStatus === "disabled"
                          ? "bg-white text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {user!.artistStatus ||
                    (user!.isArtistVerified ? "Artist" : "Pending Artist")}
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pb-4 md:pb-6 flex flex-wrap gap-3 justify-center md:justify-end">
            {user!.role === "customer" && (
              <>
                <Link
                  to="/orders"
                  className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <Package size={20} className="text-blue-500" />
                  <span>My Orders</span>
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-2xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <Heart size={20} className="text-rose-500" />
                  <span>Wishlist</span>
                </Link>
              </>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all hover:shadow-sm"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent/60 backdrop-blur-sm"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">
                Edit Profile Photo
              </h3>
              <button onClick={() => setShowPhotoModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCamera}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
              >
                <Camera size={24} />
                <span className="text-sm font-bold">Camera</span>
              </button>

              <button
                onClick={handleGallery}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition"
              >
                <Package size={24} />
                <span className="text-sm font-bold">Gallery</span>
              </button>

              <button
                onClick={handleAvatarSelect}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition"
              >
                <User size={24} />
                <span className="text-sm font-bold">Avatars</span>
              </button>

              <button
                onClick={handleInstagramImport}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 hover:bg-pink-100 transition"
              >
                <Heart size={24} />
                <span className="text-sm font-bold">Instagram</span>
              </button>

              <button
                onClick={handleAiGenerate}
                className="col-span-2 flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white hover:opacity-90 transition shadow-lg"
              >
                <span className="text-xl">✨</span>
                <span className="text-sm font-bold">Generate with AI</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showAvatarGen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-transparent/70 backdrop-blur-md"
          onClick={() => setShowAvatarGen(false)}
        >
          <div
            className="bg-white dark:bg-[var(--card-bg)] rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-300 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAvatarGen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold dark:text-white flex items-center justify-center gap-2">
                <Sparkles className="text-yellow-400 fill-yellow-400" /> AI
                Avatar Studio
              </h3>
              <p className="text-gray-500 text-sm">
                Create your perfect Pookie avatar!
              </p>
            </div>

            {/* Preview */}
            <div className="w-48 h-48 mx-auto bg-white dark:bg-[var(--bg-primary)] rounded-full border-8 border-white dark:border-slate-700 shadow-xl overflow-hidden mb-8 relative group">
              <img
                src={getAvatarUrl()}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setGenSeed(Math.random().toString(36))}
                className="absolute inset-0 bg-transparent/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <RefreshCw className="text-white drop-shadow-md" size={40} />
              </button>
            </div>

            {/* Controls */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                  Avatar Style
                </label>
                <div className="flex gap-2 p-1 bg-white dark:bg-[var(--bg-primary)] rounded-xl overflow-x-auto">
                  {Object.entries(avatarStyles).map(([key, label]: any) => (
                    <button
                      key={key}
                      onClick={() => setGenStyle(key)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${genStyle === key ? "bg-white dark:bg-slate-700 shadow-sm text-[var(--color-primary)]" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                  Vibe & Emotion
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "Happy",
                    "Cool",
                    "Sleepy",
                    "Pookie",
                    "Angry",
                    "Surprised",
                  ].map((emotion) => (
                    <button
                      key={emotion}
                      onClick={() => setGenEmotion(emotion.toLowerCase())}
                      className={`py-2 rounded-xl text-sm font-bold border-2 transition ${genEmotion === emotion.toLowerCase() ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]" : "border-transparent bg-white dark:bg-[var(--bg-primary)] text-gray-500 hover:bg-white dark:hover:bg-slate-700"}`}
                    >
                      {emotion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveAvatar}
              className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Check size={20} /> Equip Avatar
            </button>
          </div>
        </div>
      )}

      {/* Profile Content Body */}
      {user!.role === "customer" && (
        <div className="mt-12 space-y-10">
          {/* Customer Personal Dashboard */}
          <div className="bg-white dark:bg-white rounded-3xl p-8 border border-gray-100 dark:border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-primary)] to-purple-400 opacity-5 rounded-full blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="border-b border-gray-100 dark:border-slate-800 pb-5 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-900 flex items-center gap-2 relative z-10">
                <Package className="text-[var(--color-primary)]" size={24} />
                My Purchases Dashboard
              </h2>
              <p className="text-gray-500 mt-1 relative z-10">
                Tracking your beautiful collection
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 relative z-10">
              <div className="p-5 bg-white dark:bg-white rounded-2xl border border-gray-100 dark:border-gray-200">
                <p className="text-sm text-gray-500 font-bold uppercase mb-1">
                  Total Ordered
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-slate-900">
                  {orders.reduce((acc, curr) => acc + curr.items.length, 0)}{" "}
                  <span className="text-sm text-[var(--text-muted)] font-normal">
                    items
                  </span>
                </p>
              </div>
              <div className="p-5 bg-white dark:bg-white rounded-2xl border border-gray-100 dark:border-gray-200">
                <p className="text-sm text-gray-500 font-bold uppercase mb-1">
                  Total Spent
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-900 truncate mt-2">
                  ₹
                  {orders
                    .reduce((acc, curr) => acc + curr.totalAmount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="p-5 bg-white dark:bg-white rounded-2xl border border-gray-100 dark:border-gray-200">
                <p className="text-sm text-gray-500 font-bold uppercase mb-1">
                  Orders Count
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-slate-900 mt-2">
                  {orders.length}
                </p>
              </div>
              <div className="p-5 bg-white dark:bg-white rounded-2xl border border-gray-100 dark:border-gray-200">
                <p className="text-sm text-gray-500 font-bold uppercase mb-1">
                  Wishlist
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-slate-900 mt-2">
                  {user.wishlist?.length || 0}
                </p>
              </div>
              <div className="p-5 bg-white dark:bg-white rounded-2xl border border-gray-100 dark:border-gray-200">
                <p className="text-sm text-gray-500 font-bold uppercase mb-1">
                  Ratings Given
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-slate-900 mt-2">
                  {ratedArtCount}
                </p>
              </div>
              <div className="p-5 bg-white dark:bg-white rounded-2xl border border-gray-100 dark:border-gray-200">
                <p className="text-sm text-gray-500 font-bold uppercase mb-1">
                  Latest Order
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-900 mt-4 truncate">
                  {orders.length > 0
                    ? new Date(orders[0].createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Recent Transactions Snippet */}
            {orders.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg dark:text-gray-200">
                  Recent Transactions
                </h3>
                <div className="space-y-3">
                  {orders.slice(0, 3).map((ord, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-[var(--card-bg)]/50"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="h-12 w-12 rounded-lg bg-white dark:bg-[var(--bg-primary)]/50 overflow-hidden shrink-0">
                          <img
                            src={ord.items[0]?.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-slate-900">
                            {ord.items[0]?.title}{" "}
                            {ord.items.length > 1
                              ? `+ ${ord.items.length - 1} more`
                              : ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(ord.createdAt).toLocaleDateString()} •{" "}
                            <span
                              className={`uppercase font-bold ${ord.status === "delivered" ? "text-green-500" : "text-blue-500"}`}
                            >
                              {ord.status}
                            </span>
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-slate-900 dark:text-slate-900">
                        ₹{ord.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {orders.length > 3 && (
                    <Link
                      to="/orders"
                      className="block text-center text-sm font-bold text-[var(--color-primary)] hover:underline mt-2"
                    >
                      View All Transactions
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-100 dark:border-slate-800 pb-5">
            <div>
              <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                <Sparkles
                  className="text-yellow-500 fill-yellow-500"
                  size={24}
                />
                Discover Artists
              </h2>
              <p className="text-gray-500 mt-1">
                Explore talented creators trending this week
              </p>
            </div>
            <Link
              to="/artists"
              className="text-[var(--color-primary)] font-bold hover:translate-x-1 transition-transform inline-flex items-center gap-1 bg-white dark:bg-[var(--card-bg)]/50 px-4 py-2 rounded-xl"
            >
              View All Artists &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {artists.length > 0 ? (
              artists.slice(0, 8).map((artist) => (
                <Link
                  key={artist._id}
                  to={`/artist/${artist._id}`}
                  className="group bg-white dark:bg-white rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-slate-700 relative">
                      {artist.portfolio?.[0] ? (
                        <img
                          src={artist.portfolio[0]}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={artist.name}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white dark:bg-[var(--card-bg)] text-[var(--text-muted)] font-bold text-xl">
                          {artist.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-900 group-hover:text-[var(--color-primary)] transition-colors truncate">
                        {artist.brandName || artist.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 uppercase tracking-widest font-black truncate">
                        {artist.artStyles?.[0] || "Digital Artist"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="inline-block p-4 rounded-full bg-white dark:bg-[var(--card-bg)] mb-4 animate-pulse">
                  <User size={32} className="text-gray-300" />
                </div>
                <p className="text-[var(--text-muted)] font-medium">
                  Loading amazing artists...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ProfilePage;
