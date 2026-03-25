// src/components/AmenityImage.tsx
// Shared image component with shimmer → fade-in → gradient fallback

import React, { useState, useCallback } from 'react';

interface AmenityImageProps {
  src?: string | null;
  alt: string;
  fallbackGradient?: string;
  fallbackEmoji?: string;
  className?: string;
  aspectRatio?: string; // e.g. "176/224", "16/9"
  priority?: boolean;
  overlay?: boolean; // bottom gradient for text readability
}

export const AmenityImage: React.FC<AmenityImageProps> = ({
  src,
  alt,
  fallbackGradient = 'linear-gradient(160deg, #1a1a25 0%, #0a0a0f 100%)',
  fallbackEmoji,
  className = '',
  aspectRatio,
  priority = false,
  overlay = true,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const hasImage = !!src && !errored;

  const onLoad = useCallback(() => setLoaded(true), []);
  const onError = useCallback(() => setErrored(true), []);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: fallbackGradient,
        aspectRatio: aspectRatio || undefined,
      }}
    >
      {/* Shimmer while loading */}
      {hasImage && !loaded && (
        <div className="absolute inset-0 animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
      )}

      {/* Image */}
      {hasImage && (
        <img
          src={src!}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={onLoad}
          onError={onError}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}

      {/* Fallback emoji when no image */}
      {!hasImage && fallbackEmoji && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl opacity-20">{fallbackEmoji}</span>
        </div>
      )}

      {/* Bottom overlay gradient for text readability */}
      {overlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.92) 100%)',
          }}
        />
      )}
    </div>
  );
};

export default AmenityImage;
