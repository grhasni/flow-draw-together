
import React from 'react';
import Whiteboard from '@/components/Whiteboard';
import Toolbar from '@/components/Toolbar';
import { useWhiteboard } from '@/contexts/WhiteboardContext';

const Index = () => {
  const { tool, color, lineWidth } = useWhiteboard();

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-100 relative">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">AG Collaborative Whiteboard</h1>
        <div className="flex items-center space-x-2">
          <div className="text-sm">
            Current Tool: <span className="font-medium capitalize">{tool}</span>
          </div>
          <div className="h-4 w-4 rounded-full border border-gray-400" style={{ backgroundColor: color }}></div>
          <div className="text-sm">Size: {lineWidth}</div>
        </div>
      </div>
      
      <div className="w-full h-full p-16">
        <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
          <Whiteboard />
        </div>
      </div>

      <Toolbar />
    </div>
  );
};

export default Index;
