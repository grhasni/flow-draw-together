
import React, { useState } from 'react';
import Whiteboard from '@/components/Whiteboard';
import Toolbar from '@/components/Toolbar';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { useTheme } from '@/contexts/ThemeContext';

const Index = () => {
  const { tool, color, lineWidth } = useWhiteboard();
  const { roomId, username, setUsername, createRoom, joinRoom, leaveRoom, users } = useSocket();
  const [joinRoomId, setJoinRoomId] = useState('');
  const { theme } = useTheme();

  return (
    <div className={`flex w-full h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold">AG Collaborative Whiteboard</h1>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm hidden md:flex items-center space-x-2">
            <div className="flex items-center">
              <span className="font-medium">Tool:</span>
              <span className="ml-1 capitalize">{tool}</span>
            </div>
            <div className="h-4 w-4 rounded-full border border-gray-400" style={{ backgroundColor: color }}></div>
            <div className="flex items-center">
              <span className="font-medium">Size:</span>
              <span className="ml-1">{lineWidth}</span>
            </div>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                {roomId ? `Room: ${roomId}` : 'Join Room'}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Collaborative Drawing</SheetTitle>
                <SheetDescription>
                  Create or join a room to draw with others in real-time
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Your Name</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                
                {roomId ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Current Room</h3>
                      <div className="flex items-center mt-1">
                        <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md">{roomId}</span>
                        <Button 
                          variant="ghost" 
                          className="ml-2"
                          onClick={() => {
                            navigator.clipboard.writeText(roomId);
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Users in Room</h3>
                      <ul className="mt-1 space-y-1">
                        {users.map(user => (
                          <li key={user.id} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md">
                            {user.name} {user.id === 'current-user' ? '(You)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      onClick={leaveRoom}
                      className="w-full"
                    >
                      Leave Room
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      onClick={createRoom}
                      className="w-full"
                    >
                      Create New Room
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or Join Existing
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Input
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        placeholder="Enter room code"
                      />
                      <Button onClick={() => joinRoom(joinRoomId)}>
                        Join
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <div className="w-full h-full p-16">
        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <Whiteboard />
        </div>
      </div>

      <Toolbar />
    </div>
  );
};

export default Index;
