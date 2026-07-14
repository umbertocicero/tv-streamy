import { useState, useEffect, useRef } from 'react';
import { getTmdbPosterUrl, posterGradient } from '../../utils/format.js';

export default function LazyPoster({ item, size = 'md', onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const ref = useRef();

  // Lazy load con Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Carica immagine TMDB o fallback al gradiente
          if (item?.poster_path) {
            const url = getTmdbPosterUrl(item.poster_path);
            setImageUrl(url);
          }
          setLoaded(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '50px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [item?.poster_path]);

  const gradientStyle = item ? { background: posterGradient(item.title) } : {};

  return (
    <div
      ref={ref}
      className={`poster ${size}`}
      onClick={onClick}
      style={loaded && imageUrl ? {} : gradientStyle}
    >
      {loaded && imageUrl ? (
        <img
          src={imageUrl}
          alt={item?.title || 'Loading...'}
          onError={() => setImageUrl(null)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : loaded ? (
        // Fallback gradiente se immagine fallisce
        <span>{item?.title}</span>
      ) : (
        // Skeleton loading
        <div className="skeleton" style={{ width: '100%', height: '100%' }} />
      )}
      {item && <span>{item.title}</span>}
    </div>
  );
}
