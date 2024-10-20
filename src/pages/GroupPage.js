import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom"; // Import Link for navigation
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
} from "firebase/firestore";
import LeaderBoard from "../components/LeaderBoard";
import SignOutButton from "../components/SignOutButton"; // Import the SignOutButton
import { AuthContext } from "../contexts/AuthContext"; // Import AuthContext
import "../stylesheets/grouppgage.css";

const GroupPage = () => {
  const { groupId } = useParams(); // Get the groupId from the URL
  const { user, username } = useContext(AuthContext); // Get username from context
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]); // State to hold group members
  const [tasks, setTasks] = useState({}); // State to hold tasks for each member
  const [newTask, setNewTask] = useState(""); // State for new task input
  //#region
  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore();
      const groupRef = doc(db, "groups", groupId);
      const tasksData = {};

      await getDoc(groupRef)
        .then(async (response) => {
          if (response.exists()) {
            setGroup({ id: response.id, ...response.data() });
            const membersMap = response.data().members || {}; // Assuming members is a map
            const memberIds = Object.keys(membersMap); // Get the keys (user IDs)
            const membersData = await memberIds.map(async (memberId) => {
              const userRef = doc(db, "users", memberId);
              return await getDoc(userRef)
                .then((response) => {
                  if (response.exists()) {
                    return {
                      id: response.id,
                      username: response.data().username,
                      ...response.data(),
                    };
                  } else {
                    console.log("No data");
                    return null;
                  }
                })
                .catch((error) => {
                  console.log("Error getting document:", error);
                });
            });
            await Promise.all(membersData)
              .then(async (data) => {
                setMembers(data);
                for (const member of data) {
                  const tasksRef = collection(db, "tasks");
                  const q = query(
                    tasksRef,
                    where("userId", "==", member.id),
                    where("groupId", "==", groupId)
                  );
                  const querySnapshot = await getDocs(q).then((response) => {
                    return response;
                  });
                  tasksData[member.id] = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));
                }
                setTasks(tasksData);
              })
              .catch((error) => {
                console.error("Error fetching tasks:", error);
              });
            setLoading(false);
          } else {
            console.log("No such document!");
          }
        })
        .catch((error) => {
          console.log("Error getting document:", error);
        });
    };

    fetchData();
  }, []);

  const handleAddTask = async (memberId) => {
    if (newTask.trim() === "") return; // Prevent adding empty tasks
    const db = getFirestore();
    try {
      const docRef = await addDoc(collection(db, "tasks"), {
        title: newTask,
        userId: memberId,
        groupId: groupId,
        createdAt: new Date(),
      });
      setNewTask(""); // Clear the input after adding
      // Re-fetch tasks to update the list
      const updatedTasks = { ...tasks };
      updatedTasks[memberId] = [
        ...(updatedTasks[memberId] || []),
        { id: docRef.id, title: newTask },
      ];
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleEditTask = async (taskId, memberId) => {
    const taskToEdit = tasks[memberId].find((task) => task.id === taskId);
    const updatedTitle = prompt("Edit task title:", taskToEdit.title);
    if (updatedTitle) {
      const db = getFirestore();
      await updateDoc(doc(db, "tasks", taskId), { title: updatedTitle });
      const updatedTasks = { ...tasks };
      updatedTasks[memberId] = updatedTasks[memberId].map((task) =>
        task.id === taskId ? { ...task, title: updatedTitle } : task
      );
      setTasks(updatedTasks);
    }
  };

  const handleDeleteTask = async (taskId, memberId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const db = getFirestore();
      await deleteDoc(doc(db, "tasks", taskId));
      const updatedTasks = { ...tasks };
      updatedTasks[memberId] = updatedTasks[memberId].filter(
        (task) => task.id !== taskId
      );
      setTasks(updatedTasks);
    }
  };

  const handleVerifyTask = async (taskId, memberId) => {
    const db = getFirestore();
    const taskRef = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);

    if (taskSnap.exists()) {
      const task = taskSnap.data();

      // Check if the task is already completed
      if (task.completed) {
        alert("This task has already been verified.");
        return; // Prevent further verification
      }

      if (user.uid === task.userId) return; // Prevent self-verification

      try {
        // Update task as completed and verified
        await updateDoc(taskRef, {
          completed: true,
          verifiedBy: user.uid,
          completedAt: new Date(),
        });

        // Update points for the user whose task was verified
        const userRef = doc(db, "users", task.userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const groupId = task.groupId; // Get the group ID from the task

          // Update points in user document for the specific group
          await updateDoc(userRef, {
            totalPoints: increment(10), // Increment total points
            [`groupPoints.${groupId}`]: increment(10), // Increment points for the specific group
          });

          // Update group points
          const groupRef = doc(db, "groups", groupId);
          await updateDoc(groupRef, {
            [`members.${task.userId}.points`]: increment(10), // Increment points for the user in the group
          });
        }
      } catch (error) {
        console.error("Error verifying task:", error);
        alert("Failed to verify task. Please try again.");
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
  //#endregion
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
        <LeaderBoard groupId={group.id} />
      </div>
      <h1>Group {group.name} Tasks</h1>
      <div className="member-tasks">
        {members.map((member) => (
          <div key={member.id} className="member">
            <h3 className="username">{member.username}</h3>
            <ul>
              {tasks[member.id] && tasks[member.id].length > 0 ? (
                tasks[member.id].map((task) => (
                  <li className="task-card" key={task.id}>
                    {task.title}
                    <div className="card-btns-container">
                      {member.id === user.uid ? (
                        <>
                          <button
                            className="primary-btn"
                            onClick={() => handleEditTask(task.id, member.id)}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id, member.id)}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleVerifyTask(task.id, member.id)}
                          disabled={task.completed} // Disable button if task is completed
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li>No tasks assigned</li>
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
