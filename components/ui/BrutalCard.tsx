'use client';

import { ReactNode } from 'react';

interface BrutalCardProps {
  children: ReactNode;
  variant?: 'white' | 'yellow' | 'pink' | 'blue';
  size?: 'normal' | 'large';
  className?: string;
}

export function BrutalCard({
  children,
  variant = 'white',
  size = 'normal',
  className = '',
}: BrutalCardProps) {
  const sizeClasses = {
    normal: 'p-5',
    large: 'p-8',
  };

  const variantClasses = {
    white: 'brutal-card',
    yellow: 'brutal-card brutal-card-colored brutal-card-yellow',
    pink: 'brutal-card brutal-card-colored brutal-card-pink',
    blue: 'brutal-card brutal-card-colored brutal-card-blue',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </div>
  );
}

export default BrutalCard;
