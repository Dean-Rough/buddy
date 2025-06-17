'use client';

import React, { useState } from 'react';
import BrutalButton from '@/components/ui/BrutalButton';
import BrutalInput from '@/components/ui/BrutalInput';

interface ChildAccount {
  id: string;
  name: string;
  username: string;
  age: number;
  createdAt: string;
  accountStatus: string;
}

interface ChildProfileCreatorProps {
  onChildCreated: (child: ChildAccount) => void;
  onCancel: () => void;
}

export default function ChildProfileCreator({
  onChildCreated,
  onCancel,
}: ChildProfileCreatorProps) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    age: '',
    pin: '',
    confirmPin: '',
    favoriteActivity: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username =
        'Username must be 3-20 characters, letters, numbers, and underscores only';
    }

    // Age validation
    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age)) {
      newErrors.age = 'Age is required';
    } else if (age < 6 || age > 12) {
      newErrors.age = 'Age must be between 6 and 12';
    }

    // PIN validation
    if (!formData.pin) {
      newErrors.pin = 'PIN is required';
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'PIN must be exactly 4 digits';
    }

    // Confirm PIN validation
    if (formData.pin !== formData.confirmPin) {
      newErrors.confirmPin = 'PINs do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/create-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username.toLowerCase().trim(),
          age: parseInt(formData.age),
          pin: formData.pin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Call the callback with the new child data
        onChildCreated(data.child);
      } else {
        // Handle specific errors
        if (data.error === 'Username already exists') {
          setErrors({ username: 'This username is already taken' });
        } else {
          setErrors({
            general: data.error || 'Failed to create child account',
          });
        }
      }
    } catch (error) {
      console.error('Error creating child account:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));

    // Clear error for this field when user starts typing
    Object.keys(updates).forEach(field => {
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {formError && (
        <div className="p-2 bg-red-100 border border-red-400 rounded mb-4 text-red-700">
          {formError}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="p-2 bg-green-100 border border-green-400 rounded mb-4 text-green-700">
          {successMessage}
        </div>
      )}

      {/* Child Name */}
      <div className="mb-4">
        <label className="block mb-1 font-bold">Child&apos;s Name</label>
        <BrutalInput
          type="text"
          value={formData.name}
          onChange={e => updateFormData({ name: e.target.value })}
          placeholder="Emma Smith"
          className="w-full"
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Username */}
      <div>
        <label className="block font-avotica font-bold mb-2">Username</label>
        <BrutalInput
          type="text"
          value={formData.username}
          onChange={e => handleInputChange('username', e.target.value)}
          placeholder="emma_cool"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-600 mt-1">
          3-20 characters, letters, numbers, and underscores only
        </p>
        {errors.username && (
          <p className="text-red-600 text-sm mt-1">{errors.username}</p>
        )}
      </div>

      {/* Age */}
      <div>
        <label className="block font-avotica font-bold mb-2">Age</label>
        <BrutalInput
          type="number"
          value={formData.age}
          onChange={e => handleInputChange('age', e.target.value)}
          placeholder="9"
          min="6"
          max="12"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-600 mt-1">
          Must be between 6 and 12 years old
        </p>
        {errors.age && (
          <p className="text-red-600 text-sm mt-1">{errors.age}</p>
        )}
      </div>

      {/* PIN */}
      <div>
        <label className="block font-avotica font-bold mb-2">4-Digit PIN</label>
        <BrutalInput
          type="password"
          value={formData.pin}
          onChange={e => handleInputChange('pin', e.target.value)}
          placeholder="••••"
          maxLength={4}
          disabled={isLoading}
          className="text-center text-2xl tracking-wide font-mono"
        />
        <p className="text-xs text-gray-600 mt-1">
          Used for child to log in to their account
        </p>
        {errors.pin && (
          <p className="text-red-600 text-sm mt-1">{errors.pin}</p>
        )}
      </div>

      {/* Confirm PIN */}
      <div>
        <label className="block font-avotica font-bold mb-2">Confirm PIN</label>
        <BrutalInput
          type="password"
          value={formData.confirmPin}
          onChange={e => handleInputChange('confirmPin', e.target.value)}
          placeholder="••••"
          maxLength={4}
          disabled={isLoading}
          className="text-center text-2xl tracking-wide font-mono"
        />
        {errors.confirmPin && (
          <p className="text-red-600 text-sm mt-1">{errors.confirmPin}</p>
        )}
      </div>

      {/* Favorite Activity */}
      <div className="mb-4">
        <label className="block mb-1 font-bold">
          What&apos;s your child&apos;s favorite activity?
        </label>
        <BrutalInput
          type="text"
          value={formData.favoriteActivity}
          onChange={e => updateFormData({ favoriteActivity: e.target.value })}
          placeholder="E.g. soccer, reading, drawing"
          className="w-full"
        />
      </div>

      {/* Safety Notice */}
      <div className="bg-blue-50 border-2 border-blue-300 p-4 brutal-shadow-small">
        <h4 className="font-avotica font-bold text-blue-800 mb-2">
          🛡️ Safety & Privacy
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• All conversations are monitored for safety</li>
          <li>• You&apos;ll receive alerts for any concerning content</li>
          <li>• Data is encrypted and COPPA compliant</li>
          <li>• You can delete the account and all data anytime</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <BrutalButton
          type="button"
          variant="white"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          CANCEL
        </BrutalButton>
        <BrutalButton
          type="submit"
          variant="green"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
        </BrutalButton>
      </div>
    </form>
  );
}
