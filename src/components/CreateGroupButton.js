import React from "react";

const CreateGroupButton = ({ onClick }) => {
  const btnStyle = {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "transparent",
    color: "rgb(143, 143, 245)",
    border: "1px solid",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "20px",
  };
  return (
    <button onClick={onClick} style={btnStyle}>
      Create Group
    </button>
  );
};
export default CreateGroupButton;
