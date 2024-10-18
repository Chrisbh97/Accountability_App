import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks }) => { // Accept tasks as a prop
  return (
    <div>
      <h2>Tasks</h2>
      {tasks.length > 0 ? (
        tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))
      ) : (
        <p>No tasks available for this member.</p>
      )}
    </div>
  );
};

export default TaskList;
