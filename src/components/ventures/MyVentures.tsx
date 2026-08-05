"use client";

import React, { useEffect, useState } from "react";
import { ventureService } from "@/services/ventureService";
import { Venture, VentureCategory, VentureStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { TextArea } from "@/components/ui/TextArea";
import { Stepper } from "@/components/ui/Stepper";
import { supabase } from "@/lib/supabase";

const PRESET_LOGOS = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&h=150&fit=crop", // Tech blue
  "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&h=150&fit=crop", // F&B Chai/Coffee
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150&h=150&fit=crop", // Fashion shopping
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&h=150&fit=crop", // Services/Resume prep
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=150&h=150&fit=crop", // Creative painting
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=150&h=150&fit=crop", // Business/Consulting
];

export default function MyVentures() {
  const [myVentures, setMyVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState("Verified Student");

  // Wizard state fields
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<VentureCategory>("Tech");
  const [logoUrl, setLogoUrl] = useState(PRESET_LOGOS[0]);
  const [offeringInput, setOfferingInput] = useState("");
  const [offerings, setOfferings] = useState<string[]>([]);
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadMyData = async () => {
    setLoading(true);
    try {
      const data = await ventureService.getMyVentures();
      setMyVentures(data);

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        const metadata = sessionData.session.user.user_metadata || {};
        setUserName(metadata.full_name || metadata.name || "Verified Student");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyData();
  }, []);

  const handleAddOffering = () => {
    const trimmed = offeringInput.trim();
    if (trimmed && !offerings.includes(trimmed)) {
      setOfferings([...offerings, trimmed]);
      setOfferingInput("");
    }
  };

  const handleRemoveOffering = (index: number) => {
    setOfferings(offerings.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!name.trim() || !tagline.trim() || !description.trim()) {
      setErrorMsg("Please complete all required fields on Step 1.");
      setCurrentStep(1);
      return;
    }

    const cleanWhatsapp = whatsapp.replace(/\s+/g, '');
    if (!cleanWhatsapp || !/^\+?[1-9]\d{9,14}$/.test(cleanWhatsapp)) {
      setErrorMsg("Please enter a valid WhatsApp number on Step 3.");
      setCurrentStep(3);
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg("Please enter a valid official Email ID on Step 3.");
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const newVenture = await ventureService.createVenture({
        name,
        tagline,
        description,
        category,
        logo_url: logoUrl,
        offerings,
        contact_links: {
          website: website.trim() || undefined,
          instagram: instagram.trim() || undefined,
          whatsapp: cleanWhatsapp,
          email: email.trim().toLowerCase(),
        },
      });

      setMyVentures([newVenture, ...myVentures]);
      setShowWizard(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create venture profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = () => {
    setErrorMsg("");
    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMsg("Venture name is required.");
        return;
      }
      if (!tagline.trim()) {
        setErrorMsg("Short tagline is required.");
        return;
      }
      if (!description.trim()) {
        setErrorMsg("Rich description is required.");
        return;
      }
    } else if (currentStep === 3) {
      const cleanWhatsapp = whatsapp.replace(/\s+/g, '');
      if (!cleanWhatsapp) {
        setErrorMsg("WhatsApp contact number is required.");
        return;
      }
      if (!/^\+?[1-9]\d{9,14}$/.test(cleanWhatsapp)) {
        setErrorMsg("Please enter a valid WhatsApp number with country code (digits only, e.g. 919999999999).");
        return;
      }
      if (!email.trim()) {
        setErrorMsg("Official Email ID is required.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMsg("Please enter a valid email address (e.g. startup@iiml.ac.in).");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const resetForm = () => {
    setName("");
    setTagline("");
    setDescription("");
    setCategory("Tech");
    setLogoUrl(PRESET_LOGOS[0]);
    setOfferings([]);
    setOfferingInput("");
    setWebsite("");
    setInstagram("");
    setWhatsapp("");
    setEmail("");
    setCurrentStep(1);
    setErrorMsg("");
  };

  const getStatusBadge = (status: VentureStatus) => {
    switch (status) {
      case "draft":
        return <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600 border border-gray-200">Draft</span>;
      case "pending_approval":
        return <span className="rounded bg-yellow-50 px-2 py-0.5 text-xs font-bold text-yellow-600 border border-yellow-100 animate-pulse">Pending Review</span>;
      case "approved":
        return <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-bold text-green-600 border border-green-100">Live</span>;
      case "rejected":
        return <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600 border border-red-100">Action Required</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!showWizard ? (
        <div className="space-y-6">
          {/* Top banner check */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">Manage Your Ventures</h2>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                You can list up to 3 campus startups, side-hustles, or freelance services (Currently: {myVentures.length}/3).
              </p>
            </div>
            {myVentures.length < 3 && (
              <button
                onClick={() => {
                  resetForm();
                  setShowWizard(true);
                }}
                className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-black text-white hover:bg-orange-700 transition-colors"
              >
                + Register New Venture
              </button>
            )}
          </div>

          {/* List display */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-6 border border-gray-200 h-28" />
              ))}
            </div>
          ) : myVentures.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 py-16 px-6 text-center">
              <span className="text-5xl">💼</span>
              <h3 className="mt-4 text-lg font-bold text-gray-900">No registered ventures yet</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-xs">
                Do you run a side project or startup on campus? Register now to get noticed by other students.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myVentures.map((v) => (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={v.logo_url || PRESET_LOGOS[0]}
                      alt={v.name}
                      className="h-14 w-14 rounded-xl object-cover border bg-gray-50"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-extrabold text-gray-900">{v.name}</h4>
                        {getStatusBadge(v.status)}
                      </div>
                      <p className="text-xs font-bold text-orange-600 mt-0.5">{v.category}</p>
                      <p className="text-xs font-medium text-gray-500 line-clamp-1 mt-1">{v.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <span className="text-xs font-semibold text-gray-400 pl-2">
                      ⭐ {v.average_rating} ({v.reviews_count} reviews)
                    </span>
                    {v.status === "approved" && (
                      <div className="flex items-center gap-2 border-l border-gray-150 pl-4">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${v.is_open ? "text-green-600" : "text-gray-400"}`}>
                          {v.is_open ? "Open" : "Closed"}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const updated = await ventureService.toggleVentureOpenStatus(v.id, !v.is_open);
                              setMyVentures(prev => prev.map(item => item.id === v.id ? updated : item));
                            } catch (err: any) {
                              alert(err.message || "Failed to toggle status.");
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            v.is_open ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              v.is_open ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Wizard layout container */
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Register Venture Profile Wizard</h3>
              <p className="text-xs text-gray-500">Fill in the campus directory card coordinates.</p>
            </div>
            <button
              onClick={() => setShowWizard(false)}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 bg-gray-50 border p-2 rounded-lg"
            >
              ✕ Exit Form
            </button>
          </div>

          {/* Wizard Stepper */}
          <Stepper
            currentIndex={currentStep}
            steps={[
              { label: "Identity", index: 1 },
              { label: "Brand & Media", index: 2 },
              { label: "Contact", index: 3 },
              { label: "Live Preview", index: 4 },
            ]}
          />

          <div className="pt-4">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4 max-w-xl">
                <TextInput
                  label="Venture/Startup Name *"
                  placeholder="e.g. Chai & Bytes, Campus Laundry"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <TextInput
                  label="Short Tagline *"
                  placeholder="e.g. Late-night tea & snacks delivered to your room."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  required
                />
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Category tag *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VentureCategory)}
                    className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-800 focus:border-orange-500 outline-none"
                  >
                    {PRESET_LOGOS.map((_, idx) => (
                      <option key={idx} value={["Tech", "F&B", "Fashion", "Consulting/Freelance", "Creative/Art", "Services"][idx]}>
                        {["Tech", "F&B", "Fashion", "Consulting/Freelance", "Creative/Art", "Services"][idx]}
                      </option>
                    ))}
                  </select>
                </div>
                <TextArea
                  label="Rich Description *"
                  placeholder="Tell students about your venture. When are you active? What makes you unique? How can students reach you?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                />
              </div>
            )}

            {/* Step 2: Pitch & Media */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Select Brand Logo */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Brand Logo Selection:</label>
                  <div className="flex flex-wrap gap-3">
                    {PRESET_LOGOS.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setLogoUrl(preset)}
                        className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                          logoUrl === preset ? "border-orange-500 scale-105 shadow-md" : "border-transparent opacity-75"
                        }`}
                      >
                        <img src={preset} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Image URL Option */}
                <div className="max-w-xl">
                  <TextInput
                    label="Or Custom Logo Image URL:"
                    placeholder="https://images.unsplash.com/..."
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                </div>

                {/* Offerings list builder */}
                <div className="max-w-xl space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Specific offerings & features:</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <TextInput
                        placeholder="e.g. Late night door-delivery, Custom Web dev..."
                        value={offeringInput}
                        onChange={(e) => setOfferingInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddOffering()}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddOffering}
                      className="rounded-xl bg-gray-900 px-4 text-xs font-black text-white hover:bg-gray-800"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {offerings.map((offering, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 border"
                      >
                        <span>{offering}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOffering(idx)}
                          className="text-red-500 hover:text-red-700 font-extrabold ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Social details */}
            {currentStep === 3 && (
              <div className="space-y-4 max-w-xl animate-in fade-in duration-150">
                <TextInput
                  label="Official Email ID *"
                  placeholder="startup@iiml.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <TextInput
                  label="WhatsApp Contact Number (digits with country code, e.g. 919999999999) *"
                  placeholder="919876543210"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                />
                <TextInput
                  label="Website URL"
                  placeholder="https://myventure.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <TextInput
                  label="Instagram Username (without @)"
                  placeholder="my_insta_handle"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
            )}

            {/* Step 4: Live Preview */}
            {currentStep === 4 && (
              <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50/50 space-y-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Public Details card Preview:</h4>
                <div className="bg-white rounded-2xl border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <img
                      src={logoUrl || PRESET_LOGOS[0]}
                      alt="Logo"
                      className="h-16 w-16 rounded-2xl object-cover border bg-gray-50 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-gray-900">{name || "My Venture Name"}</h3>
                        <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                          {category}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-500 mt-1">{tagline || "Your tagline will display here."}</p>
                      <p className="text-[10px] font-semibold text-gray-400 mt-1.5">
                        Founded by <span className="text-gray-700">{userName}</span> (Verified student)
                      </p>
                    </div>
                  </div>
                  <div className="text-center font-black text-orange-600 text-sm">
                    ★ 5.0 (0 reviews)
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Interactive description:</h5>
                  <p className="text-xs font-medium text-gray-600 bg-white p-4 rounded-xl border whitespace-pre-wrap leading-relaxed">
                    {description || "Provide a detailed description of your venture."}
                  </p>
                </div>

                {offerings.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Offerings list:</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {offerings.map((o, idx) => (
                        <span key={idx} className="rounded bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 border">
                          ✓ {o}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
              ⚠️ {errorMsg}
            </p>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(currentStep - 1)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              ← Back
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-black text-white hover:bg-gray-800 transition-colors"
              >
                Continue →
              </button>
            ) : (
              <Button onClick={handleSubmit} loading={submitting}>
                Submit for Approval
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
