import React from 'react';
import { useFirestore } from '../hooks/useFirestore';

const LeaderBoard = ({ groupId }) => {
  const { documents: users } = useFirestore('users');

  // Filter users to only include those who are members of the specified group
  const groupMembers = users.filter(user => user.groupIds && user.groupIds.includes(groupId));

  // Sort the filtered users by points in the context of the specific group
  const sortedUsers = groupMembers.sort((a, b) => {
    const aGroupPoints = a.groupPoints && a.groupPoints[groupId] ? a.groupPoints[groupId] : 0;
    const bGroupPoints = b.groupPoints && b.groupPoints[groupId] ? b.groupPoints[groupId] : 0;
    return bGroupPoints - aGroupPoints; // Sort in descending order
  });

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Points</th>
            <th>Streak</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.username}</td>
              <td>{user.groupPoints && user.groupPoints[groupId] ? user.groupPoints[groupId] : 0}</td>
              <td>{user.streak} days</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderBoard;
