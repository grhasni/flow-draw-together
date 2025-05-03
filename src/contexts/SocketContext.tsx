
import React, { createContext, useContext, useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketContextProps {
  socket: Socket | null;
  roomId: string | null;
  setRoomId: (id: string | null) => void;
  connected: boolean;
  users: Array<{ id: string, name: string, cursor: { x: number, y: number } }>;
  username: string;
  setUsername: (name: string) => void;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
}

const SocketContext = createContext<SocketContextProps | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// This would be your actual Socket.IO server URL in production
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('whiteboard-username') || `User-${Math.floor(Math.random() * 1000)}`;
  });
  const [users, setUsers] = useState<Array<{ id: string, name: string, cursor: { x: number, y: number } }>>([]);

  // Initialize socket connection
  useEffect(() => {
    // For this demo, we'll simulate socket connection
    // In a real app, you would connect to your Socket.IO server
    const simulateSocket = {
      id: 'simulated-socket-id',
      on: (event: string, callback: Function) => {
        console.log(`Socket event registered: ${event}`);
      },
      emit: (event: string, data: any) => {
        console.log(`Socket event emitted: ${event}`, data);
      },
      off: (event: string, callback?: Function) => {
        console.log(`Socket event unregistered: ${event}`);
      },
      connected: true
    };

    setSocket(simulateSocket as unknown as Socket);
    setConnected(true);
    
    toast.success("Connected to collaborative whiteboard (simulated)");

    // In a real application, you would do:
    // const newSocket = io(SOCKET_URL);
    // setSocket(newSocket);
    
    // newSocket.on('connect', () => {
    //   setConnected(true);
    //   toast.success("Connected to collaborative whiteboard");
    // });
    
    // newSocket.on('disconnect', () => {
    //   setConnected(false);
    //   toast.error("Disconnected from whiteboard server");
    // });
    
    // newSocket.on('users-update', (updatedUsers) => {
    //   setUsers(updatedUsers);
    // });

    // return () => {
    //   newSocket.disconnect();
    // };
  }, []);

  // Save username to localStorage
  useEffect(() => {
    localStorage.setItem('whiteboard-username', username);
    
    if (socket && roomId) {
      socket.emit('update-username', { roomId, username });
    }
  }, [username, socket, roomId]);

  // Generate room ID (would normally come from the server)
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const createRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    
    // In a real app with socket.io:
    // socket?.emit('create-room', { roomId: newRoomId, username });
    
    toast.success(`Room created: ${newRoomId}`, {
      description: "Share this code with others to collaborate"
    });
    
    // Simulate users joining (would come from server in real app)
    setUsers([
      { id: 'current-user', name: username, cursor: { x: 0, y: 0 } }
    ]);
  };

  const joinRoom = (roomToJoin: string) => {
    if (!roomToJoin) {
      toast.error("Please enter a room ID");
      return;
    }
    
    setRoomId(roomToJoin);
    
    // In a real app:
    // socket?.emit('join-room', { roomId: roomToJoin, username });
    
    toast.success(`Joined room: ${roomToJoin}`);
    
    // Simulate users in room (would come from server in real app)
    setUsers([
      { id: 'host-user', name: 'Room Host', cursor: { x: 100, y: 100 } },
      { id: 'current-user', name: username, cursor: { x: 0, y: 0 } }
    ]);
  };

  const leaveRoom = () => {
    if (roomId) {
      // In a real app:
      // socket?.emit('leave-room', { roomId });
      
      setRoomId(null);
      setUsers([]);
      toast.info("Left the whiteboard room");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        roomId,
        setRoomId,
        connected,
        users,
        username,
        setUsername,
        createRoom,
        joinRoom,
        leaveRoom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
