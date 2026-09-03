import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Calendar,
  Edit3,
  Share2,
  ArrowLeft,
  Check,
  Truck,
  ShieldCheck,
  MoreHorizontal,
  Download,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ShareModal from "../components/ShareModal";
import { ArtworkService } from "../services/artwork.service";
import { SkeletonGrid } from "../components/SkeletonLoader";

const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, toggleWishlist } = useAuth();
  const { addToCart, cart } = useCart();

  // State for real data
  const [artwork, setArtwork] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<{
    size: string;
    price: number;
  } | null>(null);

  // Booking State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);

  // Share State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDownload = async () => {
    setIsMenuOpen(false);
    if (!id || user?.role === "admin" || user?.role === "artist") return;

    try {
      await ArtworkService.incrementDownload(id);

      try {
        // Attempt to fetch and download as blob
        const response = await fetch(selectedImage);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = artwork?.title ? `${artwork.title.replace(/\s+/g, "_")}.jpg` : "artwork.jpg";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (blobErr) {
        // Fallback for CORS issues: just open in new tab with download attribute
        const a = document.createElement("a");
        a.href = selectedImage;
        a.target = "_blank";
        a.download = artwork?.title ? `${artwork.title.replace(/\s+/g, "_")}.jpg` : "artwork.jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

    } catch (err) {
      console.error("Failed to process download", err);
    }
  };

  useEffect(() => {
    const fetchArtwork = async () => {
      if (!id) return;
      try {
        // We'll reuse the backend's getArtworksByIds or create a new endpoint for single artwork.
        // Since getArtworksByIds expects an array, we can use that for now.
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/artworks/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [id] }),
        });
        const data = await response.json();
        if (data.status === "ok" && data.artworks && data.artworks.length > 0) {
          const art = data.artworks[0];
          setArtwork(art);
          // Handle image URLs (local vs remote)
          const initialImage = art.images?.[0] || "";
          setSelectedImage(
            initialImage.startsWith("http") || initialImage.includes("/assets")
              ? initialImage
              : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${initialImage}`,
          );

          if (art.variants && art.variants.length > 0) {
            setSelectedVariant(art.variants[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch artwork details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id]);

  const handleWishlist = () => {
    if (!user) {
      window.dispatchEvent(new Event("open-login-modal"));
      return;
    }
    if (id) toggleWishlist(id);
  };

  const handleBuyNow = () => {
    if (!user) {
      window.dispatchEvent(new Event("open-login-modal"));
      return;
    }

    if (user.role === "admin") {
      alert("Admin accounts cannot make purchases.");
      return;
    }

    // Check if artist is trying to buy their own art
    if (
      user.role === "artist" &&
      (artwork.artistObjectId === user._id || artwork.artistId === user._id)
    ) {
      alert("You cannot purchase your own artwork.");
      return;
    }

    const isInCart = cart.some((item: any) => item._id === artwork._id);
    if (isInCart) {
      navigate("/order");
    } else {
      addToCart(artwork, selectedVariant);
      navigate("/order");
    }
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setIsBookingSuccess(true);
      setTimeout(() => {
        setIsBookingOpen(false);
        setIsBookingSuccess(false);
        setBookingDate("");
        setBookingSlot("");
        alert(`Booking Confirmed! ID: BK-${Math.floor(Math.random() * 10000)}`);
      }, 2000);
    }, 1000);
  };

  if (loading)
    return (
      <div className="min-h-screen pt-24 px-4 max-w-7xl mx-auto page-enter">
        <SkeletonGrid count={2} />
      </div>
    );
  if (!artwork)
    return (
      <div className="min-h-screen pt-24 text-center">Artwork not found.</div>
    );

  const isInWishlist = user?.wishlist?.includes(artwork._id);
  const displayedPrice = selectedVariant
    ? selectedVariant.price
    : artwork.price;

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent pt-24 pb-12 px-4 page-enter">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-200 hover:text-[var(--color-primary)] dark:hover:text-white mb-6 transition-colors font-bold"
        >
          <ArrowLeft size={20} /> Back to Gallery
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative group bg-gray-100">
              <img
                src={selectedImage}
                alt={artwork.title}
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              {/* Pinterest Style Action Bar on Hover */}
              <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                  <button
                    onClick={() => setIsShareOpen(true)}
                    className="p-3 bg-white/90 text-gray-800 hover:bg-gray-200 rounded-full shadow-lg transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                  <div className="relative pointer-events-auto">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-3 bg-white/90 text-gray-800 hover:bg-gray-200 rounded-full shadow-lg transition-colors"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute top-14 left-0 bg-white shadow-xl rounded-xl p-2 w-48 z-20">
                        {(!user || (user.role !== "admin" && user.role !== "artist")) && (
                          <button
                            onClick={handleDownload}
                            className="w-full text-left px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                          >
                            <Download size={16} /> Download image
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {user?.role !== "admin" && (
                  <button
                    onClick={handleWishlist}
                    className="pointer-events-auto px-6 py-3 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg"
                  >
                    {isInWishlist ? "Saved" : "Save"}
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {artwork.images?.map((img: string, idx: number) => {
                const imgUrl =
                  img.startsWith("http") || img.includes("/assets")
                    ? img
                    : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${img}`;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`w-24 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === imgUrl ? "border-[var(--color-primary)]" : "border-transparent"}`}
                  >
                    <img src={imgUrl} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Right: Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-main)] mb-2">
              {artwork.title}
            </h1>
            <div className="flex items-center gap-3 mb-6">
              <img
                src={
                  artwork.artistAvatar ||
                  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
                }
                className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800"
              />
              <div>
                <p className="text-sm text-gray-500">Created by</p>
                <div
                  onClick={() =>
                    navigate(
                      `/artist/${artwork.artistObjectId || artwork.artistId}`,
                    )
                  }
                  className="font-bold text-[var(--color-primary)] cursor-pointer hover:underline"
                >
                  {artwork.artistBrandName ||
                    artwork.artistName ||
                    "Unknown Artist"}
                </div>
              </div>
            </div>

            <div className="flex items-end gap-4 mb-8">
              <h2 className="text-4xl font-black dark:text-white tracking-tighter">
                ₹{displayedPrice?.toLocaleString()}
              </h2>
              {selectedVariant && (
                <span className="text-gray-500 text-lg mb-2">
                  / {selectedVariant.size}
                </span>
              )}
              <span className={`text-sm font-bold mb-2 flex items-center gap-1 ml-auto ${(artwork.stock === undefined || artwork.stock > 0) ? "text-green-500" : "text-red-500"}`}>
                {(artwork.stock === undefined || artwork.stock > 0) ? (
                  <><Check size={14} /> In Stock</>
                ) : (
                  <><AlertCircle size={14} /> Out of Stock</>
                )}
              </span>
            </div>

            {/* Variant Selector */}
            {artwork.variants && artwork.variants.length > 0 && (
              <div className="mb-8">
                <label className="table text-sm font-bold text-gray-500 mb-2 uppercase">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-3">
                  {artwork.variants.map((v: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-6 py-3 rounded-xl border-2 font-bold transition-all ${selectedVariant?.size === v.size
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                          : "border-gray-200 dark:border-slate-700 hover:border-[var(--color-primary)] text-gray-700 dark:text-gray-300"
                        }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description Tabs */}
            <div className="prose dark:prose-invert max-w-none text-[var(--text-muted)] dark:text-gray-300 mb-8">
              <p>{artwork.description || "No description available."}</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <strong>Category:</strong> {artwork.category}
                </li>
              </ul>
            </div>

            {/* Actions */}
            {(!user || user?.role === "customer") && (
              <div className="space-y-4">
                <button
                  onClick={handleBuyNow}
                  disabled={artwork.stock !== undefined && artwork.stock <= 0}
                  className={`w-full py-4 text-white text-lg font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                    (artwork.stock !== undefined && artwork.stock <= 0)
                      ? "bg-gray-400 cursor-not-allowed opacity-70"
                      : "bg-[var(--color-primary)] shadow-[var(--color-primary)]/20 hover:bg-[var(--color-primary-dark)] hover:-translate-y-1"
                  }`}
                >
                  <ShoppingBag size={22} />{" "}
                  {artwork.stock !== undefined && artwork.stock <= 0
                    ? "Out of Stock"
                    : "Buy Now"}
                  {selectedVariant ? ` (${selectedVariant.size})` : ""}
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      if (!user) {
                        window.dispatchEvent(new Event("open-login-modal"));
                        return;
                      }
                      setIsBookingOpen(true);
                    }}
                    className="py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar size={20} /> Book Viewing
                  </button>
                  <button
                    onClick={() => {
                      if (!user) {
                        window.dispatchEvent(new Event("open-login-modal"));
                        return;
                      }
                      navigate("/custom");
                    }}
                    className="py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 size={20} /> Custom Request
                  </button>
                </div>
              </div>
            )}

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white/50 dark:bg-[#184954]/20 rounded-2xl border border-[var(--color-primary)]/10">
                <Truck className="mx-auto mb-2 text-[var(--color-primary)]" />
                <p className="text-xs font-bold dark:text-gray-300">
                  Free Shipping
                </p>
              </div>
              <div className="p-4 bg-white/50 dark:bg-[#184954]/20 rounded-2xl border border-[var(--color-primary)]/10">
                <ShieldCheck className="mx-auto mb-2 text-[var(--color-primary)]" />
                <p className="text-xs font-bold dark:text-gray-300">
                  Auth. Certificate
                </p>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    window.dispatchEvent(new Event("open-login-modal"));
                    return;
                  }
                  setIsShareOpen(true);
                }}
                className="p-4 bg-white/50 dark:bg-[#184954]/20 rounded-2xl border border-[var(--color-primary)]/10 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all cursor-pointer group shadow-sm hover:shadow-xl"
              >
                <Share2 className="mx-auto mb-2 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                <p className="text-xs font-bold dark:text-gray-300 group-hover:text-[var(--color-primary)] transition-colors">
                  Share
                </p>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a1c22]/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-[#0a1c22] p-8 rounded-[2.5rem] shadow-3xl max-w-md w-full relative overflow-hidden border border-white/20 dark:border-white/10"
          >
            {isBookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2 dark:text-white">
                  Booking Requested!
                </h3>
                <p className="text-gray-500 mb-6">
                  The artist will confirm your slot shortly.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
                  <Calendar className="text-[var(--color-primary)]" /> Schedule
                  Viewing
                </h3>
                <form onSubmit={handleBookSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Date
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-[var(--color-primary)] outline-none dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Preferred Time Slot
                    </label>
                    <select
                      required
                      value={bookingSlot}
                      onChange={(e) => setBookingSlot(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 focus:ring-2 focus:ring-[var(--color-primary)] outline-none dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">Select a time</option>
                      <option value="morning">Morning (10 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (2 PM - 5 PM)</option>
                      <option value="evening">Evening (5 PM - 8 PM)</option>
                    </select>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsBookingOpen(false)}
                      className="flex-1 py-3 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors shadow-lg"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Share Modal */}
      {artwork && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          artwork={{
            _id: artwork._id,
            title: artwork.title,
            artistName: artwork.artistName,
            artistBrandName: artwork.artistBrandName,
            price: displayedPrice,
            images: artwork.images,
          }}
        />
      )}
    </div>
  );
};

export default ArtworkDetailPage;
