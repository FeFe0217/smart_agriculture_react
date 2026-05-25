// src/components/Layout/SplitPane.jsx
import React, { useState, useRef, useEffect } from 'react';

function SplitPane({ top, bottom, defaultSize = 400 }) {
  const [topHeight, setTopHeight] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startYRef.current;
      let newHeight = startHeightRef.current + deltaY;
      const maxHeight = (containerRef.current?.offsetHeight || window.innerHeight) - 150;
      newHeight = Math.min(Math.max(newHeight, 200), maxHeight);
      setTopHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = topHeight;
  };

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: topHeight, overflow: 'auto', flexShrink: 0 }}>
        {top}
      </div>
      <div 
        style={{ height: 6, background: '#e0e0e0', cursor: 'row-resize', flexShrink: 0 }}
        onMouseDown={handleMouseDown}
      />
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {bottom}
      </div>
    </div>
  );
}

export default SplitPane;