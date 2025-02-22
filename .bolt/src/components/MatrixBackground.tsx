import React, { useEffect, useRef } from 'react';

const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const isClicking = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Matrix character set
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];
    const speeds: number[] = [];
    const brightnesses: number[] = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // Random start positions above canvas
      speeds[i] = 1 + Math.random(); // Random speeds
      brightnesses[i] = 0.5 + Math.random() * 0.5; // Random brightness
    }

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const handleMouseDown = () => {
      isClicking.current = true;
    };

    const handleMouseUp = () => {
      isClicking.current = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Drawing function
    const draw = () => {
      // Semi-transparent black to create trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        // Calculate distance from mouse
        const dx = (i * fontSize) - mousePos.current.x;
        const dy = drops[i] * fontSize - mousePos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / 200);

        // Adjust speed and brightness based on mouse proximity
        let currentSpeed = speeds[i];
        let currentBrightness = brightnesses[i];

        if (influence > 0) {
          currentSpeed += influence * (isClicking.current ? 4 : 2);
          currentBrightness = Math.min(1, currentBrightness + influence);
        }

        // Draw character
        const char = chars[Math.floor(Math.random() * chars.length)];
        const brightness = Math.floor(currentBrightness * 255);
        ctx.fillStyle = `rgb(0, ${brightness}, 0)`;
        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        // Update drop position
        drops[i] += currentSpeed;

        // Reset drop when it goes off screen
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
    };

    // Animation loop
    const interval = setInterval(draw, 33);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', setCanvasSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
    />
  );
};

export default MatrixBackground;
