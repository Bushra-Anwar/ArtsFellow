import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  CreditCard,
  CheckCircle,
  Truck,
  Plus,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

import { useNavigate, Link } from "react-router-dom";

const OrderPage: React.FC = () => {
  const { user, addAddress } = useAuth();
  const navigate = useNavigate();

  // Steps: 1=Address, 2=Payment, 3=Confirm, 4=Success
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"card" | "upi">("card");

  // Address State
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showAddressForm, setShowAddressForm] = useState(false);

  // New Address Form State
  const [newAddr, setNewAddr] = useState({
    label: "Home",
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false,
  });
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});

  // Mock Product Data (In real app, get from CartContext)
  // const product = {
  //     title: "Eternal Sunset",
  //     artist: "Elena V.",
  //     price: 450,
  //     image: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg"
  // };
  const { cart, cartTotal, clearCart } = useCart();

  // Auto-select default address on load
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else setSelectedAddressId(user.addresses[0].id);
    } else {
      // No address exists, prompt to add
      // setShowAddressForm(true); // Optional: Auto open form
    }
  }, [user]);

  // Validate Address Form
  const validateAddress = () => {
    const errors: Record<string, string> = {};
    if (!newAddr.name) errors.name = "Full Name is required";
    if (!newAddr.phone || newAddr.phone.length < 10)
      errors.phone = "Valid 10-digit phone required";
    if (!newAddr.street) errors.street = "Street Address is required";
    if (!newAddr.city) errors.city = "City is required";
    if (!newAddr.state) errors.state = "State is required";
    if (!newAddr.pincode || isNaN(Number(newAddr.pincode)))
      errors.pincode = "Valid Numeric Pincode required";

    setAddrErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = () => {
    if (!validateAddress()) return;

    // Call Context Action (Simulated API)
    const addressPayload = {
      name: newAddr.name,
      phone: newAddr.phone,
      street: newAddr.street,
      city: newAddr.city,
      state: newAddr.state,
      pincode: newAddr.pincode,
      isDefault: newAddr.isDefault,
    };
    addAddress(addressPayload);

    // Reset and Close
    setShowAddressForm(false);
    setNewAddr({
      label: "Home",
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false,
    });

    // Auto select the new one (simulated by effect or explicit set if we had ID)
    // Since mock doesn't return ID immediately in sync, we rely on Effect or manual logic
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      setStep(4); // Success
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent pt-24 px-4 pb-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 dark:text-white flex items-center gap-2">
          <ShoppingBag className="text-[var(--color-primary)]" /> Checkout
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Order Steps */}
          <div className="md:col-span-2 space-y-6">
            {/* ---------------- STEP 1: ADDRESS ---------------- */}
            <div
              className={`bg-white dark:bg-white p-6 rounded-2xl shadow-sm border ${step === 1 ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20" : "border-gray-200 dark:border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 1 ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 dark:bg-gray-100 text-gray-500"}`}
                  >
                    1
                  </span>
                  Shipping Address
                </h3>
                {step > 1 && (
                  <CheckCircle className="text-green-500" size={20} />
                )}
              </div>

              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Existing Addresses List */}
                  {user?.addresses && user.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {user.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 border rounded-xl flex items-start gap-4 cursor-pointer transition-all ${selectedAddressId === addr.id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-gray-200 dark:border-slate-700 bg-white dark:bg-[var(--card-bg)]/50 hover:border-gray-300"}`}
                        >
                          <div
                            className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center ${selectedAddressId === addr.id ? "border-[var(--color-primary)]" : "border-gray-400"}`}
                          >
                            {selectedAddressId === addr.id && (
                              <div className="w-3 h-3 bg-[var(--color-primary)] rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {addr.name}
                              </p>
                              <span className="text-xs bg-gray-200 dark:bg-gray-200 px-2 py-0.5 rounded text-gray-500">
                                Home
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {addr.street}, {addr.city}
                            </p>
                            <p className="text-sm text-gray-500">
                              {addr.state} - {addr.pincode}
                            </p>
                            <p className="text-sm text-gray-500 font-medium">
                              M: {addr.phone}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No saved addresses found.
                    </div>
                  )}

                  {/* Add New Address Button */}
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="flex items-center gap-2 text-[var(--color-primary)] font-bold hover:underline"
                    >
                      <Plus size={18} /> Add New Address
                    </button>
                  )}

                  {/* ADD ADDRESS FORM MODAL / INLINE */}
                  <AnimatePresence>
                    {showAddressForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white dark:bg-white p-5 rounded-xl border border-gray-200 dark:border-gray-200 space-y-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-slate-900 dark:text-white">
                              Add New Address
                            </h4>
                            <button
                              onClick={() => setShowAddressForm(false)}
                              className="text-[var(--text-muted)] hover:text-red-500"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                value={newAddr.name}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    name: e.target.value,
                                  })
                                }
                                className={`w-full p-2 rounded-lg border bg-white dark:bg-white border-gray-200 dark:border-gray-300 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] ${addrErrors.name ? "border-red-500" : ""}`}
                              />
                              {addrErrors.name && (
                                <p className="text-red-500 text-xs mt-1">
                                  {addrErrors.name}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">
                                Mobile Number
                              </label>
                              <input
                                type="text"
                                value={newAddr.phone}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    phone: e.target.value,
                                  })
                                }
                                className={`w-full p-2 rounded-lg border bg-white dark:bg-white border-gray-200 dark:border-gray-300 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] ${addrErrors.phone ? "border-red-500" : ""}`}
                              />
                              {addrErrors.phone && (
                                <p className="text-red-500 text-xs mt-1">
                                  {addrErrors.phone}
                                </p>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-gray-500 mb-1">
                                Street Address
                              </label>
                              <input
                                type="text"
                                value={newAddr.street}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    street: e.target.value,
                                  })
                                }
                                className={`w-full p-2 rounded-lg border bg-white dark:bg-white border-gray-200 dark:border-gray-300 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] ${addrErrors.street ? "border-red-500" : ""}`}
                              />
                              {addrErrors.street && (
                                <p className="text-red-500 text-xs mt-1">
                                  {addrErrors.street}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">
                                City
                              </label>
                              <input
                                type="text"
                                value={newAddr.city}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    city: e.target.value,
                                  })
                                }
                                className={`w-full p-2 rounded-lg border bg-white dark:bg-white border-gray-200 dark:border-gray-300 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] ${addrErrors.city ? "border-red-500" : ""}`}
                              />
                              {addrErrors.city && (
                                <p className="text-red-500 text-xs mt-1">
                                  {addrErrors.city}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">
                                State
                              </label>
                              <input
                                type="text"
                                value={newAddr.state}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    state: e.target.value,
                                  })
                                }
                                className={`w-full p-2 rounded-lg border bg-white dark:bg-white border-gray-200 dark:border-gray-300 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] ${addrErrors.state ? "border-red-500" : ""}`}
                              />
                              {addrErrors.state && (
                                <p className="text-red-500 text-xs mt-1">
                                  {addrErrors.state}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">
                                Pincode
                              </label>
                              <input
                                type="text"
                                value={newAddr.pincode}
                                onChange={(e) =>
                                  setNewAddr({
                                    ...newAddr,
                                    pincode: e.target.value,
                                  })
                                }
                                className={`w-full p-2 rounded-lg border bg-white dark:bg-white border-gray-200 dark:border-gray-300 text-slate-900 dark:text-white outline-none focus:border-[var(--color-primary)] ${addrErrors.pincode ? "border-red-500" : ""}`}
                              />
                              {addrErrors.pincode && (
                                <p className="text-red-500 text-xs mt-1">
                                  {addrErrors.pincode}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <input
                              type="checkbox"
                              checked={newAddr.isDefault}
                              onChange={(e) =>
                                setNewAddr({
                                  ...newAddr,
                                  isDefault: e.target.checked,
                                })
                              }
                              className="w-4 h-4 accent-[var(--color-primary)]"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-500">
                              Set as Default Address
                            </span>
                          </div>

                          <button
                            onClick={handleSaveAddress}
                            className="w-full py-3 bg-slate-900 dark:bg-slate-900 text-white dark:text-white font-bold rounded-lg mt-4 hover:opacity-90"
                          >
                            Save Address
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Button */}
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedAddressId}
                    className="w-full py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl mt-4 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {selectedAddressId
                      ? "Continue to Payment"
                      : "Select an Address to Continue"}
                  </button>
                </motion.div>
              )}
            </div>

            {/* ---------------- STEP 2: PAYMENT ---------------- */}
            <div
              className={`bg-white dark:bg-white p-6 rounded-2xl shadow-sm border ${step === 2 ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20" : "border-gray-200 dark:border-gray-200"}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 2 ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 dark:bg-gray-100 text-gray-500"}`}
                  >
                    2
                  </span>
                  Payment Method
                </h3>
                {step > 2 && (
                  <CheckCircle className="text-green-500" size={20} />
                )}
              </div>
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex gap-4">
                    <button onClick={() => setPaymentMode("card")} className={`flex-1 p-4 border rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${paymentMode === "card" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]" : "border-gray-200 dark:border-gray-300 text-gray-500 hover:bg-gray-50"}`}>
                      <CreditCard size={20} /> Card
                    </button>
                    <button onClick={() => setPaymentMode("upi")} className={`flex-1 p-4 border rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${paymentMode === "upi" ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]" : "border-gray-200 dark:border-gray-300 text-gray-500 hover:bg-gray-50"}`}>
                      UPI / Wallet
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-50 rounded-xl space-y-3 border border-gray-200 dark:border-gray-200">
                    {paymentMode === "card" ? (
                      <>
                        <input
                          type="text"
                          placeholder="Card Number"
                          className="w-full p-3 bg-white dark:bg-white border text-slate-900 dark:text-white border-gray-200 dark:border-gray-300 rounded-lg outline-none focus:border-[var(--color-primary)]"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full p-3 bg-white dark:bg-white border text-slate-900 dark:text-white border-gray-200 dark:border-gray-300 rounded-lg outline-none focus:border-[var(--color-primary)]"
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            className="w-full p-3 bg-white dark:bg-white border text-slate-900 dark:text-white border-gray-200 dark:border-gray-300 rounded-lg outline-none focus:border-[var(--color-primary)]"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Enter UPI ID (e.g. mobile@ybl)"
                          className="w-full p-3 bg-white dark:bg-white border text-slate-900 dark:text-white border-gray-200 dark:border-gray-300 rounded-lg outline-none focus:border-[var(--color-primary)]"
                        />
                        <p className="text-xs text-gray-500 text-center mt-2">Supports Google Pay, PhonePe, Paytm, and other UPI Apps</p>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl mt-4 hover:shadow-lg transition-all"
                  >
                    Review Order
                  </button>
                </motion.div>
              )}
            </div>

            {/* ---------------- STEP 3: CONFIRM ---------------- */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-white p-6 rounded-2xl shadow-xl border border-[var(--color-primary)] text-center"
              >
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                  Confirm Purchase
                </h3>
                <p className="text-gray-500 mb-6">
                  Total Amount:{" "}
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${cartTotal.toLocaleString()}
                  </span>
                </p>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {isProcessing ? "Processing Payment..." : "Pay Securely"}
                </button>
              </motion.div>
            )}

            {/* ---------------- STEP 4: SUCCESS ---------------- */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 dark:bg-green-900/10 p-8 rounded-3xl text-center border border-green-100 dark:border-green-900/30"
              >
                <div className="w-20 h-20 bg-green-500 rounded-full text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
                  Order Confirmed!
                </h2>
                <p className="text-[var(--text-muted)] dark:text-[var(--text-muted)] mb-6">
                  Thank you for supporting art. Your order #8842 is being
                  prepared.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => navigate("/orders")}
                    className="px-6 py-2 bg-white dark:bg-[var(--card-bg)] rounded-lg font-bold shadow-sm text-sm text-slate-900 dark:text-white"
                  >
                    Track Order
                  </button>
                  <button
                    onClick={() => navigate("/explore")}
                    className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg font-bold shadow-sm text-sm"
                  >
                    Continue Shopping
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Order Summary */}
          {step < 4 && (
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-white p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-200 sticky top-28">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">
                  Order Summary
                </h3>
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-200"
                  >
                    <Link
                      to={`/art/${item._id}`}
                      className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div>
                      <Link
                        to={`/art/${item._id}`}
                        className="font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-[var(--color-primary)] transition-colors"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-gray-500">{item.artistName}</p>
                      <p className="text-[var(--color-primary)] font-bold mt-1">
                        ${item.price.toLocaleString()} x {item.quantity}
                      </p>
                      {item.size && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                          Size: {item.size}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-slate-900 dark:text-white">${cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span className="text-green-500 font-bold">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Taxes</span>
                    <span className="text-slate-900 dark:text-white">$0.00</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-200 pt-3 flex justify-between font-bold text-lg text-slate-900 dark:text-white">
                    <span>Total</span>
                    <span>${cartTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-50 border border-gray-200 dark:border-gray-200 p-3 rounded-lg">
                  <Truck size={16} /> Free Delivery by 24th Oct
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
