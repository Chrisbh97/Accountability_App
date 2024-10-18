import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';

const AddTaskForm = ({ groupId }) => {
  const [title, setTitle] = useState('');
  const { user } = useContext(AuthContext);
  const { addDocument } = useFirestore('tasks');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    try {
      await addDocument({
        title,
        userId: user.uid,
        groupId,
        completed: false,
        createdAt: new Date()
      });
      setTitle('');
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter task title"
      />
      <button type="submit" disabled={!user}>Add Task</button>
    </form>
  );
};

export default AddTaskForm;
