import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Palette, Star } from "lucide-react";
import PaintFlowBackground from "../components/PaintFlowBackground";

const ArtistsPage: React.FC = () => {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/artist`);
        const data = await res.json();
        if (data.status === "ok") {
          setArtists(data.artists);
        }
      } catch (err) {
        console.error("Failed to fetch artists", err);
      }
    };
    fetchArtists();
  }, []);

  const filteredArtists = artists.filter(
    (artist) =>
      artist.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.brandName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="relative min-h-screen bg-transparent dark:bg-transparent pt-24 px-6 pb-12 overflow-hidden">
      <PaintFlowBackground color="var(--color-primary)" opacity={0.15} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full text-sm font-bold mb-4">
            <Palette size={16} />
            <span>Curated Creators</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[var(--text-main)] mb-6 tracking-tight">
            Meet Our{" "}
            <span className="text-[var(--color-primary)]">Artists</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Discover the visionaries behind the most captivating artworks in our
            collection.
          </p>
        </motion.div>

        <div className="max-w-xl mx-auto mb-16">
          <div className="relative group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors"
              size={22}
            />
            <input
              type="text"
              placeholder="Search by name or style..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-[var(--bg-primary)]/40 backdrop-blur-xl border border-gray-100 dark:border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[var(--color-primary)]/20 shadow-xl shadow-gray-200/20 dark:shadow-none text-lg text-[var(--text-main)] placeholder-gray-400 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredArtists.map((artist, idx) => (
            <motion.div
              key={artist._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              onClick={() => navigate(`/artist/${artist._id}`)}
              className="group relative bg-white/60 dark:bg-[var(--bg-primary)]/40 backdrop-blur-md p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-white/40 dark:border-white/5 cursor-pointer text-center transition-all duration-500 overflow-hidden"
            >
              {/* Decorative Background Blob */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-primary)]/20 transition-all duration-700" />

              <div className="relative z-10">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)] to-cyan-400 rounded-full animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-1">
                    <div className="w-full h-full bg-white dark:bg-[var(--bg-primary)] rounded-full" />
                  </div>
                  <div className="absolute inset-1 rounded-full overflow-hidden bg-white ring-4 ring-white dark:ring-[var(--card-bg)] shadow-inner">
                    <img
                      src={
                        artist.avatar ||
                        "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
                      }
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
                    <Star size={16} className="text-white fill-white" />
                  </div>
                </div>

                <h3 className="font-black text-2xl text-[var(--text-main)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                  {artist.brandName || artist.name}
                </h3>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {(artist.artStyles || ["Artist"])
                    .slice(0, 2)
                    .map((style: string) => (
                      <span
                        key={style}
                        className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-white dark:bg-white/5 rounded-full text-gray-500 dark:text-[var(--text-muted)]"
                      >
                        {style}
                      </span>
                    ))}
                </div>
                <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-6 h-10 leading-relaxed">
                  {artist.bio || "Crafting emotions through colors and shapes."}
                </p>

                <button className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-sm font-black tracking-widest uppercase group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300 shadow-lg shadow-gray-200 dark:shadow-none">
                  View Portfolio
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
    </div>
  );
};

export default ArtistsPage;
