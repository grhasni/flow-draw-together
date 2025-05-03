import React, { useEffect, useState, useRef } from 'react';
import { useWhiteboard, DrawingElement } from '../contexts/WhiteboardContext';
import { useSocket } from '../contexts/SocketContext';
import { nanoid } from 'nanoid';
import UserCursors from './UserCursors';
import { ref, set, onChildAdded, push, remove, onDisconnect, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

const Whiteboard = () => {
  const {
    tool,
    color,
    lineWidth,
    canvasRef,
    isDrawing,
    setIsDrawing,
    saveCanvasState,
    elements,
    setElements,
    selectedElement,
    setSelectedElement,
    isMoveMode
  } = useWhiteboard();
  
  const { roomId, users, username } = useSocket();
  
  const [startCoords, setStartCoords] = useState<{ x: number; y: number } | null>(null);
  const [resizeHandleActive, setResizeHandleActive] = useState<string | null>(null);
  
  // For efficient performance, track points without re-renders
  const currentElementRef = useRef<DrawingElement | null>(null);
  const lastPointRef = useRef<{ x: number, y: number } | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const updateThrottleTime = 50; // milliseconds between updates

  // Listen for drawing updates from other users
  useEffect(() => {
    if (!roomId) return;

    const drawingsRef = ref(db, `rooms/${roomId}/drawings`);

    // Use only onValue for real-time sync
    const unsubscribe = onValue(drawingsRef, (snapshot) => {
      const drawingsData = snapshot.val() || {};
      const newElements = Object.values(drawingsData) as DrawingElement[];
      setElements(newElements);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // Track mouse position for cursor sharing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (roomId) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Update cursor position in Firebase
          const cursorRef = ref(db, `rooms/${roomId}/users/${username}/cursor`);
          set(cursorRef, { x, y });
        }
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [roomId, username]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size to match parent
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        redrawElements();
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

  const redrawElements = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all elements
    elements.forEach(element => {
      drawElement(ctx, element);
    });
  };

  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    const { tool, points, color, lineWidth } = element;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    
    switch (tool) {
      case 'pencil':
        if (points.length > 0) {
          ctx.moveTo(points[0].x, points[0].y);
          points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
        }
        ctx.stroke();
        break;
        
      case 'line':
        if (points.length >= 2) {
          ctx.moveTo(points[0].x, points[0].y);
          ctx.lineTo(points[1].x, points[1].y);
        }
        ctx.stroke();
        break;
        
      case 'rectangle':
        if (points.length >= 2) {
          const width = points[1].x - points[0].x;
          const height = points[1].y - points[0].y;
          ctx.strokeRect(points[0].x, points[0].y, width, height);
        }
        break;
        
      case 'square':
        if (points.length >= 2) {
          const size = Math.max(
            Math.abs(points[1].x - points[0].x),
            Math.abs(points[1].y - points[0].y)
          );
          const directionX = points[1].x >= points[0].x ? 1 : -1;
          const directionY = points[1].y >= points[0].y ? 1 : -1;
          ctx.strokeRect(
            points[0].x,
            points[0].y,
            size * directionX,
            size * directionY
          );
        }
        break;
        
      case 'circle':
        if (points.length >= 2) {
          const radius = Math.sqrt(
            Math.pow(points[1].x - points[0].x, 2) +
            Math.pow(points[1].y - points[0].y, 2)
          );
          ctx.arc(points[0].x, points[0].y, radius, 0, 2 * Math.PI);
        }
        ctx.stroke();
        break;
        
      case 'eraser':
        if (points.length > 0) {
          ctx.strokeStyle = '#ffffff';
          ctx.moveTo(points[0].x, points[0].y);
          points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
        }
        ctx.stroke();
        break;
        
      default:
        break;
    }
    
    // Draw selection/resize handles if element is selected
    if (element.selected) {
      if (points.length >= 2) {
        // Draw selection boundary
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        
        // For circle, we draw a box around it
        if (tool === 'circle') {
          const radius = Math.sqrt(
            Math.pow(points[1].x - points[0].x, 2) +
            Math.pow(points[1].y - points[0].y, 2)
          );
          ctx.strokeRect(
            points[0].x - radius,
            points[0].y - radius,
            radius * 2,
            radius * 2
          );
          
          // Draw resize handles
          drawResizeHandles(ctx, [
            { x: points[0].x - radius, y: points[0].y - radius },
            { x: points[0].x + radius, y: points[0].y + radius }
          ]);
        } else {
          // For other shapes
          const x1 = Math.min(points[0].x, points[1].x);
          const y1 = Math.min(points[0].y, points[1].y);
          const x2 = Math.max(points[0].x, points[1].x);
          const y2 = Math.max(points[0].y, points[1].y);
          
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          
          // Draw resize handles
          drawResizeHandles(ctx, [{ x: x1, y: y1 }, { x: x2, y: y2 }]);
        }
        
        ctx.setLineDash([]);
      }
    }
  };

  const drawResizeHandles = (ctx: CanvasRenderingContext2D, points: { x: number, y: number }[]) => {
    const [p1, p2] = points;
    
    // Draw 8 resize handles (corners and midpoints)
    const handlePositions = [
      { key: 'nw', x: p1.x, y: p1.y },
      { key: 'n', x: (p1.x + p2.x) / 2, y: p1.y },
      { key: 'ne', x: p2.x, y: p1.y },
      { key: 'w', x: p1.x, y: (p1.y + p2.y) / 2 },
      { key: 'e', x: p2.x, y: (p1.y + p2.y) / 2 },
      { key: 'sw', x: p1.x, y: p2.y },
      { key: 's', x: (p1.x + p2.x) / 2, y: p2.y },
      { key: 'se', x: p2.x, y: p2.y }
    ];
    
    handlePositions.forEach(handle => {
      ctx.fillStyle = '#0088ff';
      ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
    });
  };

  const updateFirebaseDrawing = (element: DrawingElement) => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < updateThrottleTime) {
      return;
    }
    lastUpdateTimeRef.current = now;

    if (roomId) {
      const drawingsRef = ref(db, `rooms/${roomId}/drawings`);
      const newDrawingRef = push(drawingsRef);
      set(newDrawingRef, element);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing && !resizeHandleActive && !selectedElement) return;
    e.preventDefault();
    
    const coords = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (resizeHandleActive && selectedElement) {
      handleResize(selectedElement, coords, resizeHandleActive);
      redrawElements();
      return;
    } else if (selectedElement && isMoveMode) {
      handleMove(selectedElement, coords);
      redrawElements();
      return;
    }
    
    // Normal drawing operation
    if (!currentElementRef.current || !startCoords) return;
    
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = lineWidth;
    
    switch (tool) {
      case 'pencil':
      case 'eraser':
        // For pencil/eraser, add point and draw incrementally
        const newPoint = {x: coords.x, y: coords.y};
        
        if (lastPointRef.current) {
          ctx.beginPath();
          ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
          ctx.lineTo(coords.x, coords.y);
          ctx.stroke();
        }
        
        lastPointRef.current = newPoint;
        
        // Update the element with the new point
        if (currentElementRef.current) {
          currentElementRef.current.points.push(newPoint);
          updateFirebaseDrawing(currentElementRef.current);
        }
        break;
        
      case 'line':
      case 'rectangle':
      case 'circle':
      case 'square':
        // For shapes, we'll redraw the canvas each time for the preview
        redrawElements();
        
        // Draw the current shape preview
        ctx.beginPath();
        
        if (tool === 'line') {
          ctx.moveTo(startCoords.x, startCoords.y);
          ctx.lineTo(coords.x, coords.y);
        } else if (tool === 'rectangle') {
          const width = coords.x - startCoords.x;
          const height = coords.y - startCoords.y;
          ctx.strokeRect(startCoords.x, startCoords.y, width, height);
        } else if (tool === 'square') {
          const size = Math.max(
            Math.abs(coords.x - startCoords.x),
            Math.abs(coords.y - startCoords.y)
          );
          const directionX = coords.x >= startCoords.x ? 1 : -1;
          const directionY = coords.y >= startCoords.y ? 1 : -1;
          ctx.strokeRect(
            startCoords.x,
            startCoords.y,
            size * directionX,
            size * directionY
          );
        } else if (tool === 'circle') {
          const radius = Math.sqrt(
            Math.pow(coords.x - startCoords.x, 2) +
            Math.pow(coords.y - startCoords.y, 2)
          );
          ctx.arc(startCoords.x, startCoords.y, radius, 0, 2 * Math.PI);
        }
        
        ctx.stroke();
        break;
      default:
        break;
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    setStartCoords(coords);
    
    if (isMoveMode) {
      const resizeHandle = getResizeHandleAtPosition(coords);
      if (resizeHandle) {
        setResizeHandleActive(resizeHandle.handle);
        return;
      }
      
      const elementAtPosition = getElementAtPosition(coords);
      if (elementAtPosition) {
        setSelectedElement(elementAtPosition);
        setElements(prevElements => prevElements.map(el => ({
          ...el,
          selected: el.id === elementAtPosition.id
        })));
        redrawElements();
        return;
      } else {
        setSelectedElement(null);
        setElements(prevElements => prevElements.map(el => ({
          ...el,
          selected: false
        })));
        redrawElements();
        return;
      }
    }
    
    setIsDrawing(true);
    
    // Create new element
    const newElement: DrawingElement = {
      id: nanoid(),
      tool: tool === 'move' ? 'pencil' : tool,
      points: [coords],
      color: tool === 'eraser' ? '#ffffff' : color,
      lineWidth
    };
    
    currentElementRef.current = newElement;
    lastPointRef.current = coords;
    
    // For pencil and eraser, add to elements immediately
    if (tool === 'pencil' || tool === 'eraser') {
      setElements(prevElements => [...prevElements, newElement]);
      updateFirebaseDrawing(newElement);
    }
    
    // Setup canvas for drawing
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

  const getResizeHandleAtPosition = (coords: { x: number, y: number }) => {
    if (!selectedElement || !selectedElement.points || selectedElement.points.length < 2) {
      return null;
    }
    
    const [p1, p2] = selectedElement.points;
    const x1 = Math.min(p1.x, p2.x);
    const y1 = Math.min(p1.y, p2.y);
    const x2 = Math.max(p1.x, p2.x);
    const y2 = Math.max(p1.y, p2.y);
    
    const handlePositions = [
      { handle: 'nw', x: x1, y: y1 },
      { handle: 'n', x: (x1 + x2) / 2, y: y1 },
      { handle: 'ne', x: x2, y: y1 },
      { handle: 'w', x: x1, y: (y1 + y2) / 2 },
      { handle: 'e', x: x2, y: (y1 + y2) / 2 },
      { handle: 'sw', x: x1, y: y2 },
      { handle: 's', x: (x1 + x2) / 2, y: y2 },
      { handle: 'se', x: x2, y: y2 }
    ];
    
    // Check if cursor is near any resize handle
    const handle = handlePositions.find(h => {
      return Math.abs(h.x - coords.x) <= 6 && Math.abs(h.y - coords.y) <= 6;
    });
    
    return handle || null;
  };

  const getElementAtPosition = (coords: { x: number, y: number }) => {
    // This is a simple hit test - in real app you'd need more sophisticated hit testing
    // Find the element the user clicked on (from last added to first)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      
      if (element.points.length < 2) continue;
      
      // For simplicity, we'll use bounding box hit testing
      const x1 = Math.min(element.points[0].x, element.points[1].x);
      const y1 = Math.min(element.points[0].y, element.points[1].y);
      const x2 = Math.max(element.points[0].x, element.points[1].x);
      const y2 = Math.max(element.points[0].y, element.points[1].y);
      
      // Check if point is within the element's bounding box
      if (coords.x >= x1 - 5 && coords.x <= x2 + 5 && 
          coords.y >= y1 - 5 && coords.y <= y2 + 5) {
        return element;
      }
    }
    
    return null;
  };

  const handleResize = (element: DrawingElement, coords: { x: number, y: number }, handle: string) => {
    if (!element.points || element.points.length < 2) return;
    
    // Create a new array to avoid mutating the original
    const newElements = elements.map(el => {
      if (el.id !== element.id) return el;
      
      // Create a deep copy of points to avoid mutation
      const newPoints = [...element.points];
      
      // Depending on the handle, update the appropriate point
      if (handle.includes('n')) {
        // North - update y coordinate of the first point
        newPoints[0] = { ...newPoints[0], y: coords.y };
      }
      if (handle.includes('s')) {
        // South - update y coordinate of the second point
        newPoints[1] = { ...newPoints[1], y: coords.y };
      }
      if (handle.includes('w')) {
        // West - update x coordinate of the first point
        newPoints[0] = { ...newPoints[0], x: coords.x };
      }
      if (handle.includes('e')) {
        // East - update x coordinate of the second point
        newPoints[1] = { ...newPoints[1], x: coords.x };
      }
      
      return {
        ...el,
        points: newPoints
      };
    });
    
    setElements(newElements);
    
    // Also update the selectedElement state
    const updatedElement = newElements.find(el => el.id === element.id);
    if (updatedElement) {
      setSelectedElement(updatedElement);
    }
  };

  const handleMove = (element: DrawingElement, coords: { x: number, y: number }) => {
    if (!startCoords || !element.points || element.points.length < 2) return;
    
    const dx = coords.x - startCoords.x;
    const dy = coords.y - startCoords.y;
    
    // Update startCoords to the new position for the next move
    setStartCoords(coords);
    
    // Create a new array to avoid mutating the original
    const newElements = elements.map(el => {
      if (el.id !== element.id) return el;
      
      // Create new points with updated positions
      const newPoints = el.points.map(point => ({
        x: point.x + dx,
        y: point.y + dy
      }));
      
      return {
        ...el,
        points: newPoints
      };
    });
    
    setElements(newElements);
    
    // Also update the selectedElement state
    const updatedElement = newElements.find(el => el.id === element.id);
    if (updatedElement) {
      setSelectedElement(updatedElement);
    }
  };

  const finishDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (resizeHandleActive) {
      setResizeHandleActive(null);
      saveCanvasState();
      return;
    }
    
    if (!isDrawing && !selectedElement) {
      return;
    }
    
    if (isMoveMode && selectedElement) {
      saveCanvasState();
      setStartCoords(null);
      return;
    }
    
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
    
    // For shapes, add the final element to the elements array
    if (tool === 'line' || tool === 'rectangle' || tool === 'circle' || tool === 'square') {
      const newElement: DrawingElement = {
        id: nanoid(),
        tool,
        points: [startCoords, coords],
        color,
        lineWidth
      };
      
      setElements(prevElements => [...prevElements, newElement]);
      updateFirebaseDrawing(newElement);
    } else if (tool === 'pencil' || tool === 'eraser') {
      if (currentElementRef.current) {
        updateFirebaseDrawing(currentElementRef.current);
      }
    }
    
    setIsDrawing(false);
    setStartCoords(null);
    currentElementRef.current = null;
    lastPointRef.current = null;
    
    saveCanvasState();
  };

  const handleCancelDrawing = () => {
    setIsDrawing(false);
    setStartCoords(null);
    currentElementRef.current = null;
    lastPointRef.current = null;
    redrawElements(); // Redraw to remove any in-progress shape
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${
          isMoveMode ? 'cursor-move' : 
          tool === 'pencil' ? 'cursor-pencil' : 
          tool === 'eraser' ? 'cursor-eraser' : 
          'cursor-crosshair'
        } touch-none`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={handleCancelDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={finishDrawing}
      />
      
      <UserCursors users={users} />
    </div>
  );
};

export default Whiteboard;
