import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Feed from './components/Feed/Feed';
import Profile from './components/Profile/Profile';
import Chat from './components/Chat/Chat';
import ChatList from './components/Chat/ChatList';
import Groups from './components/Groups/Groups';
import GroupDetail from './components/Groups/GroupDetail';
import VideoCall from './components/VideoCall/VideoCall';
import Discover from './components/Discover/Discover';

// Set axios default base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUser(res.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="glass loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} logout={logout} />}
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/feed" /> : <Login login={login} />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/feed" /> : <Register login={login} />}
          />
          <Route
            path="/feed"
            element={user ? <Feed user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile/:id"
            element={user ? <Profile user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/chat"
            element={user ? <ChatList user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/chat/:id"
            element={user ? <Chat user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/groups"
            element={user ? <Groups user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/groups/:id"
            element={user ? <GroupDetail user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/video/:roomId"
            element={user ? <VideoCall user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/discover"
            element={user ? <Discover user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={user ? <Navigate to="/feed" /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
