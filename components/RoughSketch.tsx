'use client';
import { useEffect, useRef } from 'react';
import rough from 'roughjs/bin/rough';

export default function RoughSketch({ type, width = 200, height = 200 }: { type: string, width?: number, height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const rc = rough.canvas(canvas);
    
    if (type === 'demon') {
      // Draw a scary demon boss face
      rc.circle(100, 100, 120, { fill: '#ef4444', fillWeight: 3, hachureAngle: 60, roughness: 2 }); // Head
      rc.path('M50 50 L20 10 L60 40 Z', { fill: '#b91c1c', roughness: 1.5 }); // Left Horn
      rc.path('M150 50 L180 10 L140 40 Z', { fill: '#b91c1c', roughness: 1.5 }); // Right Horn
      
      // Eyes
      rc.circle(70, 80, 20, { fill: '#facc15', fillStyle: 'solid' });
      rc.circle(130, 80, 20, { fill: '#facc15', fillStyle: 'solid' });
      rc.line(50, 70, 90, 85, { stroke: '#000', strokeWidth: 3 }); // Angry eyebrow
      rc.line(150, 70, 110, 85, { stroke: '#000', strokeWidth: 3 }); // Angry eyebrow
      
      // Mouth (sharp teeth)
      rc.path('M 60 130 L 140 130 L 130 160 L 100 140 L 70 160 Z', { fill: '#000', fillStyle: 'solid' });
    } else if (type === 'sword') {
      rc.path('M90 150 L110 150 L100 20 Z', { fill: '#94a3b8', roughness: 1 }); // Blade
      rc.rectangle(80, 150, 40, 10, { fill: '#b45309', fillStyle: 'solid' }); // Crossguard
      rc.rectangle(95, 160, 10, 30, { fill: '#78350f', fillStyle: 'solid' }); // Handle
    } else if (type === 'map') {
      rc.rectangle(20, 20, 160, 160, { fill: '#fef3c7', roughness: 1.5 }); // Map paper
      rc.path('M 40 40 C 60 20, 80 80, 160 40 L 160 160 C 120 120, 60 180, 40 160 Z', { stroke: '#92400e', strokeWidth: 2 });
      rc.circle(100, 100, 10, { fill: '#dc2626', fillStyle: 'cross-hatch' }); // X marks spot
    }
  }, [type, width, height]);

  return (
    <div className="flex justify-center my-6">
      <canvas ref={canvasRef} width={width} height={height} className="max-w-full drop-shadow-lg" />
    </div>
  );
}
