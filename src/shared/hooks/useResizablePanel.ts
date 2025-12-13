import { useState, useCallback, useEffect } from 'react';

interface UseResizablePanelProps {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
}

/**
 * Manages the state and logic for creating a resizable panel.
 * Assumes resizing is happening from the left edge (dragging left expands).
 * Updates directly (not in requestAnimationFrame) to allow CSS transitions to animate smoothly during drag.
 */
export const useResizablePanel = ({
  initialWidth,
  minWidth,
  maxWidth,
}: UseResizablePanelProps) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent text selection while dragging
    setIsResizing(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;

    const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    
    setWidth(clampedWidth);
  }, [isResizing, minWidth, maxWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    width,
    isResizing,
    onMouseDown: handleMouseDown,
    setWidth,
  };
};
