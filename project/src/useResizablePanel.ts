import { useState, useCallback, useEffect } from 'react';

/**
 * Props for the useResizablePanel hook.
 */
interface UseResizablePanelProps {
  /** Initial width of the panel as a percentage. */
  initialWidth: number;
  /** Minimum width (percentage) the panel can be resized to. */
  minWidth: number;
  /** Maximum width (percentage) the panel can be resized to. */
  maxWidth: number;
}

/**
 * Manages the state and logic for creating a resizable panel.
 * Assumes resizing is happening from the left edge (dragging left expands).
 *
 * @returns {object} - The panel's current width, resizing status,
 * mouse down handler, and a function to set the width manually.
 */
export const useResizablePanel = ({
  initialWidth,
  minWidth,
  maxWidth,
}: UseResizablePanelProps) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  /**
   * Handles the mouse down event on the resizer handle.
   * Starts the resizing process.
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent text selection while dragging
    setIsResizing(true);
  };

  /**
   * Handles the global mouse up event.
   * Stops the resizing process.
   */
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  /**
   * Handles the global mouse move event.
   * Calculates and applies the new width for the detail view.
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    // Calculate new width as a percentage of window width.
    // Assumes the detail view is on the right side of the screen.
    const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;

    // Clamp the width between min and max
    const clampedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    setWidth(clampedWidth);
  }, [isResizing, minWidth, maxWidth]);

  /**
   * Effect to add and remove global event listeners for resizing
   * when the isResizing state changes.
   */
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    // Cleanup function to remove listeners
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    width,
    isResizing,
    onMouseDown: handleMouseDown,
    setWidth, // Expose setWidth for external logic (like resetting)
  };
};
