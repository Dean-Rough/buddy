'use client';

import { useState } from 'react';

interface ChildProfileCreatorProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChildProfileCreator({
  onSuccess,
  onCancel,
}: ChildProfileCreatorProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    pin: '',
    confirmPin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (formData.pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age),
          pin: formData.pin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to create profile');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Create Child Profile
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Child&apos;s Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="age"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Age
          </label>
          <select
            id="age"
            value={formData.age}
            onChange={e => handleChange('age', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select age</option>
            {[6, 7, 8, 9, 10, 11, 12].map(age => (
              <option key={age} value={age}>
                {age} years old
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="pin"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Create PIN (4-6 digits)
          </label>
          <input
            type="password"
            id="pin"
            value={formData.pin}
            onChange={e =>
              handleChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={6}
            required
          />
        </div>

        <div>
          <label
            htmlFor="confirmPin"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm PIN
          </label>
          <input
            type="password"
            id="confirmPin"
            value={formData.confirmPin}
            onChange={e =>
              handleChange(
                'confirmPin',
                e.target.value.replace(/\D/g, '').slice(0, 6)
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={6}
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
