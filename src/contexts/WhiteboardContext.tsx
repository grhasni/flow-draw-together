import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { ref, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';

export type DrawingTool = 'pencil' | 'line' | 'rectangle' | 'circle' | 'square' | 'eraser' | 'text' | 'move';

interface Point {
  x: number;
  y: number;
}

export interface DrawingElement {
  id: string;
  tool: DrawingTool;
  points: Point[];
  color: string;
  lineWidth: number;
  selected?: boolean;
}

interface WhiteboardContextProps {
  tool: DrawingTool;
  setTool: (tool: DrawingTool) => void;
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  history: ImageData[];
  historyIndex: number;
  elements: DrawingElement[];
  setElements: (elements: DrawingElement[] | ((prev: DrawingElement[]) => DrawingElement[])) => void;
  selectedElement: DrawingElement | null;
  setSelectedElement: (element: DrawingElement | null) => void;
  isMoveMode: boolean;
  setIsMoveMode: (isMoveMode: boolean) => void;
  clearCanvas: () => void;
  undoAction: () => void;
  redoAction: () => void;
  downloadCanvas: () => void;
  toggleMoveMode: () => void;
  saveCanvasState: () => void;
}

const WhiteboardContext = createContext<WhiteboardContextProps | null>(null);

export const useWhiteboard = () => {
  const context = useContext(WhiteboardContext);
  if (!context) {
    throw new Error('useWhiteboard must be used within a WhiteboardProvider');
  }
  return context;
};

export const WhiteboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tool, setTool] = useState<DrawingTool>('pencil');
  const [color, setColor] = useState<string>('#000000');
  const [lineWidth, setLineWidth] = useState<number>(2);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<DrawingElement | null>(null);
  const [isMoveMode, setIsMoveMode] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { roomId } = useSocket();

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Initialize canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Save initial state
        saveCanvasState();
      }
    }
  }, []);

  // Socket event listeners for realtime collaboration
  useEffect(() => {
    if (!roomId) return;

    const handleDrawingEvent = (drawingData: DrawingElement) => {
      setElements(prevElements => [...prevElements, drawingData]);
      
      // Redraw the received element
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawElement(ctx, drawingData);
        }
      }
    };

    const handleClearEvent = () => {
      clearCanvas();
    };

    // Implement Firebase real-time drawing updates
    // This is a placeholder and should be replaced with actual Firebase implementation

    return () => {
      // Clean up Firebase listeners
    };
  }, [roomId]);

  // Helper function to draw a single element
  const drawElement = (ctx: CanvasRenderingContext2D, element: DrawingElement) => {
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();

    switch (element.tool) {
      case 'pencil':
        if (element.points.length > 0) {
          ctx.moveTo(element.points[0].x, element.points[0].y);
          element.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
        }
        ctx.stroke();
        break;
      case 'line':
        if (element.points.length >= 2) {
          ctx.moveTo(element.points[0].x, element.points[0].y);
          ctx.lineTo(element.points[1].x, element.points[1].y);
        }
        ctx.stroke();
        break;
      case 'rectangle':
        if (element.points.length >= 2) {
          const width = element.points[1].x - element.points[0].x;
          const height = element.points[1].y - element.points[0].y;
          ctx.strokeRect(element.points[0].x, element.points[0].y, width, height);
        }
        break;
      case 'square':
        if (element.points.length >= 2) {
          const size = Math.max(
            Math.abs(element.points[1].x - element.points[0].x),
            Math.abs(element.points[1].y - element.points[0].y)
          );
          const directionX = element.points[1].x >= element.points[0].x ? 1 : -1;
          const directionY = element.points[1].y >= element.points[0].y ? 1 : -1;
          ctx.strokeRect(
            element.points[0].x, 
            element.points[0].y, 
            size * directionX, 
            size * directionY
          );
        }
        break;
      case 'circle':
        if (element.points.length >= 2) {
          const radius = Math.sqrt(
            Math.pow(element.points[1].x - element.points[0].x, 2) +
            Math.pow(element.points[1].y - element.points[0].y, 2)
          );
          ctx.beginPath();
          ctx.arc(
            element.points[0].x, 
            element.points[0].y, 
            radius, 
            0, 
            2 * Math.PI
          );
          ctx.stroke();
        }
        break;
      case 'eraser':
        if (element.points.length > 0) {
          // For eraser, use white color
          ctx.strokeStyle = '#ffffff';
          ctx.moveTo(element.points[0].x, element.points[0].y);
          element.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
        }
        ctx.stroke();
        break;
      default:
        break;
    }

    ctx.closePath();
  };

  // Redraw all elements
  const redrawCanvas = () => {
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

  // Save canvas state for undo/redo
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // If we're in the middle of the history, remove all future states
        if (historyIndex < history.length - 1) {
          setHistory(prevHistory => prevHistory.slice(0, historyIndex + 1));
        }
        
        setHistory(prevHistory => [...prevHistory, imgData]);
        setHistoryIndex(prevIndex => prevIndex + 1);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setElements([]);
        saveCanvasState();
        
        // Clear drawings in Firebase
        if (roomId) {
          const drawingsRef = ref(db, `rooms/${roomId}/drawings`);
          remove(drawingsRef);
        }
      }
    }
  };

  const undoAction = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          setHistoryIndex(prevIndex => prevIndex - 1);
          ctx.putImageData(history[historyIndex - 1], 0, 0);
          // Remove the last element
          setElements(prevElements => prevElements.slice(0, -1));
        }
      }
    }
  };

  const redoAction = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          setHistoryIndex(prevIndex => prevIndex + 1);
          ctx.putImageData(history[historyIndex + 1], 0, 0);
          // We would need to store elements history for proper redo
        }
      }
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `whiteboard-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataURL;
      link.click();
    }
  };

  const toggleMoveMode = () => {
    setIsMoveMode(prev => !prev);
    if (!isMoveMode) {
      setTool('move');
    } else {
      setTool('pencil');
    }
  };

  return (
    <WhiteboardContext.Provider
      value={{
        tool,
        setTool,
        color,
        setColor,
        lineWidth,
        setLineWidth,
        isDrawing,
        setIsDrawing,
        canvasRef,
        history,
        historyIndex,
        elements,
        setElements,
        selectedElement,
        setSelectedElement,
        isMoveMode,
        setIsMoveMode,
        clearCanvas,
        undoAction,
        redoAction,
        downloadCanvas,
        toggleMoveMode,
        saveCanvasState
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  );
};
