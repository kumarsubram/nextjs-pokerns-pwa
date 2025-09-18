import { useState, useEffect } from 'react';

/**
 * Hook to detect viewport height changes (useful for keyboard detection on mobile)
 * Returns true when viewport is significantly smaller (likely keyboard is open)
 */
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Get initial viewport height
    const initialVH = window.visualViewport?.height || window.innerHeight;
    setInitialHeight(initialVH);
    setViewportHeight(initialVH);

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      setViewportHeight(currentHeight);

      // Consider keyboard open if viewport is significantly smaller
      // Use a threshold of 150px to account for different keyboard heights
      const heightDifference = initialVH - currentHeight;
      setIsKeyboardOpen(heightDifference > 150);
    };

    // Use visualViewport if available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleViewportChange);
      return () => {
        window.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  return {
    viewportHeight,
    initialHeight,
    isKeyboardOpen,
    heightDifference: initialHeight - viewportHeight
  };
}