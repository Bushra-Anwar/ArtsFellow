import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Palette,
  ShoppingBag,
  Sun,
  Moon,
  Heart,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Package,
  Settings,
  LayoutDashboard,
  Star,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  DollarSign,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoginTab from "./LoginTab";
import Logo from "./Logo";
import { artCategories } from "../constants/artCategories";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const { isDarkMode, toggleDarkMode } = useTheme();

  const { cartCount } = useCart();
  const { role, isAuthenticated, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#041a1a]/95 backdrop-blur-xl border-b border-[var(--color-primary)]/15 dark:border-white/10 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 w-full relative">
          {/* Logo and Nav Container */}
          <div className="flex items-center gap-10 xl:gap-14">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="flex-shrink-0 hover:opacity-80 transition-opacity">
                  <Logo className="h-12 w-auto" showText={true} />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Categories Mega Menu */}
              <div className="group static h-full flex items-center">
                <button className="bg-teal-50 dark:bg-[var(--card-bg)]/10 hover:bg-teal-100 dark:hover:bg-slate-800 transition-all px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 text-teal-800 dark:text-slate-200 border border-teal-100 dark:border-slate-800">
                  <Menu className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  All Categories
                  <ChevronDown className="h-3 w-3 text-[var(--color-primary)] group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-[#0a1c22]/95 shadow-2xl border-t border-[var(--color-primary)]/20 overflow-hidden hidden group-hover:block transition-all backdrop-blur-3xl min-h-[400px] z-40">
                  <div className="max-w-7xl mx-auto px-8 py-8">
                    <div className="grid grid-cols-5 gap-8">
                      {artCategories.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                          <h4 className="font-bold text-[var(--color-primary)] text-sm uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">
                            {section.title}
                          </h4>
                          <ul className="space-y-2">
                            {section.items.map((item) => (
                              <li key={item}>
                                <Link
                                  to={`/category/${item.toLowerCase().replace(/\s+/g, "-")}`}
                                  className="text-sm text-gray-500 dark:text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:translate-x-1 transition-all block"
                                >
                                  {item}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Artists Link - Pill Design */}
              <div className="group static">
                <Link
                  to="/artists"
                  className="bg-teal-50 dark:bg-[var(--card-bg)]/10 hover:bg-teal-100 dark:hover:bg-slate-800 transition-all px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 text-teal-800 dark:text-slate-200 border border-teal-100 dark:border-slate-800"
                >
                  <Palette className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  Artists
                </Link>
              </div>

              {/* Discount Link */}
              <div className="group static">
                <Link
                  to="/discount"
                  className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-red-500" />
                  Discount
                </Link>
              </div>

              {/* Ratings Link */}
              <div className="group static">
                <Link
                  to="/ratings"
                  className="text-slate-700 dark:text-gray-100 hover:text-[var(--color-primary)] transition-colors px-3 py-2 text-sm font-semibold flex items-center gap-1"
                >
                  <Star className="h-4 w-4 text-yellow-500" />
                  Ratings
                </Link>
              </div>

              {/* Cart Button */}
              {(role !== "admin" && role !== "artist") && (
                <Link
                  to="/cart"
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      window.dispatchEvent(
                        new CustomEvent("open-login-modal", {
                          detail: { mode: "signup" },
                        }),
                      );
                    }
                  }}
                  className="text-slate-700 dark:text-gray-100 hover:text-[var(--color-primary)] transition-colors px-3 py-2 text-sm font-semibold flex items-center gap-1 relative"
                >
                  <div className="relative">
                    <ShoppingBag className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[var(--color-primary)] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  Cart
                </Link>
              )}

              {(role !== "admin" && role !== "artist") && (
                <Link
                  to="/wishlist"
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      window.dispatchEvent(
                        new CustomEvent("open-login-modal", {
                          detail: { mode: "signup" },
                        }),
                      );
                    }
                  }}
                  className="text-slate-700 dark:text-gray-100 hover:text-[var(--color-primary)] transition-colors px-3 py-2 text-sm font-semibold flex items-center gap-1"
                >
                  <span className="group-hover:scale-110 transition-transform">
                    <Heart className="h-4 w-4" />
                  </span>{" "}
                  Wishlist
                </Link>
              )}
            </div>
          </div>

          {/* Right Section: Theme & Login */}
          <div className="hidden md:flex items-center gap-6">
            {/* Search Bar - Moved to Right next to Profile */}
            <div className="hidden lg:flex items-center w-64 xl:w-80">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate(`/search?query=${searchQuery}`);
                    setSearchQuery("");
                  }
                }} 
                className="relative w-full group"
              >
                <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search size={15} className="text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                </button>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-800 rounded-full bg-white dark:bg-transparent focus:bg-white dark:focus:bg-black/20 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] dark:text-white text-sm font-normal shadow-sm transition-all duration-300"
                />
              </form>
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-teal-50 dark:hover:bg-[var(--color-primary)]/10 transition-colors text-slate-600 dark:text-[var(--text-muted)] hover:text-[var(--color-primary)]"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Painting Disk Login Trigger */}
            <div className="relative">
              <LoginTab />
            </div>
          </div>

          {/* Mobile Actions & Menu */}
          <div className="md:hidden flex items-center gap-1 sm:gap-3">
            {(role !== "admin" && role !== "artist") && (
              <Link
                to="/wishlist"
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    window.dispatchEvent(
                      new CustomEvent("open-login-modal", {
                        detail: { mode: "signup" },
                      }),
                    );
                  }
                }}
                className="p-1 sm:p-2 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors relative"
              >
                <Heart size={20} />
              </Link>
            )}

            {(role !== "admin" && role !== "artist") && (
              <Link
                to="/cart"
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    window.dispatchEvent(
                      new CustomEvent("open-login-modal", {
                        detail: { mode: "signup" },
                      }),
                    );
                  }
                }}
                className="p-1 sm:p-2 relative text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[var(--color-primary)] text-white text-[10px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white dark:border-black">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Login Tab in Header */}
            <div className="scale-75 origin-center">
              <LoginTab />
            </div>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 sm:p-2 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#0a1c22]/60 backdrop-blur-sm z-[999] md:hidden"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[85%] max-w-[320px] bg-white dark:bg-[var(--bg-primary)] shadow-2xl z-[1000] overflow-y-auto md:hidden border-l border-gray-100 dark:border-slate-800"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)]">
                    Menu
                  </h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500"
                  >
                    <X size={28} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Artist Dashboard Links (Priority) */}
                  {isAuthenticated && role === "artist" && (
                    <div className="pb-2 border-b border-gray-100 dark:border-slate-800 space-y-1">
                      <Link
                        to="/artist/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-[var(--text-main)] font-bold text-lg"
                      >
                        <LayoutDashboard
                          size={20}
                          className="text-[var(--color-primary)]"
                        />{" "}
                        Overview
                      </Link>
                      <Link
                        to="/artist/artworks"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-[var(--text-main)] font-bold text-lg"
                      >
                        <ImageIcon
                          size={20}
                          className="text-[var(--color-primary)]"
                        />{" "}
                        My Artworks
                      </Link>
                      <Link
                        to="/artist/requests"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-[var(--text-main)] font-bold text-lg"
                      >
                        <MessageSquare
                          size={20}
                          className="text-[var(--color-primary)]"
                        />{" "}
                        Custom Requests
                      </Link>
                      <Link
                        to="/artist/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-[var(--text-main)] font-bold text-lg"
                      >
                        <ShoppingBag
                          size={20}
                          className="text-[var(--color-primary)]"
                        />{" "}
                        Orders
                      </Link>
                      <Link
                        to="/artist/earnings"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-[var(--text-main)] font-bold text-lg"
                      >
                        <DollarSign
                          size={20}
                          className="text-[var(--color-primary)]"
                        />{" "}
                        Earnings
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-[var(--text-main)] font-bold text-lg"
                      >
                        <Settings
                          size={20}
                          className="text-[var(--color-primary)]"
                        />{" "}
                        Settings
                      </Link>
                    </div>
                  )}

                  <Link
                    to="/explore"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 font-bold text-lg dark:text-white"
                  >
                    Explore{" "}
                    <ChevronRight
                      size={18}
                      className="text-[var(--text-muted)]"
                    />
                  </Link>

                  <Link
                    to="/discount"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-lg"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag size={20} className="text-red-500" />
                      Discount
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-red-400"
                    />
                  </Link>

                  <Link
                    to="/artists"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 font-bold text-lg dark:text-white"
                  >
                    Artists{" "}
                    <ChevronRight
                      size={18}
                      className="text-[var(--text-muted)]"
                    />
                  </Link>

                  <Link
                    to="/ratings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-slate-800 font-bold text-lg dark:text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Star size={20} className="text-yellow-500" />
                      Ratings
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-[var(--text-muted)]"
                    />
                  </Link>

                  {/* Customer Links & Logout */}
                  <div className="border-t border-gray-100 dark:border-slate-800 my-2 pt-2">
                    {isAuthenticated && role !== "artist" && role !== "admin" && (
                      <>
                        <Link
                          to="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-gray-700 dark:text-gray-200 font-medium"
                        >
                          <User size={20} /> Profile
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-gray-700 dark:text-gray-200 font-medium"
                        >
                          <Heart size={20} /> Wishlist
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-gray-700 dark:text-gray-200 font-medium"
                        >
                          <Package size={20} /> My Orders
                        </Link>
                      </>
                    )}

                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-red-500 font-medium mt-1"
                      >
                        <LogOut size={20} /> Logout
                      </button>
                    )}
                  </div>

                  {/* Categories Accordion */}
                  <div className="border-t border-b border-gray-100 dark:border-slate-800 my-2 py-2">
                    <button
                      onClick={() =>
                        setExpandedCategory(
                          expandedCategory === "categories"
                            ? null
                            : "categories",
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-4 rounded-xl hover:bg-white dark:hover:bg-slate-800 font-bold text-xl dark:text-white"
                    >
                      Categories
                      <ChevronDown
                        size={20}
                        className={`text-[var(--text-muted)] transition-transform ${expandedCategory === "categories" ? "rotate-180" : ""}`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedCategory === "categories" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}
                    >
                      <div className="px-4 pb-4 pt-2">
                        {artCategories.map((cat, idx) => (
                          <div key={idx} className="mb-6 last:mb-0">
                            <h4 className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
                              {cat.title}
                            </h4>
                            <div className="space-y-2 pl-3.5 border-l-2 border-gray-100 dark:border-slate-800">
                              {cat.items.map((item) => (
                                <Link
                                  key={item}
                                  to={`/category/${item.toLowerCase().replace(/\s+/g, "-")}`}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="block text-sm font-medium text-gray-500 hover:text-[var(--color-primary)] py-1.5 transition-colors"
                                >
                                  {item}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Theme Toggle in Menu */}
                  <div className="flex items-center justify-between px-4 py-4">
                    <span className="font-bold text-xl dark:text-white">
                      Dark Mode
                    </span>
                    <button
                      onClick={toggleDarkMode}
                      className={`w-14 h-8 rounded-full relative transition-colors ${isDarkMode ? "bg-[var(--color-primary)]" : "bg-gray-200"}`}
                    >
                      <motion.div
                        initial={false}
                        animate={{ x: isDarkMode ? 26 : 4 }}
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
