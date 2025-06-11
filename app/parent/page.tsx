"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import ChildProfileCreator from "@/components/auth/ChildProfileCreator";

interface Child {
  id: string;
  name: string;
  age: number;
  createdAt: string;
  accountStatus: string;
}

export default function ParentDashboard() {
  const { user, isLoaded } = useUser();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchChildren();
    }
  }, [isLoaded, user]);

  const fetchChildren = async () => {
    try {
      const response = await fetch("/api/children");
      const data = await response.json();
      setChildren(data.children || []);
    } catch (error) {
      console.error("Failed to fetch children:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchChildren();
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to access the parent dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user.firstName || "Parent"}\!
          </h1>
          <p className="text-gray-600">
            Manage your children's Buddy profiles and monitor their activity.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Child Profiles</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Child Profile
            </button>
          </div>

          {children.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">👶</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No child profiles yet</h3>
              <p className="text-gray-600">Create your first child profile to get started with Buddy.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => (
                <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {child.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900">{child.name}</h3>
                      <p className="text-sm text-gray-600">{child.age} years old</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {new Date(child.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      child.accountStatus === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {child.accountStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <ChildProfileCreator
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
