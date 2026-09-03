import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import {
  Shield,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Filter,
} from "lucide-react";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { openChat } = useChat();
  const [activeTab, setActiveTab] = useState<
    "overview" | "approvals" | "artists" | "artworks"
  >("overview");

  // States
  const [artists, setArtists] = useState<any[]>([]);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [approvalFilter, setApprovalFilter] = useState("pending");
  const [artistFilter] = useState("all");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalArtists: 0,
    pendingArtists: 0,
    totalSales: 0,
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (user?.role === "admin") {
      if (activeTab === "overview") fetchStats();
      else if (activeTab === "approvals") fetchArtists(approvalFilter);
      else if (activeTab === "artists") fetchArtists(artistFilter);
      else if (activeTab === "artworks") fetchAllArtworks();
    }
  }, [user, activeTab, approvalFilter, artistFilter]);

  const fetchAllArtworks = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/artworks`);
      const data = await res.json();
      if (data.status === "ok") {
        // Sort by downloads priority
        const sorted = data.artworks.sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0));
        setArtworks(sorted);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/admin/stats`);
      const data = await res.json();
      if (data.status === "ok") setStats(data.stats);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchArtists = async (status: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/admin/artists?status=${status}`);
      const data = await res.json();
      if (data.status === "ok") setArtists(data.artists);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerify = async (
    artistId: string,
    action: "approve" | "reject" | "disable" | "enable",
    silent: boolean = false,
  ) => {
    if (!silent && !confirm(`Are you sure you want to ${action} this artist?`))
      return;

    // Optimistic Update
    const previousArtists = [...artists];
    const newStatus =
      action === "approve" || action === "enable"
        ? "approved"
        : action === "disable"
          ? "disabled"
          : "rejected";
    const isVerified = action === "approve" || action === "enable";

    setArtists((prev) =>
      prev.map((a) =>
        a._id === artistId
          ? { ...a, artistStatus: newStatus, isArtistVerified: isVerified }
          : a,
      ),
    );

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/admin/verify-artist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, action }),
      });
      const data = await res.json();

      if (data.status === "ok") {
        showNotification(data.message || `Artist ${action}d successfully`);
        if (activeTab === "approvals") fetchArtists(approvalFilter);
        else fetchArtists(artistFilter);
      } else {
        setArtists(previousArtists);
        showNotification(data.message || "Action failed", "error");
      }
    } catch (e) {
      setArtists(previousArtists);
      showNotification("Network error", "error");
    }
  };

  const handleToggleStatus = async (artist: any) => {
    const newAction =
      artist.artistStatus === "approved" || artist.isArtistVerified
        ? "disable"
        : "enable";
    handleVerify(artist._id, newAction, true);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="p-10 text-center text-red-500 font-bold mt-20">
        Access Denied. Admin privileges required.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent pt-24 px-6 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-white flex items-center gap-3">
              <Shield className="text-[var(--color-primary)]" size={32} /> Admin
              Command Center
            </h1>
            <p className="text-gray-500">Platform Overview & Management</p>
          </div>
          <div className="bg-white dark:bg-[var(--bg-primary)]/50 p-1 rounded-xl border border-gray-200 dark:border-slate-800 flex">
            {[
              { id: "overview", label: "Overview" },
              { id: "approvals", label: "Approvals" },
              { id: "artists", label: "Artists" },
              { id: "artworks", label: "Artworks Priority" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab.id ? "bg-[var(--color-primary)] text-white shadow-md" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  label: "Total Revenue",
                  value: `$${stats.totalRevenue.toLocaleString()}`,
                  icon: DollarSign,
                  color: "text-green-500",
                  bg: "bg-green-100 dark:bg-green-900/20",
                },
                {
                  label: "Total Artists",
                  value: stats.totalArtists,
                  icon: Users,
                  color: "text-blue-500",
                  bg: "bg-blue-100 dark:bg-blue-900/20",
                },
                {
                  label: "Pending Artists",
                  value: stats.pendingArtists,
                  icon: AlertCircle,
                  color: "text-orange-500",
                  bg: "bg-orange-100 dark:bg-orange-900/20",
                },
                {
                  label: "Artworks Sold",
                  value: stats.totalSales,
                  icon: TrendingUp,
                  color: "text-purple-500",
                  bg: "bg-purple-100 dark:bg-purple-900/20",
                },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-[var(--bg-primary)]/50 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold dark:text-white mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}



        {(activeTab === "approvals" || activeTab === "artists") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold dark:text-white capitalize">
                {activeTab === "approvals" ? "Approvals" : "Artists"}
              </h2>

              <div className="flex items-center gap-2">
                {activeTab === "approvals" && (
                  <>
                    <Filter size={18} className="text-[var(--text-muted)]" />
                    <select
                      className="bg-white dark:bg-[var(--card-bg)] border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={approvalFilter}
                      onChange={(e) => setApprovalFilter(e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="all">All</option>
                    </select>
                  </>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-[var(--text-muted)]">
                <thead className="bg-white dark:bg-[var(--card-bg)] text-xs uppercase font-bold text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-4">Artist Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Applied Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {artists.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10">
                        No artists found for this filter.
                      </td>
                    </tr>
                  ) : (
                    artists.map((artist) => (
                      <tr
                        key={artist._id}
                        className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-[var(--text-main)]">
                          {artist.name} <br />
                          <span className="text-xs font-normal text-gray-500">
                            {artist.email}
                          </span>
                          <a
                            href={`/artist/${artist._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block mt-1 text-xs text-[var(--color-primary)] hover:underline"
                          >
                            View Profile
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              artist.artistStatus === "approved" ||
                              artist.isArtistVerified
                                ? "bg-green-100 text-green-600"
                                : artist.artistStatus === "rejected"
                                  ? "bg-red-100 text-red-600"
                                  : artist.artistStatus === "disabled"
                                    ? "bg-white text-[var(--text-muted)]"
                                    : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            {artist.artistStatus ||
                              (artist.isArtistVerified
                                ? "approved"
                                : "pending")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {new Date(artist.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          {activeTab === "artists" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  openChat({
                                    id: artist._id,
                                    name: artist.name,
                                    avatar: artist.avatar || "",
                                    role: artist.role,
                                  })
                                }
                                className="p-2 text-gray-500 hover:bg-white hover:text-[var(--color-primary)] rounded-lg transition-colors"
                                title="Message Artist"
                              >
                                <MessageSquare size={20} />
                              </button>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={
                                    artist.artistStatus === "approved" ||
                                    artist.isArtistVerified
                                  }
                                  onChange={() => handleToggleStatus(artist)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                                <span className="ml-2 text-xs font-medium text-gray-900 dark:text-gray-300">
                                  {artist.artistStatus === "approved" ||
                                  artist.isArtistVerified
                                    ? "Enable"
                                    : "Disable"}
                                </span>
                              </label>
                            </div>
                          ) : // Approvals Tab: Show Buttons ONLY for Pending
                          artist.artistStatus === "pending" ||
                            (!artist.artistStatus &&
                              !artist.isArtistVerified) ? (
                            <>
                              <button
                                onClick={() =>
                                  handleVerify(artist._id, "approve")
                                }
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Approve"
                              >
                                <CheckCircle size={20} />
                              </button>
                              <button
                                onClick={() =>
                                  handleVerify(artist._id, "reject")
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Reject"
                              >
                                <XCircle size={20} />
                              </button>
                            </>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "artworks" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 dark:border-slate-800">
              <h2 className="text-xl font-bold dark:text-white capitalize">
                Artworks Download Priority
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500 dark:text-[var(--text-muted)]">
                <thead className="bg-white dark:bg-[var(--card-bg)] text-xs uppercase font-bold text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-6 py-4">Priority Rank</th>
                    <th className="px-6 py-4">Artwork Details</th>
                    <th className="px-6 py-4">Artist</th>
                    <th className="px-6 py-4 text-right">Downloads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {artworks.map((art, idx) => (
                    <tr key={art._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4 font-black text-[var(--color-primary)] text-lg">
                        #{idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={art.images?.[0]?.startsWith("http") ? art.images[0] : `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "") || "http://localhost:5005"}${art.images?.[0]}`} className="w-12 h-12 object-cover rounded-md" alt={art.title} />
                          <div>
                            <p className="font-bold text-gray-800 dark:text-white">{art.title}</p>
                            <p className="text-xs">{art.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {art.artistBrandName || art.artistName || "Unknown Artist"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                          {art.downloads || 0} Downloads
                        </span>
                      </td>
                    </tr>
                  ))}
                  {artworks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10">No artworks found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        {/* Toast Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg font-medium text-white flex items-center gap-2 ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}`}
          >
            {notification.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            {notification.message}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
