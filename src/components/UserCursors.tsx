
import React from 'react';
import { CircleUserIcon } from 'lucide-react';

interface CursorProps {
  users: Array<{
    id: string;
    name: string;
    cursor: {
      x: number;
      y: number;
    }
  }>;
}

const UserCursors: React.FC<CursorProps> = ({ users }) => {
  return (
    <>
      {users.filter(user => user.id !== 'current-user').map((user) => (
        <div
          key={user.id}
          className="absolute pointer-events-none z-50 transition-all duration-100 ease-linear"
          style={{
            left: `${user.cursor.x}px`,
            top: `${user.cursor.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="flex flex-col items-center">
            <CircleUserIcon 
              size={24} 
              className="text-blue-500 animate-pulse" 
            />
            <span className="text-xs font-medium px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 whitespace-nowrap">
              {user.name}
            </span>
          </div>
        </div>
      ))}
    </>
  );
};

export default UserCursors;
