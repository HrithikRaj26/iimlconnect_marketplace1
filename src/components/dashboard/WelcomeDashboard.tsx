"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

      if (session.user.email === 'pgp41298@iiml.ac.in') {
        setIsAdmin(true);
      }
    }
  }, [session]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {firstName ? `Welcome back, ${firstName}!` : "Welcome to IIML Connect"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Select a module to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => router.push("/marketplace")}
          className="group relative flex flex-col items-start justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
            <span className="text-2xl">🛒</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand">Buy and Sell</h3>
            <p className="mt-2 text-sm text-gray-500">
              Campus marketplace for verified students.
            </p>
          </div>
        </div>



        <a
          href="https://mobile-liart-alpha.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="group relative flex flex-col items-start justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">Lost and Found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Report and recover lost items on campus.
              </p>
            </div>
          </div>
        </a>

        <div className="group relative flex flex-col items-start justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-600 mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600">Student Venture Hub</h3>
            <p className="mt-2 text-sm text-gray-500">
              Explore and support student startups.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="group relative flex flex-col items-start justify-between rounded-2xl bg-red-50 p-6 border border-red-200 hover:shadow-md transition-shadow cursor-pointer md:col-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-700">Admin Console</h3>
              <p className="mt-2 text-sm text-red-500">
                Platform management and role assignments.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
