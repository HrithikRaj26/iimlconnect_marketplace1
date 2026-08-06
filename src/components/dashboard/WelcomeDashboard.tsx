"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import GlobalSearchBar from "./GlobalSearchBar";
import { 
  ShoppingBag, 
  PlusCircle, 
  Search, 
  CheckCircle, 
  Rocket, 
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Inbox,
  Lock
} from "lucide-react";

export default function WelcomeDashboard({ session }: { session: any }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session) {
      const metadata = session.user.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || '';
      let fName = metadata.given_name || metadata.first_name || '';
      if (!fName && fullName) {
        fName = fullName.split(' ')[0];
      }
      setFirstName(fName);

      // Admin verification
      if (session.user.email === 'pgp41103@iiml.ac.in') {
        setIsAdmin(true);
      }
    }
  }, [session]);

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const cardVariants: any = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] dark:bg-gray-950 flex flex-col items-center pt-6 md:pt-12 px-4 pb-20 overflow-hidden transition-colors duration-300">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-[10%] left-[5%] -z-10 w-72 md:w-96 h-72 md:h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[15%] right-[5%] -z-10 w-72 md:w-96 h-72 md:h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute bottom-[20%] left-[25%] -z-10 w-80 md:w-[450px] h-80 md:h-[450px] bg-orange-400/15 dark:bg-orange-600/5 rounded-full blur-[80px] md:blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />

      {/* Hero Welcome & Search Section */}
      <GlobalSearchBar firstName={firstName} />

      {/* Main Suite Showcase Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch"
      >
        {/* MARKETPLACE SUITE */}
        <motion.div 
          variants={cardVariants}
          className="group relative flex flex-col justify-between bg-white/70 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl hover:border-blue-500/20 dark:hover:border-blue-500/35 transition-all duration-300 hover:-translate-y-2"
        >
          {/* Card Accent Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-500/10 rounded-bl-full group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-all duration-300 -z-10" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 px-3 py-1 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                🛒 Peer Exchange
              </span>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Marketplace
            </h3>
            
            <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed">
              Buy, sell, or rent textbooks, bicycles, electronics, and hostel essentials from verified campus students safely.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push("/marketplace")}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <span>Search Listings</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => router.push("/marketplace/new")}
              className="w-full py-3 px-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <PlusCircle size={14} />
              <span>Add Listing</span>
            </button>
          </div>
        </motion.div>

        {/* LOST AND FOUND SUITE */}
        <motion.div 
          variants={cardVariants}
          className="group relative flex flex-col justify-between bg-white/70 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl hover:border-purple-500/20 dark:hover:border-purple-500/35 transition-all duration-300 hover:-translate-y-2"
        >
          {/* Card Accent Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 dark:bg-purple-500/10 rounded-bl-full group-hover:bg-purple-500/10 dark:group-hover:bg-purple-500/20 transition-all duration-300 -z-10" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/50 px-3 py-1 text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                🔍 Campus Inventory
              </span>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Lost & Found
            </h3>
            
            <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed">
              Retrieve misplaced belongings, keys, or wallets, or report found items instantly using our automated campus match queue.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push("/lost-found?tab=found")}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <span>Browse Items</span>
              <ArrowRight size={14} />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => router.push("/lost-found/report/lost")}
                className="py-3 px-2 rounded-2xl border border-purple-200 dark:border-purple-900/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-purple-600 dark:text-purple-400 font-extrabold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <Search size={12} />
                <span>Lost Item</span>
              </button>
              <button
                onClick={() => router.push("/lost-found/report/found")}
                className="py-3 px-2 rounded-2xl border border-purple-200 dark:border-purple-900/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-purple-600 dark:text-purple-400 font-extrabold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle size={12} />
                <span>Found Item</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* VENTURES SUITE */}
        <motion.div 
          variants={cardVariants}
          className="group relative flex flex-col justify-between bg-white/70 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-800 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-2xl hover:border-orange-500/20 dark:hover:border-orange-500/35 transition-all duration-300 hover:-translate-y-2"
        >
          {/* Card Accent Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 dark:bg-orange-500/10 rounded-bl-full group-hover:bg-orange-500/10 dark:group-hover:bg-orange-500/20 transition-all duration-300 -z-10" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-100 dark:border-orange-900/50 px-3 py-1 text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">
                🚀 Campus Startups
              </span>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              Student Ventures
            </h3>
            
            <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed">
              Explore student-run food outlets, laundry, tech services, and support peer entrepreneurs directly on campus.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => router.push("/ventures")}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/10 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <span>Explore Hub</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => router.push("/ventures/new")}
              className="w-full py-3 px-4 rounded-2xl border border-orange-200 dark:border-orange-900/50 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <PlusCircle size={14} />
              <span>Register Venture</span>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* E2EE Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-12 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm"
      >
        <Lock size={12} />
        <span>IIML Student Network • SSL Secure & End-to-End Cryptography Enabled</span>
      </motion.div>

      {/* ADMIN CONSOLE */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10"
        >
          <button 
            onClick={() => router.push("/admin")}
            className="flex items-center px-5 py-2.5 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl transition-all border border-red-500/10 text-xs font-extrabold shadow-sm active:scale-95"
          >
            <ShieldAlert size={14} className="mr-2 animate-pulse" />
            Moderation Admin Console
          </button>
        </motion.div>
      )}
    </div>
  );
}
