"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

export default function ProfileBuilder() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Profile</h1>
          <p className="mt-2 text-sm text-gray-500">Manage your academic and contact details.</p>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <TextInput type="text" placeholder="First Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <TextInput type="text" placeholder="Last Name" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
            <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
              <option value="">Select your batch...</option>
              <option value="pgp1">PGP 1</option>
              <option value="pgp2">PGP 2</option>
              <option value="abm1">ABM 1</option>
              <option value="abm2">ABM 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea 
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand min-h-[120px]" 
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" size="lg">
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
