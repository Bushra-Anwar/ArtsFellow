import React, { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Edit3,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import PaintStainsBackground from "../components/PaintStainsBackground";

const CartPage: React.FC = () => {
  const { cart, removeFromCart, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (cart.length === 0) {
    return (
      <div className="relative min-h-screen pt-32 pb-12 px-4 text-center overflow-hidden">
        <PaintStainsBackground opacity={0.2} interactive={false} />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/40 dark:bg-[var(--bg-primary)]/40 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 dark:border-white/5 max-w-lg mx-auto shadow-2xl shadow-gray-200/50 dark:shadow-none"
          >
            <ShoppingBag
              size={80}
              className="mx-auto text-[var(--color-primary)]/30 mb-8"
            />
            <h1 className="text-4xl font-black text-[var(--text-main)] mb-6">
              Your Cart is{" "}
              <span className="text-[var(--color-primary)]">Empty</span>
            </h1>
            <p className="text-gray-500 mb-10 text-lg">
              Looks like you haven't added any masterpieces to your collection
              yet.
            </p>
            <Link
              to="/explore"
              className="inline-block px-10 py-5 bg-[var(--color-primary)] text-white font-black rounded-2xl hover:shadow-2xl hover:shadow-[var(--color-primary)]/40 hover:-translate-y-1 transition-all uppercase tracking-widest"
            >
              Start Exploring
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-24 pb-12 px-4 bg-transparent dark:bg-transparent overflow-hidden">
      <PaintStainsBackground opacity={0.3} interactive={false} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-2 justify-center lg:justify-start">
            <div className="p-4 bg-[var(--color-primary)] rounded-full text-white shadow-xl shadow-[var(--color-primary)]/20 animate-pulse">
              <ShoppingBag size={28} />
            </div>
            <h1 className="text-5xl font-serif-magic italic tracking-tight text-[var(--text-main)] dark:text-white">
              Shopping <span className="text-[var(--color-primary)]">Cart</span>
            </h1>
          </div>
          <p className="text-[var(--color-primary)] font-bold tracking-widest uppercase text-xs ml-0 lg:ml-20 text-center lg:text-left">
            Your Single Selection Piece
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence>
              {cart.map((item, idx) => (
                <motion.div
                  key={`${item._id}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white dark:bg-white backdrop-blur-xl p-6 rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 flex flex-col sm:flex-row gap-8 items-center transition-all duration-300"
                >
                  <Link
                    to={`/art/${item._id}`}
                    className="w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 bg-white shadow-lg group-hover:scale-105 transition-transform duration-500"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link
                          to={`/art/${item._id}`}
                          className="font-black text-2xl text-slate-900 dark:text-white hover:text-[var(--color-primary)] transition-colors tracking-tight"
                        >
                          {item.title}
                        </Link>
                        <p className="text-gray-500 dark:text-gray-500 font-bold mb-2">
                          by {item.artistName}
                        </p>
                        {item.size && (
                          <span className="inline-block text-xs font-black uppercase tracking-wider px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg">
                            {item.size}
                          </span>
                        )}
                      </div>
                      <p className="font-black text-2xl text-[var(--color-primary)] tracking-tight">
                        ₹{item.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-between items-center mt-6 gap-4">
                      <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-50 rounded-2xl p-2 px-4">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                          Artwork
                        </span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          1 Unit
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => navigate("/custom")}
                          className="flex items-center gap-2 text-sm font-black text-blue-500 hover:text-white hover:bg-blue-500 p-2 px-4 rounded-xl transition-all"
                        >
                          <Edit3 size={16} /> Customize
                        </button>
                        <button
                          onClick={() =>
                            removeFromCart(item._id, item.variantId)
                          }
                          className="flex items-center gap-2 text-sm font-black text-red-500 hover:text-white hover:bg-red-500 p-2 px-4 rounded-xl transition-all"
                        >
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-white backdrop-blur-2xl p-10 rounded-[3.5rem] shadow-2xl border border-[var(--color-primary)]/10 sticky top-28">
              <h3 className="text-3xl font-serif-magic italic mb-8 text-slate-900 dark:text-white tracking-tight text-center">
                Summary
              </h3>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Subtotal</span>
                  <span className="text-slate-900 dark:text-white">
                    ₹{cartTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Shipping</span>
                  <span className="text-green-500 font-black uppercase tracking-widest text-xs py-1 px-3 bg-green-500/10 rounded-full">
                    Free
                  </span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-200 my-6" />
                <div className="flex justify-between text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                  <span>Total</span>
                  <span className="text-[var(--color-primary)]">
                    ₹{cartTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate("/order")}
                className="w-full py-6 bg-[var(--color-primary)] text-white font-black rounded-2xl shadow-xl shadow-[var(--color-primary)]/40 hover:shadow-[var(--color-primary)]/60 hover:-translate-y-2 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm"
              >
                Checkout Now <ArrowRight size={20} />
              </button>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500 justify-center">
                  <ShieldCheck size={16} className="text-green-500" />
                  Secure Checkout Process
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-gray-500 justify-center">
                  <CreditCard size={16} />
                  All major cards accepted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
