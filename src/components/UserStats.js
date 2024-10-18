import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';

const UserStats = () => {
  const { user } = useContext(AuthContext);
  const { documents: users } = useFirestore('users');

  const currentUser = users.find(u => u.id === user.uid);

  if (!currentUser) return <div>Loading...</div>;

  return (
    <div className="user-stats">
      <h2>Your Stats</h2>
      <p>Points: {currentUser.points}</p>
      <p>Current Streak: {currentUser.streak} days</p>
      <p>Tasks Completed: {currentUser.tasksCompleted || 0}</p>
    </div>
  );
};

export default UserStats;
