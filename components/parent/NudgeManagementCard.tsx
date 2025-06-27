/**
 * Nudge Management Card Component
 * Allows parents to create and manage organic conversation nudges
 */

'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Plus, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ParentNudge {
  id: string;
  targetTopic: string;
  naturalPhrasing: string;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  scheduledFor?: string;
  currentAttempts: number;
  maxAttempts: number;
}

interface NudgeQueueStatus {
  pendingNudges: ParentNudge[];
  queueHealth: 'healthy' | 'backed_up' | 'stalled';
  recommendations: string[];
}

interface NudgeFormData {
  targetTopic: string;
  naturalPhrasing: string;
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  context?: string;
  scheduledFor?: string;
}

export function NudgeManagementCard({ childAccountId }: { childAccountId?: string }) {
  const [nudges, setNudges] = useState<ParentNudge[]>([]);
  const [queueStatus, setQueueStatus] = useState<NudgeQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<NudgeFormData>({
    targetTopic: '',
    naturalPhrasing: '',
    urgency: 'medium',
  });

  useEffect(() => {
    if (childAccountId) {
      fetchNudgeQueue();
    }
  }, [childAccountId]);

  const fetchNudgeQueue = async () => {
    if (!childAccountId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/nudges/queue?childAccountId=${childAccountId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch nudge queue');
      }
      
      setNudges(data.pendingNudges || []);
      setQueueStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nudges');
    } finally {
      setLoading(false);
    }
  };

  const createNudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childAccountId) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/nudges/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childAccountId,
          ...formData,
          maxAttempts: 3,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create nudge');
      }
      
      // Reset form and refresh queue
      setFormData({
        targetTopic: '',
        naturalPhrasing: '',
        urgency: 'medium',
      });
      setShowForm(false);
      await fetchNudgeQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create nudge');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelNudge = async (nudgeId: string) => {
    try {
      const response = await fetch(`/api/nudges/${nudgeId}/cancel`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel nudge');
      }
      
      await fetchNudgeQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel nudge');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!childAccountId) {
    return (
      <div className="bg-white border-2 border-black p-8 shadow-brutal">
        <p className="text-gray-600">Select a child to manage nudges</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border-2 border-black p-8 shadow-brutal">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-black p-8 shadow-brutal">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Organic Nudges</h3>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 bg-purple-500 text-white border-2 border-black shadow-brutal
                   hover:bg-purple-600 hover:-translate-y-0.5 hover:shadow-brutal-lg transition-all"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {queueStatus && queueStatus.queueHealth !== 'healthy' && (
        <div className="mb-4 p-4 bg-yellow-100 border-2 border-yellow-500">
          <p className="font-bold mb-2">Queue Status: {queueStatus.queueHealth}</p>
          <ul className="text-sm space-y-1">
            {queueStatus.recommendations.map((rec, i) => (
              <li key={i}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-6 bg-purple-50 border-2 border-purple-300">
          <h4 className="font-bold mb-4">Create Natural Reminder</h4>
          <form onSubmit={createNudge} className="space-y-4">
            <div>
              <label className="block font-medium mb-2">
                What topic should Onda naturally mention?
              </label>
              <input
                type="text"
                value={formData.targetTopic}
                onChange={(e) => setFormData({ ...formData, targetTopic: e.target.value })}
                placeholder="e.g., piano practice, homework, bedtime"
                className="w-full px-4 py-2 border-2 border-black"
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-2">
                How should Onda phrase it naturally?
              </label>
              <textarea
                value={formData.naturalPhrasing}
                onChange={(e) => setFormData({ ...formData, naturalPhrasing: e.target.value })}
                placeholder="e.g., 'remember you have piano practice this afternoon' or 'how's your science project coming along?'"
                className="w-full px-4 py-2 border-2 border-black h-20 resize-none"
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                className="w-full px-4 py-2 border-2 border-black"
              >
                <option value="low">When convenient</option>
                <option value="medium">Today if possible</option>
                <option value="high">As soon as natural</option>
                <option value="immediate">Next conversation</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2">
                Additional context (optional)
              </label>
              <input
                type="text"
                value={formData.context || ''}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                placeholder="e.g., 'She has a recital on Saturday'"
                className="w-full px-4 py-2 border-2 border-black"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-purple-500 text-white font-bold border-2 border-black 
                         shadow-brutal hover:bg-purple-600 hover:-translate-y-0.5 hover:shadow-brutal-lg 
                         transition-all disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Nudge'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 font-bold border-2 border-black 
                         shadow-brutal hover:bg-gray-300 hover:-translate-y-0.5 hover:shadow-brutal-lg 
                         transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {nudges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No active nudges</p>
            <p className="text-sm mt-1">Create one to naturally guide conversations</p>
          </div>
        ) : (
          nudges.map((nudge) => (
            <div
              key={nudge.id}
              className="p-4 border-2 border-gray-300 hover:border-black transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(nudge.status)}
                    <span className="font-bold">{nudge.targetTopic}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getUrgencyColor(nudge.urgency)}`}>
                      {nudge.urgency}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">"{nudge.naturalPhrasing}"</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Attempts: {nudge.currentAttempts}/{nudge.maxAttempts}</span>
                    <span>Created: {new Date(nudge.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {nudge.status === 'pending' && (
                  <button
                    onClick={() => cancelNudge(nudge.id)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                    title="Cancel nudge"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300">
        <h4 className="font-bold mb-2">How Organic Nudging Works</h4>
        <p className="text-sm text-gray-700 mb-2">
          Onda will naturally weave your reminders into conversation when the timing 
          feels right. Your child won't know these are parent-directed - they'll 
          feel like natural conversation flow.
        </p>
        <p className="text-sm text-gray-600">
          <strong>Example:</strong> If your child mentions being tired, Onda might say 
          "Speaking of energy, how's your piano practice going? I remember you have 
          that recital coming up!"
        </p>
      </div>
    </div>
  );
}