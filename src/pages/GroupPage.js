import React, { useEffect, useState, useContext,useMemo, useCallback  } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  onSnapshot,
} from "firebase/firestore";
import LeaderBoard from "../components/LeaderBoard";
import SignOutButton from "../components/SignOutButton";
import { AuthContext } from "../contexts/AuthContext";
import "../stylesheets/grouppgage.css";
import { useCache } from "../contexts/CacheContext";

const GroupPage = () => {
  const { groupId } = useParams();
  const { user } = useContext(AuthContext);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState({});
  const [newTask, setNewTask] = useState("");
  const cache = useCache();

  useEffect(() => {
    const db = getFirestore();
    const groupRef = doc(db, "groups", groupId);

    const fetchGroupData = async () => {
      try {
        // Fetch group data
        if (!cache.group) {
          const groupSnap = await getDoc(groupRef);
          if (groupSnap.exists()) {
            const groupData = { id: groupSnap.id, ...groupSnap.data() };
            cache.group = groupData;
            setGroup(groupData);
          } else {
            throw new Error("Group does not exist");
          }
        } else {
          setGroup(cache.group);
        }

        // Fetch members data
        const memberIds = Object.keys(cache.group?.members || {});
        const membersData = await Promise.all(
          memberIds.map(async (memberId) => {
            if (!cache.members[memberId]) {
              const userSnap = await getDoc(doc(db, "users", memberId));
              if (userSnap.exists()) {
                const memberData = { id: userSnap.id, ...userSnap.data() };
                cache.members[memberId] = memberData;
                return memberData;
              }
            } else {
              return cache.members[memberId];
            }
            return null;
          })
        );
        const sortedMembers = membersData.sort((a, b) => {
          if (a.id === user.uid) return -1; // Current user first
          if (b.id === user.uid) return 1;
      // Safeguard against undefined joinedAt
          const aJoinedAt = a.joinedAt ? a.joinedAt.toMillis() : Infinity; // Assign Infinity if undefined
          const bJoinedAt = b.joinedAt ? b.joinedAt.toMillis() : Infinity; // Assign Infinity if undefined

          return aJoinedAt - bJoinedAt; // Sort by joinedAt timestamp// Sort by joinedAt timestamp
        });
    
        setMembers(sortedMembers);

        // setMembers(membersData.filter((m) => m));

        // Fetch tasks for each member
        const tasksData = {};
        await Promise.all(
          membersData.map(async (member) => {
            const cacheKey = `${member.id}_${groupId}`;
            if (!cache.tasks[cacheKey]) {
              console.log("Fetching and caching tasks for user:", member.id);
              const tasksRef = collection(db, "tasks");
              const tasksQuery = query(
                tasksRef,
                where("userId", "==", member.id),
                where("groupId", "==", groupId)
              );
              const tasksSnap = await getDocs(tasksQuery);
              const memberTasks = tasksSnap.docs.map((taskDoc) => ({
                id: taskDoc.id,
                ...taskDoc.data(),
              }));
              cache.tasks[cacheKey] = memberTasks; // Cache tasks data
              tasksData[member.id] = memberTasks;
            } else {
              console.log("Using cached tasks for user:", member.id);
              tasksData[member.id] = cache.tasks[cacheKey]; // Use cached tasks
            }
          })
        );
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();

    // Real-time updates for group and tasks
    const unsubscribeGroup = onSnapshot(groupRef, (groupSnap) => {
      if (groupSnap.exists()) {
        const groupData = { id: groupSnap.id, ...groupSnap.data() };
        cache.group = groupData;
        setGroup(groupData);
      }
    });

    const unsubscribeTasks = onSnapshot(collection(db, "tasks"), () => {
      fetchGroupData();
    });

    return () => {
      unsubscribeGroup();
      unsubscribeTasks();
    };
  }, [groupId, cache]);

  const handleAddTask = async (memberId) => {
    if (newTask.trim() === "") return;
    const db = getFirestore();
    const cacheKey = `${memberId}_${groupId}`;

    try {
        // Check for duplicates in local cache before adding
        const isDuplicate = cache.tasks[cacheKey]?.some(task => task.title === newTask);
        if (isDuplicate) {
            alert("This task already exists.");
            return;
        }

        // Add task to Firestore
        const taskDoc = await addDoc(collection(db, "tasks"), {
            title: newTask,
            userId: memberId,
            groupId,
            createdAt: new Date(),
        });

        // Update cache
        const newTaskData = { id: taskDoc.id, title: newTask };
        if (!cache.tasks[cacheKey]) {
            cache.tasks[cacheKey] = []; // Initialize if it doesn't exist
        }
        cache.tasks[cacheKey].push(newTaskData); // Add new task to cache

        // Update state
        // setTasks((prevTasks) => ({
        //     ...prevTasks,
        //     [memberId]: [
        //         ...(prevTasks[memberId] || []), 
        //         newTaskData,
        //     ],
        // }));

        setNewTask("");
    } catch (error) {
        console.error("Error adding task:", error);
    }
};

  
  const handleEditTask = async (taskId, memberId) => {
    const taskToEdit = tasks[memberId]?.find((task) => task.id === taskId);
    if (!taskToEdit) return;
    const updatedTitle = prompt("Edit task title:", taskToEdit.title);
    if (updatedTitle) {
      const db = getFirestore();
      await updateDoc(doc(db, "tasks", taskId), { title: updatedTitle });
  
      // Update cache for the specific task
      const cacheKey = `${memberId}_${groupId}`; // Use cache key
      cache.tasks[cacheKey] = cache.tasks[cacheKey].map((task) =>
        task.id === taskId ? { ...task, title: updatedTitle } : task
      );
  
      // Update the state
      // setTasks((prevTasks) => ({
      //   ...prevTasks,
      //   [memberId]: prevTasks[memberId].map((task) =>
      //     task.id === taskId ? { ...task, title: updatedTitle } : task
      //   ),
      // }));
    }
  };
  
  const handleDeleteTask = async (taskId, memberId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const db = getFirestore();
      const cacheKey = `${memberId}_${groupId}`; // Use cache key
  
      // Ensure the cache exists for the member and group
      if (!cache.tasks[cacheKey]) {
        console.error("No tasks found in cache for member:", memberId);
        return; // Exit if the cache doesn't exist
      }
  
      await deleteDoc(doc(db, "tasks", taskId));
  
      // Remove the deleted task from the cache
      cache.tasks[cacheKey] = cache.tasks[cacheKey].filter((task) => task.id !== taskId);
  
      // Update the state
      setTasks((prevTasks) => ({
        ...prevTasks,
        [memberId]: prevTasks[memberId].filter((task) => task.id !== taskId),
      }));
    }
  };
  
  const handleVerifyTask = async (taskId, memberId) => {
    const db = getFirestore();
    const taskRef = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);
  
    if (taskSnap.exists()) {
      const task = taskSnap.data();
      if (user.uid === task.userId || task.completed) return;
  
      try {
        await updateDoc(taskRef, {
          completed: true,
          verifiedBy: user.uid,
          completedAt: new Date(),
        });
  
        await updateDoc(doc(db, "users", task.userId), {
          totalPoints: increment(10),
          [`groupPoints.${groupId}`]: increment(10),
        });
  
        await updateDoc(doc(db, "groups", groupId), {
          [`members.${task.userId}.points`]: increment(10),
        });
  
        // Update the cache for all tasks for the memberId and groupId
        const updatedTasks = cache.tasks[task.userId][groupId].map((t) =>
          t.id === taskId ? { ...t, completed: true, verifiedBy: user.uid } : t
        );
  
        cache.tasks[task.userId][groupId] = updatedTasks; // Update the cache
        setTasks((prevTasks) => ({
          ...prevTasks,
          [task.userId]: {
            ...prevTasks[task.userId],
            [groupId]: updatedTasks,
          },
        }));
      } catch (error) {
        console.error("Error verifying task:", error);
      }
    }
  };
  
  
  

  const ToggleSideMenu = () => {
    const sidemenubtn = document.getElementById("side-menu-opener");
    const sidemenu = document.querySelector(".side-menu");
    sidemenu.classList.toggle("closed");
    sidemenubtn.innerHTML = sidemenu.classList.contains("closed")
      ? "LeaderBoard"
      : "Close";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="group-page">
    <header>
      <Link to="/" style={{ textDecoration: "none" }}>
        Home
      </Link>
      <SignOutButton />
    </header>
    <div className="side-menu card closed">
      <div className="side-menu-btn-container">
        <button onClick={ToggleSideMenu} id="side-menu-opener">
          Leaderboard
        </button>
      </div>
      {group && <LeaderBoard groupId={group.id} />} {/* Ensure group is defined */}
    </div>
    <h1>{group ? `Group ${group.name} Tasks` : "Loading..."}</h1>
    <div className="member-tasks">
      {members.map((member) => (
        <div key={member.id} className="member">
          <h3 className="username">{member.username}</h3>
          <ul>
            {tasks[member.id] && tasks[member.id].length > 0 ? (
              tasks[member.id].map((task) => (
                <li className="task-card" key={task.id}>
                  <p>{task.title}</p>
                  <div className="card-btns-container">
                    {member.id === user.uid ? (
                      <>
                        <button
                          className="primary-btn"
                          onClick={() => handleEditTask(task.id, member.id)}
                        >
                          <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              fill="currentColor"
                              class="bi bi-pencil-square"
                              viewBox="0 0 16 16"
                            >
                              <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                              <path
                                fill-rule="evenodd"
                                d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
                              />
                            </svg>
                        </button>
                        <button onClick={() => handleDeleteTask(task.id, member.id)}>
                        <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              fill="red"
                              class="bi bi-trash3"
                              viewBox="0 0 16 16"
                            >
                              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                            </svg>
                        </button>
                      </>
                    ) : (
                      <>
                      <input
                            disabled={task.completed}
                            checked={task.completed}
                            type="checkbox"
                            onChange={() =>
                              handleVerifyTask(task.id, member.id)
                            }
                          />
                        </>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <p>No tasks assigned.</p>
            )}
          </ul>
          {member.id === user.uid && (
            <div className="add-task-form" id={member.id}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task"
            />
            <button
              className="primary-btn"
              onClick={() => handleAddTask(member.id)}
            >
              Add Task
            </button>
          </div>
          )}
        </div>
      ))}
    </div>
  </div>
);
};

export default GroupPage;
