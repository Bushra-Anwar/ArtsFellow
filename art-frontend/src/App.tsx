import { lazy, Suspense } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";
import { useAuth } from "./context/AuthContext";

import PaintFlowBackground from "./components/PaintFlowBackground";

const AiCurator = lazy(() => import("./components/AiCurator").then(module => ({ default: module.AiCurator })));
const ChatWidget = lazy(() => import("./components/Chat/ChatWidget"));

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/" && !isAuthenticated;
  const isAuthPage = location.pathname === "/register-artist";

  return (
    <div className="min-h-screen bg-transparent text-[var(--text-primary)] transition-colors duration-300 relative">
      <PaintFlowBackground opacity={0.15} />
      {!isLandingPage && !isAuthPage && <Navbar />}
      <div className="relative z-10">
        <AppRoutes />
      </div>
      <Suspense fallback={null}>
        <AiCurator />
        <ChatWidget />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
