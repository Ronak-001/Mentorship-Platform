import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiMessageCircle, FiUsers, FiCompass, FiLogOut, FiUser, FiInbox } from 'react-icons/fi';
import './Navbar.css';

const Navbar = ({ user, logout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar glass-morphism">
      <div className="navbar-container">
        <Link to="/feed" className="navbar-logo">
          <span className="logo-text">Mentor Connect</span>
        </Link>

        <div className="navbar-links">
          <Link to="/feed" className="nav-link">
            <FiHome /> Feed
          </Link>
          <Link to="/discover" className="nav-link">
            <FiCompass /> Discover
          </Link>
          <Link to="/requests" className="nav-link">
            <FiInbox /> Requests
          </Link>
          <Link to="/chat" className="nav-link">
            <FiMessageCircle /> Chat
          </Link>
          <Link to="/groups" className="nav-link">
            <FiUsers /> Groups
          </Link>
          <Link to={`/profile/${user.id || user._id}`} className="nav-link">
            <FiUser /> Profile
          </Link>
          <button onClick={handleLogout} className="nav-link logout-btn">
            <FiLogOut /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
