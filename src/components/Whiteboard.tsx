
import React, { useEffect, useState } from 'react';
import { useWhiteboard } from '../contexts/WhiteboardContext';

const Whiteboard = () => {
  const {
    tool,
    color,
    lineWidth,
    canvasRef,
    isDrawing,
    setIsDrawing,
    saveCanvasState
  } = useWhiteboard();
  
  const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size to match parent
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasRef]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    setStartCoords(coords);
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const coords = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = lineWidth;
    
    switch (tool) {
      case 'pencil':
      case 'eraser':
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        break;
      case 'line':
      case 'rectangle':
      case 'circle':
      case 'square':
        // These will be finalized on mouseup/touchend
        break;
      default:
        break;
    }
  };

  const finishDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startCoords) {
      setIsDrawing(false);
      return;
    }
    
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    
    if (!canvas) {
      setIsDrawing(false);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsDrawing(false);
      return;
    }
    
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = lineWidth;
    
    switch (tool) {
      case 'pencil':
      case 'eraser':
        // Already handled during draw
        ctx.closePath();
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(startCoords.x, startCoords.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        ctx.closePath();
        break;
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(
          startCoords.x,
          startCoords.y,
          coords.x - startCoords.x,
          coords.y - startCoords.y
        );
        ctx.stroke();
        ctx.closePath();
        break;
      case 'square':
        ctx.beginPath();
        const size = Math.max(
          Math.abs(coords.x - startCoords.x),
          Math.abs(coords.y - startCoords.y)
        );
        const directionX = coords.x >= startCoords.x ? 1 : -1;
        const directionY = coords.y >= startCoords.y ? 1 : -1;
        ctx.rect(
          startCoords.x,
          startCoords.y,
          size * directionX,
          size * directionY
        );
        ctx.stroke();
        ctx.closePath();
        break;
      case 'circle':
        ctx.beginPath();
        const radius = Math.sqrt(
          Math.pow(coords.x - startCoords.x, 2) +
          Math.pow(coords.y - startCoords.y, 2)
        );
        ctx.arc(startCoords.x, startCoords.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
        break;
      default:
        break;
    }
    
    setIsDrawing(false);
    saveCanvasState();
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-whiteboard-background cursor-crosshair touch-none"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={finishDrawing}
      onMouseLeave={handleCancelDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={finishDrawing}
    />
  );
};

export default Whiteboard;
