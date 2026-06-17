import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Mail,
  Facebook,
  Chrome,
  Bluetooth,
  MoreHorizontal,
  Instagram,
  Send,
  StickyNote,
  Zap,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  artwork: {
    _id: string;
    title: string;
    artistName?: string;
    artistBrandName?: string;
    price: number;
    images?: string[];
  };
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  artwork,
}) => {
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Generate share URL
  const shareUrl = `${window.location.origin}/artwork/${artwork._id}`;
  const shareTitle = `Check out "${artwork.title}" by ${artwork.artistBrandName || artwork.artistName || "Unknown Artist"}`;
  const shareText = `${shareTitle} - ₹${Number(artwork.price || 0).toLocaleString()}`;
  const imageUrl = artwork.images?.[0]
    ? artwork.images[0].startsWith("http") ||
      artwork.images[0].includes("/assets")
      ? artwork.images[0]
      : `http://localhost:5005${artwork.images[0]}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
    );
  };

  const handleInstagram = () => {
    // Instagram doesn't support direct web sharing, so we'll copy the link
    handleCopyLink();
    alert("Link copied! You can now paste it in your Instagram post or story.");
  };

  const handleGmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(
      `${shareText}\n\nView it here: ${shareUrl}`,
    );
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
      "_blank",
    );
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(
      `${shareText}\n\nView it here: ${shareUrl}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleSMS = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`sms:?body=${text}`);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      alert("Native sharing is not supported on this device");
    }
  };

  const handleBluetooth = () => {
    // Bluetooth sharing is typically device-specific
    // We'll trigger the native share which may include Bluetooth on mobile
    handleNativeShare();
  };

  const handleChrome = () => {
    // Open in new Chrome tab
    window.open(shareUrl, "_blank");
  };

  const handleSaveToGoogle = () => {
    // Save to Google Keep
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://keep.google.com/u/0/#NOTE/${text}`, "_blank");
  };

  const handleQuickShare = () => {
    // Use Web Share API for Quick Share (Android)
    handleNativeShare();
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366] hover:brightness-110 shadow-green-500/20",
      action: handleWhatsApp,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      action: handleFacebook,
    },
    {
      name: "Instagram",
      icon: Instagram,
      color:
        "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:brightness-110 shadow-pink-500/20",
      action: handleInstagram,
    },
    {
      name: "Gmail",
      icon: Mail,
      color: "bg-red-500 hover:bg-red-600",
      action: handleGmail,
    },
    {
      name: "Messages",
      icon: Send,
      color: "bg-blue-500 hover:bg-blue-600",
      action: handleSMS,
    },
    {
      name: "Copy Link",
      icon: copied ? Check : Copy,
      color: copied
        ? "bg-green-500"
        : "bg-[#184954] hover:bg-[var(--color-primary)] shadow-teal-500/20",
      action: handleCopyLink,
    },
  ];

  const moreOptions = [
    {
      name: "Email",
      icon: Mail,
      color: "bg-indigo-500 hover:bg-indigo-600",
      action: handleEmail,
    },
    {
      name: "Bluetooth",
      icon: Bluetooth,
      color: "bg-blue-400 hover:bg-blue-500",
      action: handleBluetooth,
    },
    {
      name: "Quick Share",
      icon: Zap,
      color: "bg-[#1A73E8] hover:bg-[#1557B0] shadow-blue-500/20",
      action: handleQuickShare,
    },
    {
      name: "Chrome",
      icon: Chrome,
      color: "bg-yellow-500 hover:bg-yellow-600",
      action: handleChrome,
    },
    {
      name: "Save to Keep",
      icon: StickyNote,
      color: "bg-[#FABB05] hover:bg-[#E3A008] shadow-yellow-500/20",
      action: handleSaveToGoogle,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0a1c22]/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-[#0a1c22] rounded-t-[2.5rem] sm:rounded-[3rem] shadow-3xl max-w-lg w-full relative overflow-hidden border border-white/20 dark:border-white/10"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full flex items-center justify-center">
                  <Share2 className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">
                    Share Artwork
                  </h3>
                  <p className="text-sm text-gray-500">
                    Share "{artwork.title}"
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="text-gray-500" size={24} />
              </button>
            </div>

            {/* Preview Card */}
            <div className="p-6 bg-white dark:bg-[var(--bg-primary)]/50">
              <div className="flex gap-4 p-4 bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={artwork.title}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[var(--text-main)] truncate">
                    {artwork.title}
                  </h4>
                  <p className="text-sm text-gray-500 truncate">
                    {artwork.artistBrandName ||
                      artwork.artistName ||
                      "Unknown Artist"}
                  </p>
                  <p className="text-lg font-black text-[var(--color-primary)] mt-1 tracking-tighter">
                    ₹{Number(artwork.price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-700/50 transition-all group"
                  >
                    <div
                      className={`w-14 h-14 ${option.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}
                    >
                      <option.icon size={24} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* More Options */}
              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {moreOptions.map((option) => (
                        <button
                          key={option.name}
                          onClick={option.action}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-white dark:hover:bg-slate-700/50 transition-all group"
                        >
                          <div
                            className={`w-14 h-14 ${option.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}
                          >
                            <option.icon size={24} />
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                            {option.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* More Button */}
              <button
                onClick={() => setShowMore(!showMore)}
                className="w-full py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-700 dark:text-gray-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center gap-2"
              >
                <MoreHorizontal size={20} />
                {showMore ? "Show Less" : "More Options"}
              </button>
            </div>

            {/* Link Display */}
            <div className="p-6 pt-0">
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-[var(--bg-primary)] rounded-xl">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-[var(--text-muted)] dark:text-[var(--text-muted)] outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;
