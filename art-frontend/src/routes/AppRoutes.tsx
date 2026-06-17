import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Lazy-loaded pages ───────────────────────────────────────
const LandingPage = lazy(() => import("../pages/LandingPage"));
const ArtLandingPage = lazy(() => import("../pages/ArtLandingPage"));
const OrderPage = lazy(() => import("../pages/OrderPage"));
const CustomArtPage = lazy(() => import("../pages/CustomArtPage"));
const ArtistRegistration = lazy(() => import("../pages/ArtistRegistration"));
const ArtistDashboard = lazy(() => import("../pages/ArtistDashboard"));
const ArtistProfilePage = lazy(() => import("../pages/ArtistProfilePage"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const ExplorePage = lazy(() => import("../pages/ExplorePage"));
const ArtworkDetailPage = lazy(() => import("../pages/ArtworkDetailPage"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage"));
const OrdersPage = lazy(() => import("../pages/OrdersPage"));
const WishlistPage = lazy(() => import("../pages/WishlistPage"));
const ArtistsPage = lazy(() => import("../pages/ArtistsPage"));
const CartPage = lazy(() => import("../pages/CartPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const ChatPage = lazy(() => import("../pages/ChatPage"));
const RatingsPage = lazy(() => import("../pages/RatingsPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));

// ─── Loading fallback ────────────────────────────────────────
const PageLoader = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "80vh",
      width: "100%",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.2rem",
      }}
    >
      {/* Animated spinner */}
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid rgba(168, 130, 255, 0.15)",
          borderTopColor: "#a882ff",
          borderRadius: "50%",
          animation: "lazy-spin 0.8s linear infinite",
        }}
      />
      <span
        style={{
          color: "var(--text-secondary, #aaa)",
          fontSize: "0.95rem",
          fontFamily: "inherit",
          letterSpacing: "0.04em",
        }}
      >
        Loading…
      </span>

      {/* Inline keyframes – keeps everything self-contained */}
      <style>{`
        @keyframes lazy-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              user?.role === "artist" && user.artistStatus !== "approved" ? (
                <Navigate to="/artist/dashboard" replace />
              ) : (
                <LandingPage />
              )
            ) : (
              <ArtLandingPage />
            )
          }
        />
        <Route path="/register-artist" element={<ArtistRegistration />} />
        <Route path="/artist" element={<ArtistDashboard />} />
        <Route path="/artist/dashboard" element={<ArtistDashboard />} />
        <Route path="/artist/artworks" element={<ArtistDashboard />} />
        <Route path="/artist/requests" element={<ArtistDashboard />} />
        <Route path="/artist/orders" element={<ArtistDashboard />} />
        <Route path="/artist/earnings" element={<ArtistDashboard />} />
        <Route path="/artist/:id" element={<ArtistProfilePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/art/:id" element={<ArtworkDetailPage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/artists" element={<ArtistsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/custom" element={<CustomArtPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/ratings" element={<RatingsPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
