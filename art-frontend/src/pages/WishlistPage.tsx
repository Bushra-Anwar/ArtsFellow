import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ArrowRight, Sparkles, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ArtworkService } from "../services/artwork.service";
import { useCart } from "../context/CartContext";
import PaintStainsBackground from "../components/PaintStainsBackground";

const WishlistPage: React.FC = () => {
  const { user, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const { addToCart, cart, removeFromCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (user?.wishlist && user.wishlist.length > 0) {
        try {
          const data = await ArtworkService.getArtworksByIds(user.wishlist);
          if (data.status === "ok" && data.artworks) {
            setWishlistItems(data.artworks);
          }
        } catch (error) {
          console.error("Failed to fetch wishlist items", error);
        }
      } else {
        setWishlistItems([]);
      }
    };
    fetchWishlist();
  }, [user?.wishlist]);

  return (
    <div className="relative min-h-screen pt-24 pb-12 px-4 bg-transparent dark:bg-transparent overflow-hidden">
      <PaintStainsBackground opacity={0.3} interactive={false} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-[var(--color-primary)]/20"
          >
            <Heart size={14} className="fill-[var(--color-primary)]" />
            <span>Curated by You</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-serif-magic italic text-[var(--text-main)] dark:text-white mb-4 tracking-tight">
            My <span className="text-[var(--color-primary)]">Wishlist</span>
          </h1>
          <p className="text-xl text-[var(--text-muted)] max-w-2xl mx-auto font-medium tracking-wide">
            Your private collection of inspiration and potential masterpieces.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {wishlistItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-24 bg-white/40 dark:bg-[var(--bg-primary)]/40 backdrop-blur-xl rounded-[3rem] border border-white/20 dark:border-white/5 max-w-2xl mx-auto shadow-2xl"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <Heart size={96} className="text-gray-200 dark:text-gray-800" />
                <Sparkles
                  size={32}
                  className="absolute -top-2 -right-2 text-[var(--color-primary)] animate-pulse"
                />
              </div>
              <h3 className="text-3xl font-black text-gray-800 dark:text-white mb-6">
                Your wishlist is empty
              </h3>
              <p className="text-gray-500 mb-10 text-lg">
                Every great collection starts with a single discovery.
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--color-primary)] text-white font-black rounded-2xl hover:shadow-2xl transition-all uppercase tracking-widest"
              >
                Explore Artworks <ArrowRight size={20} />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {wishlistItems.map((art, idx) => (
                <motion.div
                  key={art._id || art.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-[var(--color-primary)]/10"
                  onClick={() => navigate(`/art/${art._id || art.id}`)}
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={
                        art.images?.[0]?.startsWith("http") ||
                          art.images?.[0]?.includes("/assets")
                          ? art.images[0]
                          : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${art.images?.[0]}`
                      }
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(art._id || art.id);
                      }}
                      className="absolute top-4 right-4 p-3 bg-white dark:bg-[var(--bg-primary)]/90 backdrop-blur-md rounded-2xl shadow-xl text-red-500 hover:scale-110 active:scale-95 transition-all z-20 overflow-hidden"
                    >
                      <Heart size={20} fill="currentColor" />
                    </button>
                  </div>
                  <div className="p-6 bg-white dark:bg-[#0d2a32] border-t border-[var(--color-primary)]/5">
                    <h3 className="font-black text-xl leading-tight truncate mb-1 text-slate-800 dark:text-white group-hover:text-[var(--color-primary)] transition-colors tracking-tight">
                      {art.title}
                    </h3>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-300 mb-6">
                      by {art.artist || "Unidentified Artist"}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-black text-2xl text-[var(--color-primary)] tracking-tight">
                        ₹{art.price.toLocaleString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const checkId = art._id || art.id;
                          const isInCart = cart.some((c: any) => c._id === checkId || String(c.variantId).startsWith(checkId));
                          if (isInCart) {
                            removeFromCart(checkId);
                          } else {
                            addToCart(art);
                          }
                        }}
                        className={`p-3 rounded-2xl transition-all shadow-xl hover:shadow-[var(--color-primary)]/50 ${cart.some((c: any) => c._id === (art._id || art.id) || String(c.variantId).startsWith(art._id || art.id))
                            ? "bg-green-500 text-white"
                            : "bg-[var(--color-primary)] text-white hover:bg-[#184954]"
                          }`}
                      >
                        {cart.some((c: any) => c._id === (art._id || art.id) || String(c.variantId).startsWith(art._id || art.id)) ? (
                          <Check size={20} />
                        ) : (
                          <ShoppingBag size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WishlistPage;
