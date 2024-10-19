import React from 'react';

const GroupList = ({ groups, onGroupClick }) => {
  return (
    <div>
      {groups.length > 0 ? (
        groups.map(group => (
          <p key={group.id} onClick={() => onGroupClick(group.id)} style={{ cursor: 'pointer' }}>
            {group.name}
          </p>
        ))
      ) : (
        <p>No groups available.</p>
      )}
    </div>
  );
};

export default GroupList;
