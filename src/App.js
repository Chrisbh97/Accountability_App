import React from 'react';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import GroupPage from './pages/GroupPage'; // Import the GroupPage component
import Login from './pages/Login'; // Import the Login component from pages
import SignUp from './pages/SignUp'; // Import the SignUp component
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/group/:groupId" element={<GroupPage />} /> {/* Route for group page */}
            <Route path="/login" element={<Login />} /> {/* Route for login page */}
            <Route path="/signup" element={<SignUp />} /> {/* Route for sign-up page */}
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
