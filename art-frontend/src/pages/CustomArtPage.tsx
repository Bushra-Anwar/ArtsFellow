import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Calendar, DollarSign, Send, CheckCircle, WandSparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const CustomArtPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Form State
  const [request, setRequest] = useState({
    description: "",
    style: "Oil Painting", // Default
    size: 'Medium (24x36")',
    budget: "$100 - $300",
    deadline: "",
    signatureRequirement: "With Signature",
    signaturePlacement: "Front Side",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleGenerateAIPreview = async () => {
    if (!request.description) {
      alert("Please enter a description first!");
      return;
    }
    try {
      setGeneratingAI(true);
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ prompt: request.description }),
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setPreview(data.imageUrl);
        setFile(null); // Clear file since we are using AI preview
      } else {
        alert("Failed to generate image: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to AI service.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      window.dispatchEvent(new Event("open-login-modal"));
      return;
    }

    try {
      setLoading(true);
      let imageUrl = "";

      // Upload Image if present
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) imageUrl = uploadData.url;
      }

      // Submit Request
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: user._id,
          clientName: user.name,
          clientEmail: user.email,
          ...request,
          referenceImage: imageUrl,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        alert("Failed to submit request.");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting request");
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900 p-10 rounded-3xl text-center max-w-lg border border-purple-500/30"
        >
          <div className="w-24 h-24 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Request Sent!</h2>
          <p className="text-[var(--text-muted)] mb-8">
            Your custom art request has been sent to our artist network. You
            will receive quotes (notification) within 24 hours.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFile(null);
              setPreview(null);
            }}
            className="px-8 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl"
          >
            Submit Another Request
          </button>
          <button
            onClick={() => navigate("/")}
            className="block mt-4 text-[var(--color-primary)] hover:underline mx-auto"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-transparent pt-24 px-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 dark:text-white">
            Commission Custom Art
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Can't find what you're looking for? Upload a reference or describe
            your dream artwork.
          </p>
        </div>

        <div className="bg-white dark:bg-[var(--bg-primary)]/50 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row">
          {/* Visual Side */}
          <div className="md:w-1/3 bg-[var(--color-primary)]/10 p-8 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xl dark:text-white mb-4">
                How it works
              </h3>
              <ul className="space-y-6">
                {[
                  {
                    title: "Describe Vision",
                    desc: "Tell us about colors, mood & size.",
                  },
                  {
                    title: "Upload Reference",
                    desc: "Share images for inspiration.",
                  },
                  {
                    title: "Get Quotes",
                    desc: "Artists will bid on your project.",
                  },
                  {
                    title: "Final Delivery",
                    desc: "Receive your custom masterpiece.",
                  },
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[var(--card-bg)] flex items-center justify-center font-bold text-[var(--color-primary)] shadow-sm shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form Side */}
          <div className="md:w-2/3 p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="font-bold text-xs uppercase text-gray-500">
                  What do you want created?
                </label>
                <input
                  required
                  type="text"
                  className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 outline-none focus:border-[var(--color-primary)] transition-all"
                  placeholder="e.g. A digital cyberpunk city landscape"
                  value={request.description}
                  onChange={(e) =>
                    setRequest({ ...request, description: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={handleGenerateAIPreview}
                  disabled={generatingAI}
                  className="mt-2 text-sm text-[var(--color-primary)] font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
                >
                  <WandSparkles size={16} />
                  {generatingAI ? "Generating Preview..." : "Generate AI Preview"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-bold text-xs uppercase text-gray-500">
                    Style / Medium
                  </label>
                  <select
                    className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 outline-none focus:border-[var(--color-primary)]"
                    value={request.style}
                    onChange={(e) =>
                      setRequest({ ...request, style: e.target.value })
                    }
                  >
                    <option>Oil Painting</option>
                    <option>Acrylic Painting</option>
                    <option>Digital Art (2D)</option>
                    <option>Digital Art (3D)</option>
                    <option>Watercolor</option>
                    <option>Charcoal Sketch</option>
                    <option>Pencil Sketch</option>
                    <option>Mixed Media</option>
                    <option>Sculpture</option>
                    <option>Photography</option>
                    <option>Vector Art</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-xs uppercase text-gray-500">
                    Size
                  </label>
                  <select
                    className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 outline-none focus:border-[var(--color-primary)]"
                    value={request.size}
                    onChange={(e) =>
                      setRequest({ ...request, size: e.target.value })
                    }
                  >
                    <option>Small (12x16")</option>
                    <option>Medium (24x36")</option>
                    <option>Large (48x60")</option>
                    <option>Custom Size</option>
                    <option>Digital (4K Resolution)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-bold text-xs uppercase text-gray-500 flex items-center gap-1">
                    <DollarSign size={14} /> Budget Range
                  </label>
                  <select
                    className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 outline-none focus:border-[var(--color-primary)]"
                    value={request.budget}
                    onChange={(e) =>
                      setRequest({ ...request, budget: e.target.value })
                    }
                  >
                    <option>$50 - $100</option>
                    <option>$100 - $300</option>
                    <option>$300 - $1000</option>
                    <option>$1000 - $5000</option>
                    <option>$5000+</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-xs uppercase text-gray-500 flex items-center gap-1">
                    <Calendar size={14} /> Deadline
                  </label>
                  <input
                    type="date"
                    className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 outline-none focus:border-[var(--color-primary)]"
                    value={request.deadline}
                    onChange={(e) =>
                      setRequest({ ...request, deadline: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-bold text-xs uppercase text-gray-500">
                    Signature Requirement
                  </label>
                  <select
                    className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 outline-none focus:border-[var(--color-primary)]"
                    value={request.signatureRequirement}
                    onChange={(e) =>
                      setRequest({ ...request, signatureRequirement: e.target.value })
                    }
                  >
                    <option>With Signature</option>
                    <option>Without Signature</option>
                  </select>
                </div>
                {request.signatureRequirement === "With Signature" && (
                  <div className="space-y-2">
                    <label className="font-bold text-xs uppercase text-gray-500">
                      Signature Placement
                    </label>
                    <select
                      className="w-full p-4 rounded-xl bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 outline-none focus:border-[var(--color-primary)]"
                      value={request.signaturePlacement}
                      onChange={(e) =>
                        setRequest({ ...request, signaturePlacement: e.target.value })
                      }
                    >
                      <option>Front Side</option>
                      <option>Back Side</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-bold text-xs uppercase text-gray-500">
                  Reference Image (Optional)
                </label>
                <label
                  className={`block border-2 border-dashed ${preview ? "border-[var(--color-primary)]" : "border-gray-200 dark:border-slate-700"} rounded-xl p-6 text-center hover:border-[var(--color-primary)] transition-colors cursor-pointer relative overflow-hidden`}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="mx-auto h-40 object-cover rounded-md"
                    />
                  ) : (
                    <>
                      <Upload className="mx-auto text-[var(--text-muted)] mb-2" />
                      <p className="text-sm text-gray-500">
                        Click to upload inspiration
                      </p>
                    </>
                  )}
                </label>
              </div>

              <button
                disabled={loading}
                className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-lg hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={20} /> Submit Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomArtPage;
