import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue, set, push, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface SocketContextProps {
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

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('whiteboard-username') || `User-${Math.floor(Math.random() * 1000)}`;
  });
  const [users, setUsers] = useState<Array<{ id: string, name: string, cursor: { x: number, y: number } }>>([]);

  // Initialize Firebase connection
  useEffect(() => {
    setConnected(true);
    toast.success("Connected to collaborative whiteboard");

    return () => {
      if (roomId) {
        leaveRoom();
      }
    };
  }, []);

  // Save username to localStorage and update in Firebase if in a room
  useEffect(() => {
    localStorage.setItem('whiteboard-username', username);
    
    if (roomId) {
      const userRef = ref(db, `rooms/${roomId}/users/${username}`);
      set(userRef, {
        name: username,
        cursor: { x: 0, y: 0 },
        lastSeen: serverTimestamp()
      });
    }
  }, [username, roomId]);

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    setRoomId(newRoomId);
    
    // Create room in Firebase
    const roomRef = ref(db, `rooms/${newRoomId}`);
    set(roomRef, {
      createdAt: serverTimestamp(),
      createdBy: username
    });

    // Add user to room
    const userRef = ref(db, `rooms/${newRoomId}/users/${username}`);
    set(userRef, {
      name: username,
      cursor: { x: 0, y: 0 },
      lastSeen: serverTimestamp()
    });

    // Set up cleanup on disconnect
    onDisconnect(userRef).remove();

    toast.success(`Room created: ${newRoomId}`, {
      description: "Share this code with others to collaborate"
    });
  };

  const joinRoom = (roomToJoin: string) => {
    if (!roomToJoin) {
      toast.error("Please enter a room ID");
      return;
    }
    
    setRoomId(roomToJoin);
    
    // Add user to room
    const userRef = ref(db, `rooms/${roomToJoin}/users/${username}`);
    set(userRef, {
      name: username,
      cursor: { x: 0, y: 0 },
      lastSeen: serverTimestamp()
    });

    // Set up cleanup on disconnect
    onDisconnect(userRef).remove();

    toast.success(`Joined room: ${roomToJoin}`);
  };

  const leaveRoom = () => {
    if (roomId) {
      // Remove user from room
      const userRef = ref(db, `rooms/${roomId}/users/${username}`);
      remove(userRef);
      
      setRoomId(null);
      setUsers([]);
      toast.info("Left the whiteboard room");
    }
  };

  // Listen for room updates
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(db, `rooms/${roomId}/users`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const usersData = snapshot.val() || {};
      const usersList = Object.entries(usersData).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        cursor: data.cursor || { x: 0, y: 0 }
      }));
      setUsers(usersList);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  return (
    <SocketContext.Provider
      value={{
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
