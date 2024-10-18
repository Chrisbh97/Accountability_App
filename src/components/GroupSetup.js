import React, { useState, useContext } from 'react';
import { getFirestore, collection, addDoc, updateDoc, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { AuthContext } from '../contexts/AuthContext'; // Import AuthContext directly

const GroupSetup = ({ onGroupJoined }) => {
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState(''); // Define joinCode state
  const { user } = useContext(AuthContext); // Use useContext directly

  const createGroup = async () => {
    if (!groupName) return;

    const db = getFirestore();
    try {
      const groupRef = await addDoc(collection(db, 'groups'), {
        name: groupName,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        members: {
          [user.uid]: { joinedAt: serverTimestamp(), role: 'admin' }
        }
      });

      // Update the user document to include the new groupId
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        groupIds: arrayUnion(groupRef.id) // Use arrayUnion to add the new groupId
      });

      onGroupJoined(); // Notify that a group has been created
    } catch (error) {
      console.error("Error creating group: ", error);
    }
  };

  const joinGroup = async () => {
    if (!joinCode) return; // Ensure joinCode is provided

    const db = getFirestore();
    try {
      const groupRef = doc(db, 'groups', joinCode);
      
      await updateDoc(groupRef, {
        [`members.${user.uid}`]: { joinedAt: serverTimestamp(), role: 'member' }
      });

      // Update the user document to include the groupId
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        groupIds: arrayUnion(joinCode) // Use arrayUnion to add the joined groupId
      });

      onGroupJoined(); // Notify that a group has been joined
    } catch (error) {
      console.error("Error joining group: ", error);
    }
  };

  return (
    <div className="group-setup">
      <h2>Create a New Group</h2>
      <input 
        type="text" 
        value={groupName} 
        onChange={(e) => setGroupName(e.target.value)} 
        placeholder="Enter group name" 
      />
      <button onClick={createGroup}>Create Group</button>

      <h2>Join an Existing Group</h2>
      <input 
        type="text" 
        value={joinCode} 
        onChange={(e) => setJoinCode(e.target.value)} // Handle join code input
        placeholder="Enter join code"
      />
      <button onClick={joinGroup}>Join Group</button>
    </div>
  );
};

export default GroupSetup;
