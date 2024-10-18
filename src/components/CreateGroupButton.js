import React from 'react';

const CreateGroupButton = ({ onClick }) => {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px',
      fontSize: '16px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      marginBottom: '20px'
    }}>
      Create Group
    </button>
  );
};

export default CreateGroupButton;
