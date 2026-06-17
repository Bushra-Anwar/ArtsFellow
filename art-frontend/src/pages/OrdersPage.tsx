import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, Truck } from "lucide-react";

interface OrderItem {
  title: string;
  price: number;
  image: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  paymentStatus: string;
}

const OrdersPage: React.FC = () => {
  const { role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("art_token")}`,
          },
        });
        const data = await res.json();
        if (data.status === "ok") {
          setOrders(data.orders);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed":
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "shipped":
        return "text-purple-500 bg-purple-50 dark:bg-purple-900/20";
      case "delivered":
        return "text-green-500 bg-green-50 dark:bg-green-900/20";
      default:
        return "text-gray-500 bg-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "placed":
        return <Clock size={16} />;
      case "shipped":
        return <Truck size={16} />;
      case "delivered":
        return <CheckCircle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">
        {role === "artist" ? "Sales Dashboard" : "My Orders"}
      </h1>
      <p className="text-gray-500 mb-8">
        {role === "artist"
          ? "Track your artwork sales and shipments."
          : "Track your purchases and previous orders."}
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[var(--card-bg)] rounded-3xl">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[var(--text-muted)]">
            No orders found
          </h3>
          {role === "customer" && (
            <a
              href="/"
              className="inline-block mt-4 text-[var(--color-primary)] font-bold"
            >
              Start Shopping
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={order._id}
              className="bg-white dark:bg-[var(--card-bg)] rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-white/50 dark:bg-[var(--bg-primary)]/50 flex flex-wrap justify-between items-center gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Order ID
                  </p>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    #{order._id.toString().slice(-6)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Date
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Total Amount
                  </p>
                  <p className="text-sm font-bold text-[var(--color-primary)]">
                    ₹{order.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold uppercase ${getStatusColor(order.status)}`}
                >
                  {getStatusIcon(order.status)}
                  {order.status}
                </div>
              </div>

              {/* Items */}
              <div className="p-4 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex-shrink-0">
                      {item.image && (
                        <img
                          src={item.image}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-main)]">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        ₹{item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions (Optional) */}
              {role === "customer" && (
                <div className="px-4 py-3 bg-white dark:bg-[var(--bg-primary)]/30 flex justify-end">
                  <button className="text-sm font-bold text-[var(--color-primary)] hover:underline">
                    View Invoice
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
