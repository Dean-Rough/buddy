"use client";

import { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  videoSrc: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
  className?: string;
}

export function VideoBackground({ 
  videoSrc, 
  overlay = true, 
  overlayOpacity = 0.7,
  children,
  className = ""
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.warn);
    }
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      {overlay && (
        <div 
          className="absolute inset-0 z-10 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
}

export default VideoBackground;