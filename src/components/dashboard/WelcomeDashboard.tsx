"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlobalSearchBar from "./GlobalSearchBar";
import StreakWidget from "./StreakWidget";
import { 
  ShoppingBag, 
  PlusCircle, 
  Search, 
  CheckCircle, 
  Rocket, 
  ShieldAlert,
  ChevronDown,
  Box
} from "lucide-react";

export default function WelcomeDashboard({ session }: { session: any }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [userId, setUserId] = useState("");
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
      setUserId(session.user.id);

      if (session.user.email === 'pgp41298@iiml.ac.in') {
        setIsAdmin(true);
      }
    }
  }, [session]);

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    isNew = false,
    colorClass = "text-gray-700" 
  }: any) => (
    <div 
      onClick={onClick}
      className="flex flex-col items-center justify-start group cursor-pointer w-24 mx-2"
    >
      <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-200 mb-3 ${colorClass}`}>
        <Icon strokeWidth={1.5} size={28} />
      </div>
      <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300 text-center leading-tight mb-1 group-hover:text-gray-900 dark:group-hover:text-white">
        {label}
      </span>
      {isNew && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          New
        </span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950 flex flex-col items-center pt-8 md:pt-16 px-4 transition-colors">
      <GlobalSearchBar firstName={firstName} />

      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-stretch justify-center bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 gap-8 md:gap-0 transition-colors">
        
        {/* MARKETPLACE SUITE */}
        <div className="flex-1 flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-100 pb-8 md:pb-0 relative">
          <div className="flex items-center text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-8 cursor-pointer hover:text-gray-600 transition-colors">
            Marketplace <ChevronDown size={12} className="ml-1" />
          </div>
          <div className="flex flex-row items-start justify-center flex-wrap gap-4">
            <ActionButton 
              icon={ShoppingBag} 
              label="Search Listings" 
              onClick={() => router.push("/marketplace")}
              colorClass="text-blue-600"
            />
            <ActionButton 
              icon={PlusCircle} 
              label="Add Listing" 
              onClick={() => router.push("/marketplace/new")}
              colorClass="text-blue-600"
            />
          </div>
        </div>

        {/* LOST AND FOUND SUITE */}
        <div className="flex-1 flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-100 pb-8 md:pb-0 relative">
          <div className="flex items-center text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-8 cursor-pointer hover:text-gray-600 transition-colors">
            Lost & Found <ChevronDown size={12} className="ml-1" />
          </div>
          <div className="flex flex-row items-start justify-center flex-wrap gap-4">
            <ActionButton 
              icon={Box} 
              label="Browse Items" 
              onClick={() => router.push("/lost-found?tab=found")}
              colorClass="text-purple-600"
            />
            <ActionButton 
              icon={Search} 
              label="Report Lost" 
              onClick={() => router.push("/lost-found/report/lost")}
              colorClass="text-purple-600"
            />
            <ActionButton 
              icon={CheckCircle} 
              label="Report Found" 
              onClick={() => router.push("/lost-found/report/found")}
              colorClass="text-purple-600"
            />
          </div>
        </div>

        {/* VENTURES SUITE */}
        <div className="flex-1 flex flex-col items-center relative">
          <div className="flex items-center text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-8 cursor-pointer hover:text-gray-600 transition-colors">
            Student Ventures <ChevronDown size={12} className="ml-1" />
          </div>
          <div className="flex flex-row items-start justify-center flex-wrap gap-4">
            <ActionButton 
              icon={Rocket} 
              label="Explore Hub" 
              onClick={() => router.push("/ventures")}
              colorClass="text-orange-600"
            />
            <ActionButton 
              icon={PlusCircle} 
              label="Register Venture" 
              onClick={() => router.push("/ventures/new")}
              colorClass="text-orange-600"
            />
          </div>
        </div>

      </div>

      {/* Activity Streaks Widget */}
      {userId && <StreakWidget userId={userId} />}

      {/* ADMIN CONSOLE */}
      {isAdmin && (
        <div className="mt-12 mb-8">
          <button 
            onClick={() => router.push("/admin")}
            className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-100 text-sm font-medium"
          >
            <ShieldAlert size={16} className="mr-2" />
            Admin Console
          </button>
        </div>
      )}

    </div>
  );
}
