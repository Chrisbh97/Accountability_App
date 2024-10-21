import React from 'react';

const CreateGroupButton = ({ onClick }) => {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px',
      fontSize: '16px',
      backgroundColor: 'transparent',
      color: 'rgb(143, 143, 245)',
      border: '1px solid',
      borderRadius: '5px',
      cursor: 'pointer',
      marginBottom: '20px'
    }}>
      Create Group
    </button>
  );
};

export default CreateGroupButton;
