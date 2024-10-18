import React from 'react';
import VerifyTaskForm from './VerifyTaskForm';

const TaskItem = ({ task, onEdit, onDelete, onVerify, isCurrentUser }) => {
  return (
    <div className="task-item">
      <h3>{task.title}</h3>
      <p>Created by: {task.userId}</p>
      <p>Status: {task.completed ? 'Completed' : 'Pending'}</p>
      {task.completed && <p>Verified by: {task.verifiedBy}</p>}
      {isCurrentUser ? (
        <>
          <button onClick={onEdit}>Edit</button>
          <button onClick={onDelete}>Delete</button>
        </>
      ) : (
        <VerifyTaskForm task={task} onVerify={onVerify} />
      )}
    </div>
  );
};

export default TaskItem;
