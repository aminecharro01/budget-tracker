import React, { useEffect, useState } from 'react';

export default function AmbientBackground() {
  const [gradient, setGradient] = useState('');

  useEffect(() => {
    // Generate random soft colors
    const randomColor = () => {
      const h = Math.floor(Math.random() * 360);
      const s = Math.floor(Math.random() * 40) + 60; // 60-100%
      const l = Math.floor(Math.random() * 30) + 40; // 40-70%
      return `hsl(${h}, ${s}%, ${l}%)`;
    };

    const c1 = randomColor();
    const c2 = randomColor();
    const c3 = randomColor();
    const c4 = randomColor();

    setGradient(`
      radial-gradient(circle at 15% 50%, ${c1} 0%, transparent 50%),
      radial-gradient(circle at 85% 30%, ${c2} 0%, transparent 50%),
      radial-gradient(circle at 50% 80%, ${c3} 0%, transparent 50%),
      radial-gradient(circle at 80% 90%, ${c4} 0%, transparent 50%)
    `);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        background: gradient,
        filter: 'blur(80px)',
        opacity: 0.5,
        transition: 'background 2s ease-in-out',
        pointerEvents: 'none',
      }}
    />
  );
}
