import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, documentId } from 'firebase/firestore';
import GroupList from '../components/GroupList'; // Ensure this import is correct
import SignOutButton from '../components/SignOutButton'; // Import the SignOutButton
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../stylesheets/home.css';
const Home = () => {
  const { user, username } = useContext(AuthContext);
  const [groups, setGroups] = useState([]); // State to hold user groups
  const db = getFirestore();
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (user) {
        console.log("Fetching user groups for user:", user.uid);
        try {
          // Fetch user document
          const userRef = doc(db, 'users', user.uid); // Get user document reference
          const userDoc = await getDoc(userRef); // Fetch user document
          const userData = userDoc.data(); // Get user data
          
          if (userData && userData.groupIds) {
            console.log("User groupIds:", userData.groupIds);
            const groupsRef = collection(db, 'groups');
            const groupsQuery = query(groupsRef, where(documentId(), 'in', userData.groupIds)); // Query groups by user groupIds
            const querySnapshot = await getDocs(groupsQuery);
            const groupsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGroups(groupsData);
          }
        } catch (error) {
          console.error("Error fetching user groups:", error);
        }
      }
    };

    fetchUserGroups();
  }, [user, db]);

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`); // Navigate to the group page
  };

  return (
    <div className="home">
        <h1>{username}</h1>
        <p>Your groups</p>
        <GroupList groups={groups} onGroupClick={handleGroupClick} /> {/* Pass the handleGroupClick function */}

      <SignOutButton /> {/* Add the Sign Out button here */}
    </div>
  );
};

export default Home;
