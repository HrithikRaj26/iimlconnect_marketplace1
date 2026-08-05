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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredVentureName, setRegisteredVentureName] = useState("");

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
    if (!acceptTerms) {
      setErrorMsg("You must accept the SLA terms and conditions before submitting your venture.");
      return;
    }
    setSubmitting(true);
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
        terms_accepted: acceptTerms,
      });

      setMyVentures([newVenture, ...myVentures]);
      setRegisteredVentureName(name);
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create venture profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setShowWizard(false);
    resetForm();
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
    setAcceptTerms(false);
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
      case "suspended":
        return <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white border border-red-700">Suspended</span>;
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

                  {/* Billing Details Panel (SLA Section) */}
                  {(v.status === "approved" || v.status === "suspended") && (
                    <BillingSection venture={v} onPaySuccess={loadMyData} />
                  )}
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VentureCategory)}
                    className="appearance-none block w-full rounded-xl border border-gray-200 pl-3 pr-10 py-2.5 text-sm font-bold text-gray-800 focus:border-orange-500 outline-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%25234b5563%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-[size:1.1rem_1.1rem] bg-no-repeat"
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

                {/* SLA Terms & Conditions Checkbox */}
                <div className="bg-orange-50/40 border border-orange-100/60 rounded-2xl p-5 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 h-4.5 w-4.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <div className="text-xs font-semibold text-gray-700 leading-relaxed">
                      I accept the <span className="font-extrabold text-orange-700">IIML Connect Venture SLA</span>. I agree to the platform commission terms (bi-weekly billing cycles starting 14 days after approval). I understand that failing to settle non-zero dues within 7 days past the billing deadline will result in indefinite suspension of my venture from the portal.
                    </div>
                  </label>
                </div>
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

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
            .confetti-particle {
              position: absolute;
              top: -20px;
              animation: confetti-fall 3s linear infinite;
            }
          `}</style>
          
          {/* Confetti container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(35)].map((_, i) => {
              const colors = ["#f97316", "#3b82f6", "#10b981", "#eab308", "#ec4899", "#8b5cf6"];
              const color = colors[i % colors.length];
              const left = `${Math.random() * 100}%`;
              const delay = `${Math.random() * 2.5}s`;
              const duration = `${2 + Math.random() * 2}s`;
              const size = `${6 + Math.random() * 8}px`;
              const shape = i % 2 === 0 ? "rounded-full" : "rounded-sm";
              return (
                <div
                  key={i}
                  className={`confetti-particle ${shape}`}
                  style={{
                    left,
                    backgroundColor: color,
                    width: size,
                    height: size,
                    animationDelay: delay,
                    animationDuration: duration,
                  }}
                />
              );
            })}
          </div>

          {/* Success Dialog */}
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 z-20 text-center space-y-6 scale-in-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500 border border-green-100 shadow-sm animate-bounce">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">🎉 Registration Submitted!</h3>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Awaiting Admin Moderation</p>
              <p className="text-sm font-medium text-gray-500 leading-relaxed pt-2">
                Congratulations! Your student venture <span className="font-extrabold text-gray-900">"{registeredVentureName}"</span> has been registered successfully.
              </p>
              <p className="text-xs text-gray-400 leading-relaxed bg-gray-50 p-3 rounded-xl border">
                It is now pending review. Once approved by our team, it will go live on the campus directory board and we will notify you at <span className="font-bold text-gray-600">{email}</span>!
              </p>
            </div>

            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full rounded-xl bg-orange-600 px-5 py-3 text-xs font-black text-white hover:bg-orange-700 shadow-md transition-colors"
            >
              Awesome! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface BillingSectionProps {
  venture: Venture;
  onPaySuccess: () => void;
}

function BillingSection({ venture, onPaySuccess }: BillingSectionProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [utr, setUtr] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(false);

  const start = new Date(venture.approved_at || venture.created_at);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - start.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const cyclesPassed = Math.floor(diffDays / 14);
  const nextBillingDate = new Date(start.getTime() + (cyclesPassed + 1) * 14 * 24 * 60 * 60 * 1000);
  const suspensionDeadline = new Date(nextBillingDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const hasDue = parseFloat(venture.current_due.toString()) > 0;
  const isSuspended = venture.status === "suspended";

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || utr.trim().length < 8) {
      setPayError("Please enter a valid Transaction Reference ID (at least 8 characters).");
      return;
    }

    setPaying(true);
    setPayError("");
    try {
      await ventureService.payVentureDue(venture.id);
      setPaySuccess(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaySuccess(false);
        setUtr("");
        onPaySuccess();
      }, 2000);
    } catch (err: any) {
      setPayError(err.message || "Failed to process mock payment.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-150 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-500">Billing Cycle:</span>
            <span className="font-semibold text-gray-800 bg-gray-100 rounded px-1.5 py-0.5">Bi-Weekly</span>
          </div>
          <div className="text-[11px] font-semibold text-gray-400">
            Next Cycle Date: {nextBillingDate.toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Platform Due</div>
            <div className={`text-base font-black ${hasDue ? "text-red-600" : "text-green-600"}`}>
              ₹{parseFloat(venture.current_due.toString()).toFixed(2)}
            </div>
          </div>
          
          {hasDue && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-2 font-black transition-colors"
            >
              Pay Due
            </button>
          )}
        </div>
      </div>

      {/* Warning/Alert States */}
      {isSuspended ? (
        <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-3 text-[11px] font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>SLA VIOLATION: This venture is suspended due to unpaid platform balance. Pay the due to instantly lift suspension.</span>
        </div>
      ) : hasDue ? (
        <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-xl p-3 text-[11px] font-bold flex items-center gap-2">
          <span>⏰</span>
          <span>Grace Period Active: Settle balance before {suspensionDeadline.toLocaleDateString(undefined, { dateStyle: 'medium' })} to avoid automatic suspension.</span>
        </div>
      ) : (
        <div className="bg-green-50 text-green-700 border border-green-100 rounded-xl p-3 text-[11px] font-bold flex items-center gap-2">
          <span>✓</span>
          <span>Account active and fully compliant with SLA terms. No dues pending.</span>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 relative space-y-6 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-extrabold text-sm"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-gray-900">SLA Balance Payment</h3>
              <p className="text-xs font-semibold text-gray-400">Scan & Pay via UPI</p>
            </div>

            {paySuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-500 border border-green-100 shadow-sm animate-bounce">
                  ✓
                </div>
                <h4 className="text-sm font-extrabold text-gray-800">Payment Verified!</h4>
                <p className="text-xs text-gray-500">Your venture status has been restored.</p>
              </div>
            ) : (
              <form onSubmit={handlePay} className="space-y-4">
                {/* Styled CSS QR Code Box */}
                <div className="mx-auto h-36 w-36 bg-gray-50 border rounded-2xl flex flex-col items-center justify-center p-2.5 relative group cursor-pointer shadow-inner">
                  <div className="grid grid-cols-6 gap-0.5 w-full h-full opacity-80 group-hover:opacity-100 transition-opacity">
                    {[...Array(36)].map((_, idx) => {
                      const isPattern = (idx % 5 === 0) || (idx < 6) || (idx > 30) || (idx % 6 === 0);
                      return (
                        <div
                          key={idx}
                          className={`rounded-xs ${isPattern ? "bg-gray-800" : "bg-transparent"}`}
                        />
                      );
                    })}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-2 py-1 rounded-md text-[9px] font-black border text-orange-600 shadow-sm">
                      UPI QR
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-1 text-xs">
                  <p className="font-bold text-gray-800">Payable: ₹{parseFloat(venture.current_due.toString()).toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400">UPI ID: iimlconnect@upi</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Transaction reference ID (UTR)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 12-digit UTR/Ref ID"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2.5 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {payError && (
                  <p className="text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                    ⚠️ {payError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={paying}
                  className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-xs font-black shadow-md transition-colors disabled:opacity-50"
                >
                  {paying ? "Verifying..." : "Confirm Payment 🚀"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
