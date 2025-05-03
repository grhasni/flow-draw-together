import React from 'react';
import { useWhiteboard, DrawingTool } from '../contexts/WhiteboardContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, StraightLine, Square, Circle, SquareDashed, Eraser, Undo, Redo, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ToolButton: React.FC<{
  tool: DrawingTool;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}> = ({ tool, active, onClick, children, label }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'rounded-lg transition-all hover:bg-whiteboard-tool-hover hover:text-white', 
              active ? 'bg-whiteboard-tool-active text-white animate-tool-pop' : 'text-whiteboard-tool-default'
            )}
            onClick={onClick}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ActionButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
}> = ({ onClick, children, label, disabled = false }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg transition-all hover:bg-whiteboard-tool-hover hover:text-white text-whiteboard-tool-default"
            onClick={onClick}
            disabled={disabled}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Toolbar = () => {
  const { 
    tool, 
    setTool, 
    color, 
    setColor, 
    lineWidth, 
    setLineWidth,
    clearCanvas,
    undoAction,
    redoAction,
    downloadCanvas,
    historyIndex,
    history
  } = useWhiteboard();

  const COLORS = [
    '#000000', '#ffffff', '#ff0000', '#ff8800', '#ffff00', 
    '#00ff00', '#00ffff', '#0000ff', '#8800ff', '#ff00ff'
  ];

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-md">
      <div className="flex flex-col space-y-2 mb-2">
        <ToolButton
          tool="pencil"
          active={tool === 'pencil'}
          onClick={() => setTool('pencil')}
          label="Pencil"
        >
          <Pencil size={20} />
        </ToolButton>
        
        <ToolButton
          tool="line"
          active={tool === 'line'}
          onClick={() => setTool('line')}
          label="Line"
        >
          <StraightLine size={20} />
        </ToolButton>
        
        <ToolButton
          tool="rectangle"
          active={tool === 'rectangle'}
          onClick={() => setTool('rectangle')}
          label="Rectangle"
        >
          <SquareDashed size={20} />
        </ToolButton>
        
        <ToolButton
          tool="circle"
          active={tool === 'circle'}
          onClick={() => setTool('circle')}
          label="Circle"
        >
          <Circle size={20} />
        </ToolButton>
        
        <ToolButton
          tool="square"
          active={tool === 'square'}
          onClick={() => setTool('square')}
          label="Square"
        >
          <Square size={20} />
        </ToolButton>
        
        <ToolButton
          tool="eraser"
          active={tool === 'eraser'}
          onClick={() => setTool('eraser')}
          label="Eraser"
        >
          <Eraser size={20} />
        </ToolButton>
      </div>
      
      <div className="border-t border-gray-200 pt-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              className="h-8 w-8 rounded-md p-0 border-2"
              style={{ backgroundColor: color }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((c) => (
                <Button
                  key={c}
                  className="h-8 w-8 rounded-md p-0 border-2"
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-8 cursor-pointer"
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="mt-2">
          <Slider
            defaultValue={[lineWidth]}
            max={20}
            min={1}
            step={1}
            value={[lineWidth]}
            onValueChange={(vals) => setLineWidth(vals[0])}
            className="my-4"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-2 flex flex-col space-y-2">
        <ActionButton 
          onClick={undoAction} 
          label="Undo"
          disabled={historyIndex <= 0}
        >
          <Undo size={20} />
        </ActionButton>
        
        <ActionButton 
          onClick={redoAction} 
          label="Redo"
          disabled={historyIndex >= history.length - 1}
        >
          <Redo size={20} />
        </ActionButton>
        
        <ActionButton onClick={clearCanvas} label="Clear Canvas">
          <Trash2 size={20} />
        </ActionButton>
        
        <ActionButton onClick={downloadCanvas} label="Download">
          <Download size={20} />
        </ActionButton>
      </div>
    </div>
  );
};

export default Toolbar;
