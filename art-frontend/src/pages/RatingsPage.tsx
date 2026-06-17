import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Award, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { ArtistService } from "../services/artist.service";
import { RatingService } from "../services/rating.service";

const RatingsPage: React.FC = () => {
  const { user } = useAuth();
  const [ratingPeriod, setRatingPeriod] = useState("week");

  const [customerRatings, setCustomerRatings] = useState<any[]>([]);
  const [artistRatings, setArtistRatings] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res: any = await ArtistService.getAllArtists();
        if (res.status === "ok") {
          // Sort artists by rating or totalSales (which might be undefined, so fallback to index based for now if needed)
          // For now just set the artists
          setArtists(res.artists);
        }
      } catch (e) {
        console.error(e);
      }
    };
    const fetchRatings = async () => {
      if (!user) return;
      try {
        if (user.role === "customer") {
          const res = await RatingService.getCustomerRatings(user._id);
          if (res.status === "ok") setCustomerRatings(res.ratings);
        } else if (user.role === "artist") {
          const res = await RatingService.getArtistRatings(user._id);
          if (res.status === "ok") setArtistRatings(res.ratings);
        }
      } catch (e) { console.error(e); }
    };

    fetchArtists();
    fetchRatings();
  }, [user]);

  // Sort artists by revenue first, then by rating
  const artistLeaderboard = [...artists].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0) || (b.rating || 0) - (a.rating || 0));


  const renderCustomerView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-500 dark:text-[var(--text-muted)]">
        <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs uppercase font-black text-gray-700 dark:text-gray-300">
          <tr>
            <th className="px-6 py-4">Artwork Info</th>
            <th className="px-6 py-4 text-center">Rating Given</th>
            <th className="px-6 py-4 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
          {customerRatings.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="px-6 py-4 font-bold text-[var(--text-main)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    {item.imageUrl ? (
                      <img src={item.imageUrl.startsWith("http") ? item.imageUrl : `http://localhost:5005${item.imageUrl}`} alt={item.artworkName} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    {item.artworkName || "Deleted Artwork"} <br />
                    <span className="text-xs font-normal text-gray-500">by {item.artistName || "Unknown Artist"}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-1 font-bold text-gray-900 dark:text-white">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className={i < (item.rating || 0) ? "fill-yellow-400 text-yellow-500" : "fill-gray-200 text-gray-300 dark:fill-gray-700 dark:text-gray-600"} 
                    />
                  ))}
                  <span className="ml-2 mt-0.5 text-sm font-black text-slate-500">
                    {item.rating ? `${item.rating}/5` : "Unrated"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right text-gray-500 font-medium">
                {new Date(item.date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAdminView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500 dark:text-[var(--text-muted)]">
          <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs uppercase font-black text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Artist Name</th>
              <th className="px-6 py-4 text-center">Artworks Sold</th>
              <th className="px-6 py-4 text-center">Total Revenue</th>
              <th className="px-6 py-4 text-right">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {artistLeaderboard.map((artist, idx) => {
               const sold = artist.totalSales || 0;
               const rev = artist.totalRevenue || 0;
               const rating = (artist.rating || 0).toFixed(1);

               return (
                <tr
                  key={artist._id || idx}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-black text-lg">
                    {idx === 0 ? <Award className="text-yellow-500 inline mr-1" size={24}/> : null}
                    {idx === 1 ? <Award className="text-gray-400 inline mr-1" size={24}/> : null}
                    {idx === 2 ? <Award className="text-amber-700 inline mr-1" size={24}/> : null}
                    <span className={idx < 3 ? "text-gray-900 dark:text-white" : "text-gray-400 ml-6"}>#{idx + 1}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                    <Link to={`/artist/${artist._id}`} className="hover:text-[var(--color-primary)] transition-colors hover:underline">
                      {artist.name}
                    </Link>
                  </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold px-3 py-1 rounded-full">
                        {sold}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-green-600 dark:text-green-400">
                      ₹{rev.toLocaleString()}
                    </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 font-bold text-gray-900 dark:text-white">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < Math.round(Number(rating) || 0) ? "fill-yellow-400 text-yellow-500 opacity-90" : "fill-gray-200 text-gray-300 dark:fill-gray-700 opacity-50"} 
                        />
                      ))}
                      <span className="ml-2 font-black text-lg text-[var(--color-primary)]">
                        {rating}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderArtistView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500 dark:text-[var(--text-muted)]">
          <thead className="bg-gray-50 dark:bg-slate-800/50 text-xs uppercase font-black text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-6 py-4">Artwork Name</th>
              <th className="px-6 py-4 text-center">Rating Received</th>
              <th className="px-6 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {artistRatings.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-[var(--text-main)]">
                  {item.artworkName}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1 font-bold text-gray-900 dark:text-white">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < (item.rating || 0) ? "fill-yellow-400 text-yellow-500" : "fill-gray-200 text-gray-300 dark:fill-gray-700 dark:text-gray-600"} 
                      />
                    ))}
                    <span className="ml-2 mt-0.5 text-sm font-black text-slate-500">
                      {item.rating ? `${item.rating}/5` : "Unrated"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-gray-500 font-medium">
                  {new Date(item.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent pt-32 px-6 pb-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
        >
            <h1 className="text-4xl md:text-5xl font-serif-magic italic font-black text-[var(--text-main)] dark:text-white mb-4 tracking-tight leading-tight">
              {user?.role === "customer" ? (
                <>My <span className="text-[var(--color-primary)]">Ratings</span></>
              ) : (
                <>Artist <span className="text-[var(--color-primary)]">Ratings</span></>
              )}
            </h1>
            <p className="text-sm text-[var(--text-muted)] font-medium tracking-[0.2em] uppercase">
              {user?.role === "customer" ? `You have rated ${customerRatings.length} artworks` : user?.role === "artist" ? `Your artworks have received ${artistRatings.length} ratings` : "Top Selling Artists"}
            </p>
        </motion.div>

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-[var(--color-primary)]/5"
        >
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-primary)] flex items-center gap-2">
                  <Star className="fill-[var(--color-primary)]" /> {user?.role === "customer" ? "Rating History" : user?.role === "artist" ? "Received Ratings" : "Leaderboard"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {user?.role === "customer" ? "Artworks you've shared your feedback on" : user?.role === "artist" ? "Feedback and ratings for your artworks" : "Artists ranked by ratings and sales"}
                </p>
              </div>

              {user?.role === "admin" && (
                <div className="flex items-center gap-2">
                  <select
                    className="bg-white dark:bg-[var(--card-bg)] border-gray-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm px-4 py-2 text-[var(--text-main)] outline-none"
                    value={ratingPeriod}
                    onChange={(e) => setRatingPeriod(e.target.value)}
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              )}
            </div>

            {user?.role === "customer" ? renderCustomerView() : user?.role === "artist" ? renderArtistView() : renderAdminView()}
            
        </motion.div>
      </div>
    </div>
  );
};

export default RatingsPage;
