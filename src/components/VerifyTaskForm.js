import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const VerifyTaskForm = ({ task, groupMembers }) => {
  const { user } = useContext(AuthContext);
  const { updateDocument } = useFirestore('tasks');

  const handleVerify = async () => {
    if (!user || user.uid === task.userId) return;

    try {
      // Update task
      await updateDocument(task.id, {
        completed: true,
        verifiedBy: user.uid,
        completedAt: new Date()
      });

      // Update user points
      const userRef = doc(db, 'users', task.userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const groupId = task.groupId;

        // Update points in user document
        await updateDoc(userRef, {
          totalPoints: increment(10),
          [`groupPoints.${groupId}`]: increment(10)
        });

        // Update group points
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          [`members.${task.userId}.points`]: increment(10)
        });
      }

    } catch (error) {
      console.error('Error verifying task:', error);
      alert('Failed to verify task. Please try again.');
    }
  };

  // Check if the current user is the owner of the task
  const isTaskOwner = user && user.uid === task.userId;

  // Check if the current user is a member of the group
  const isGroupMember = groupMembers && groupMembers.includes(user.uid);

  return (
    <div>
      {isTaskOwner ? (
        <p>You cannot verify your own task.</p>
      ) : (
        <button onClick={handleVerify} disabled={!isGroupMember}>
          {task.completed ? 'Verified' : 'Verify Task'}
        </button>
      )}
    </div>
  );
};

export default VerifyTaskForm;

// Helper functions (implement these in a separate file)
async function getUserData(userId) {
  // Fetch user data from Firestore
}

function calculateNewStreak(user) {
  // Calculate new streak based on last completed task
}
