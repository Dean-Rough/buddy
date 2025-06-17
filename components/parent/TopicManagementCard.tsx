'use client';

/**
 * Topic Management Card Component
 * Simplified version for deployment compatibility
 */

import React from 'react';

interface TopicManagementCardProps {
  childAccountId: string;
  childName: string;
}

export default function TopicManagementCard({ childAccountId, childName }: TopicManagementCardProps) {
  return (
    <div className="w-full p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="flex items-center mb-4">
        <div className="w-5 h-5 mr-2 bg-blue-600 rounded"></div>
        <h3 className="text-lg font-semibold text-gray-900">Content Control - {childName}</h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Advanced Content Filtering</h4>
          <p className="text-sm text-blue-700">
            Real-time content monitoring with intelligent categorization and parent alerts.
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Topic Management</h4>
          <p className="text-sm text-green-700">
            Create custom rules for topics your child discusses with AI-powered suggestions.
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Smart Alerts</h4>
          <p className="text-sm text-yellow-700">
            Instant notifications for concerning content with educational recommendations.
          </p>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
          <p className="text-xs text-gray-600 text-center">
            Full content control interface coming soon with topic rules, suggestions, and alert management.
          </p>
        </div>
      </div>
    </div>
  );
}