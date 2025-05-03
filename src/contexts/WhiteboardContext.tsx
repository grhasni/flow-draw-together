
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export type DrawingTool = 'pencil' | 'line' | 'rectangle' | 'circle' | 'square' | 'eraser' | 'text';

interface WhiteboardContextProps {
  tool: DrawingTool;
  setTool: (tool: DrawingTool) => void;
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;
  history: ImageData[];
  setHistory: React.Dispatch<React.SetStateAction<ImageData[]>>;
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  clearCanvas: () => void;
  undoAction: () => void;
  redoAction: () => void;
  saveCanvasState: () => void;
  downloadCanvas: () => void;
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        saveCanvasState();
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

  return (
    <WhiteboardContext.Provider
      value={{
        tool,
        setTool,
        color,
        setColor,
        lineWidth,
        setLineWidth,
        canvasRef,
        isDrawing,
        setIsDrawing,
        history,
        setHistory,
        historyIndex,
        setHistoryIndex,
        clearCanvas,
        undoAction,
        redoAction,
        saveCanvasState,
        downloadCanvas
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  );
};
