import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  CheckCircle,
  MapPin,
} from "lucide-react";

import { useCart } from "../context/CartContext";

const CheckoutPage: React.FC = () => {
  const { user, addAddress } = useAuth();
  const { cart: cartItems, cartTotal: total, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<
    "card" | "upi" | "wallet" | "emi"
  >("card");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">(
    "online",
  ); // Keep for backend compatibility
  const [isPlaced, setIsPlaced] = useState(false);

  // Payment Form States
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [upiId, setUpiId] = useState("");
  const [walletOpt, setWalletOpt] = useState("paytm");

  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAddress({
      name: newAddress.fullName,
      phone: newAddress.phone,
      street: newAddress.street,
      city: newAddress.city,
      state: newAddress.state,
      pincode: newAddress.pincode,
    });
    setNewAddress({
      fullName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  const handlePlaceOrder = async () => {
    if (
      (selectedAddress === null && user?.addresses.length) ||
      (!user?.addresses.length && !newAddress.fullName)
    ) {
      if (user?.addresses.length === 0) {
        alert("Please add an address first");
        return;
      }
      alert("Please select an address");
      return;
    }

    // Validate Dummy Real Data
    if (paymentMethod === "online") {
      if (selectedPaymentMode === "card") {
        if (cardDetails.number.replace(/\s/g, "").length < 16)
          return alert("Please enter a valid 16-digit Card Number.");
        if (!cardDetails.expiry.includes("/") || cardDetails.expiry.length < 5)
          return alert("Please enter a valid Expiry Date (MM/YY).");
        if (cardDetails.cvv.length < 3)
          return alert("Please enter a valid CVV.");
        if (!cardDetails.name.trim())
          return alert("Please enter the Name on Card.");
      } else if (selectedPaymentMode === "upi") {
        if (!upiId.includes("@") || upiId.length < 5)
          return alert(
            "Please enter a valid UPI ID (e.g., example@upi, 9876543210@ybl).",
          );
      }
      // For wallet and EMI, we can just assume selection is okay for dummy
    }

    // Use user.addresses[selectedAddress] for shipping
    const shippingAddress = user?.addresses[selectedAddress || 0];

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("art_token")}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            artId: item._id,
            artistId: item.artistId,
            title: item.title,
            price: item.price,
            image: item.image,
            size: item.size,
            quantity: item.quantity,
          })),
          totalAmount: total,
          shippingAddress,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.status === "ok") {
        setIsPlaced(true);
        clearCart();
      } else {
        alert(data.message || "Order failed");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to place order");
    }
  };

  if (isPlaced) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-purple-600">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-500">Thank you for your purchase.</p>
          <a
            href="/"
            className="inline-block mt-4 text-[var(--color-primary)] font-bold"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 dark:text-white">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address */}
          <div
            className={`p-6 rounded-2xl border transition-all ${step === 1 ? "bg-white dark:bg-white border-[var(--color-primary)] shadow-lg" : "bg-gray-50 dark:bg-gray-50 border-gray-200 dark:border-gray-200 text-slate-900 dark:text-white"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm">
                  1
                </span>
                Shipping Address
              </h3>
              {step > 1 && (
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-[var(--color-primary)] font-bold"
                >
                  Edit
                </button>
              )}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                {user?.addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAddress(idx)}
                    className={`p-4 rounded-xl border-2 cursor-pointer flex items-start gap-3 transition-all ${selectedAddress === idx ? "border-[var(--color-primary)] bg-purple-50 dark:bg-purple-100" : "border-transparent bg-gray-100 dark:bg-gray-100"}`}
                  >
                    <MapPin
                      className="mt-1 text-[var(--color-primary)]"
                      size={20}
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{addr.name || "Home"}</p>
                      <p className="text-sm opacity-80 text-slate-700 dark:text-slate-700">
                        {addr.street}, {addr.city}, {addr.state} -{" "}
                        {addr.pincode}
                      </p>
                      <p className="text-sm opacity-80 text-slate-700 dark:text-slate-700">Phone: {addr.phone}</p>
                    </div>
                  </div>
                ))}

                {/* Add New Address Form */}
                <form
                  onSubmit={handleAddressSubmit}
                  className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700"
                >
                  <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-500 dark:text-gray-500">
                    Add New Address
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      placeholder="Full Name"
                      required
                      value={newAddress.fullName}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          fullName: e.target.value,
                        })
                      }
                      className="input-field"
                    />
                    <input
                      placeholder="Phone"
                      required
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value })
                      }
                      className="input-field"
                    />
                    <input
                      placeholder="Street Address"
                      required
                      className="col-span-2 input-field"
                      value={newAddress.street}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, street: e.target.value })
                      }
                    />
                    <input
                      placeholder="City"
                      required
                      className="input-field"
                      value={newAddress.city}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, city: e.target.value })
                      }
                    />
                    <input
                      placeholder="State"
                      required
                      className="input-field"
                      value={newAddress.state}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, state: e.target.value })
                      }
                    />
                    <input
                      placeholder="ZIP Code"
                      required
                      className="input-field"
                      value={newAddress.pincode}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          pincode: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button className="mt-4 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-bold">
                    Save Address
                  </button>
                </form>

                <button
                  onClick={() => setStep(2)}
                  disabled={selectedAddress === null}
                  className="w-full py-4 mt-4 bg-[var(--color-primary)] text-white font-bold rounded-xl shadow-lg disabled:opacity-50 hover:bg-[var(--color-primary-dark)]"
                >
                  Continue to Payment
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Payment */}
          <div
            className={`p-6 rounded-2xl border transition-all ${step === 2 ? "bg-white dark:bg-white border-[var(--color-primary)] shadow-lg" : "bg-gray-50 dark:bg-gray-50 border-gray-200 dark:border-gray-200 text-slate-900 dark:text-white"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm">
                  2
                </span>
                Payment Method
              </h3>
            </div>

            {step === 2 && (
              <div className="space-y-6">
                {/* Payment Mode Tabs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {(["card", "upi", "wallet", "emi"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSelectedPaymentMode(mode);
                        setPaymentMethod("online");
                      }}
                      className={`py-3 px-2 rounded-xl border text-sm font-bold capitalize transition-all ${selectedPaymentMode === mode ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-gray-200 dark:border-gray-200 text-slate-600 dark:text-slate-600 hover:bg-gray-50 dark:hover:bg-gray-50"}`}
                    >
                      {mode === "card"
                        ? "Debit/Credit Card"
                        : mode === "upi"
                          ? "UPI"
                          : mode === "wallet"
                            ? "Wallets"
                            : "EMI / PayLater"}
                    </button>
                  ))}
                </div>

                {/* Dynamic Payment Input Fields */}
                <div className="p-5 border border-gray-200 dark:border-gray-200 rounded-xl bg-white dark:bg-white">
                  {selectedPaymentMode === "card" && (
                    <div className="space-y-4">
                      <input
                        placeholder="Card Number (16 Digits)"
                        maxLength={16}
                        className="input-field w-full"
                        value={cardDetails.number}
                        onChange={(e) =>
                          setCardDetails({
                            ...cardDetails,
                            number: e.target.value.replace(/\D/g, ""),
                          })
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          placeholder="MM/YY"
                          maxLength={5}
                          className="input-field"
                          value={cardDetails.expiry}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              expiry: e.target.value,
                            })
                          }
                        />
                        <input
                          placeholder="CVV"
                          type="password"
                          maxLength={4}
                          className="input-field"
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              cvv: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </div>
                      <input
                        placeholder="Name on Card"
                        className="input-field w-full"
                        value={cardDetails.name}
                        onChange={(e) =>
                          setCardDetails({
                            ...cardDetails,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  {selectedPaymentMode === "upi" && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                        Pay via any UPI App (GPay, PhonePe, Paytm)
                      </p>
                      <input
                        placeholder="Enter UPI ID (e.g. 9876543210@ybl, user@okicici)"
                        className="input-field w-full"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                      />
                    </div>
                  )}

                  {selectedPaymentMode === "wallet" && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 mb-2">
                        Select your preferred wallet for seamless payment
                      </p>
                      <select
                        className="input-field w-full"
                        value={walletOpt}
                        onChange={(e) => setWalletOpt(e.target.value)}
                      >
                        <option value="paytm">Paytm Wallet</option>
                        <option value="amazon">Amazon Pay</option>
                        <option value="mobikwik">MobiKwik</option>
                        <option value="freecharge">Freecharge</option>
                      </select>
                    </div>
                  )}

                  {selectedPaymentMode === "emi" && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 mb-2">
                        Select EMI or PayLater option
                      </p>
                      <select className="input-field w-full">
                        <option>Simpl PayLater</option>
                        <option>Lazypay</option>
                        <option>Bajaj Finserv EMI Card</option>
                        <option>HDFC Bank Credit Card EMI</option>
                      </select>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-4 mt-6 bg-[var(--color-primary)] text-white font-bold rounded-xl shadow-lg hover:bg-[var(--color-primary-dark)] transition-all text-lg flex items-center justify-center gap-2"
                >
                  Pay ₹{total.toLocaleString()} Securely
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="bg-white dark:bg-white p-6 rounded-2xl h-fit border border-gray-200 dark:border-gray-200 shadow-sm sticky top-24">
          <h3 className="font-bold text-xl mb-4 text-slate-900 dark:text-white">Order Summary</h3>
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item._id} className="flex gap-3">
                <img
                  src={item.image}
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                />
                <div>
                  <p className="font-bold text-sm line-clamp-2 text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{item.artistName}</p>
                  <p className="text-sm font-bold text-[var(--color-primary)]">
                    ₹{item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-500">Subtotal</span>
              <span className="font-medium text-slate-900 dark:text-white">₹{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="font-medium text-green-500">Free</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed border-gray-200 dark:border-gray-200 mt-2 text-slate-900 dark:text-white">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
                .input-field {
                    @apply w-full px-4 py-3 rounded-xl bg-white dark:bg-white border border-gray-200 dark:border-gray-300 focus:border-[var(--color-primary)] outline-none text-slate-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-400;
                }
            `}</style>
    </div>
  );
};

export default CheckoutPage;
