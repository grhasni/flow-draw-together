
import React, { createContext, useContext, useState } from 'react';

// This will be expanded later when we integrate with Socket.IO
interface SocketContextProps {
  roomId: string | null;
  setRoomId: (id: string | null) => void;
  connected: boolean;
}

const SocketContext = createContext<SocketContextProps | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  // In the future, we'll implement Socket.IO connection here

  return (
    <SocketContext.Provider
      value={{
        roomId,
        setRoomId,
        connected
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
