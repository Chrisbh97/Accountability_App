import React from 'react';

function Button({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px',
      fontSize: '16px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    }}>
      {children}
    </button>
  );
}

export default Button;
