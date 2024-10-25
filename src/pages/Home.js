import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  documentId,
} from "firebase/firestore";
import GroupList from "../components/GroupList"; 
import SignOutButton from "../components/SignOutButton"; 
import { useNavigate } from "react-router-dom"; 
import "../stylesheets/home.css";
import GroupSetup from "../components/GroupSetup";
import { useCache } from "../contexts/CacheContext"; // Import the cache hook

const Home = () => {
  const { user, username } = useContext(AuthContext);
  const [groups, setGroups] = useState([]); 
  const db = getFirestore();
  const navigate = useNavigate(); 
  const cache = useCache(); // Access cache

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (user) {
        // Check if groups are already cached for the current user
        if (cache.groups && cache.userId === user.uid) { // Check if userId matches
          console.log("Using cached groups for user:", user.uid);
          setGroups(cache.groups);
          return; // Early return to avoid further fetching
        }

        // Clear or reset cache for the new user
        cache.groups = []; // Reset the cache for groups
        cache.userId = user.uid; // Store the current user's ID
        console.log("Fetching user groups for user:", user.uid);
        
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();

          if (userData && userData.groupIds) {
            console.log("User groupIds:", userData.groupIds);
            const groupsRef = collection(db, "groups");
            const groupsQuery = query(
              groupsRef,
              where(documentId(), "in", userData.groupIds)
            );
            const querySnapshot = await getDocs(groupsQuery);
            const groupsData = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Cache the groups data and user ID
            cache.groups = groupsData; // Cache the groups
            cache.userId = user.uid; // Store the current user's ID
            setGroups(groupsData); // Always set groups after fetching or caching
          }
        } catch (error) {
          console.error("Error fetching user groups:", error);
        }
      }
    };

    fetchUserGroups();
  }, [user, db, cache]); // Ensure cache is included in dependencies

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  return (
    <div className="home">
      <div className="card">
        <h1 className="username">{username}</h1>
        <hr style={{width: '100%'}}/>
        <fieldset
          style={{
            margin: "10px 0",
            borderRadius: "10px",
            boxShadow: "inset rgb(143, 143, 245) 0px 0px 10px",
          }}
        >
          <legend>Your groups</legend>
          <GroupList groups={groups} onGroupClick={handleGroupClick} />
        </fieldset>
        <GroupSetup />
        <SignOutButton /> 
      </div>
    </div>
  );
};

export default Home;
