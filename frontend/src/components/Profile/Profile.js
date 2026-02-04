import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FiVideo, FiMessageCircle, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import './Profile.css';

const Profile = ({ user: currentUser }) => {
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/users/${id}`);
      setProfileUser(res.data);
      setIsConnected(res.data.connections?.some(
        conn => (conn._id || conn) === (currentUser.id || currentUser._id)
      ));
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await axios.post(`/users/${id}/connect`);
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };

  const handleRequestMentor = async () => {
    try {
      await axios.post(`/users/${id}/request-mentor`, {
        message: 'I would like to learn from you!'
      });
      setRequestSent(true);
    } catch (error) {
      console.error('Error requesting mentor:', error);
    }
  };

  const startVideoCall = () => {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    window.open(`/video/${roomId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container">
        <div className="error">User not found</div>
      </div>
    );
  }

  const isOwnProfile = (currentUser.id || currentUser._id) === (profileUser._id || profileUser.id);

  return (
    <div className="profile-container">
      <div className="container">
        <div className="profile-header glass">
          <div className="profile-cover">
            <div className="profile-picture-container">
              <img
                src={profileUser.profilePicture || 'https://via.placeholder.com/150'}
                alt={profileUser.name}
                className="profile-picture"
              />
            </div>
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{profileUser.name}</h1>
            <p className="profile-role">{profileUser.role}</p>
            <p className="profile-bio">{profileUser.bio || 'No bio yet'}</p>
            
            {!isOwnProfile && (
              <div className="profile-actions">
                {!isConnected && (
                  <button onClick={handleConnect} className="btn btn-primary">
                    <FiUserPlus /> Connect
                  </button>
                )}
                {isConnected && (
                  <>
                    <button onClick={startVideoCall} className="btn btn-primary">
                      <FiVideo /> Video Call
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.post('/chat', { userId: id });
                          window.location.href = `/chat/${res.data._id}`;
                        } catch (error) {
                          console.error('Error creating chat:', error);
                        }
                      }}
                      className="btn"
                    >
                      <FiMessageCircle /> Message
                    </button>
                  </>
                )}
                {profileUser.role === 'mentor' && currentUser.role === 'student' && (
                  <button onClick={handleRequestMentor} className="btn" disabled={requestSent}>
                    {requestSent ? 'Request Sent' : 'Request Mentor'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section glass">
            <h2>Experience</h2>
            {profileUser.experience && profileUser.experience.length > 0 ? (
              profileUser.experience.map((exp, index) => (
                <div key={index} className="experience-item">
                  <h3>{exp.title}</h3>
                  <p className="company">{exp.company}</p>
                  <p className="date">
                    {new Date(exp.startDate).toLocaleDateString()} -{' '}
                    {exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString()}
                  </p>
                  {exp.description && <p>{exp.description}</p>}
                </div>
              ))
            ) : (
              <p>No experience added yet</p>
            )}
          </div>

          <div className="profile-section glass">
            <h2>Education</h2>
            {profileUser.education && profileUser.education.length > 0 ? (
              profileUser.education.map((edu, index) => (
                <div key={index} className="education-item">
                  <h3>{edu.degree} in {edu.field}</h3>
                  <p className="school">{edu.school}</p>
                  <p className="date">
                    {new Date(edu.startDate).toLocaleDateString()} -{' '}
                    {new Date(edu.endDate).toLocaleDateString()}
                  </p>
                  {edu.description && <p>{edu.description}</p>}
                </div>
              ))
            ) : (
              <p>No education added yet</p>
            )}
          </div>

          <div className="profile-section glass">
            <h2>Certificates</h2>
            {profileUser.certificates && profileUser.certificates.length > 0 ? (
              <div className="certificates-grid">
                {profileUser.certificates.map((cert, index) => (
                  <div key={index} className="certificate-item">
                    {cert.image && (
                      <img src={cert.image} alt={cert.name} className="certificate-image" />
                    )}
                    <h3>{cert.name}</h3>
                    <p>{cert.issuer}</p>
                    <p className="date">{new Date(cert.issueDate).toLocaleDateString()}</p>
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                        View Credential
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No certificates added yet</p>
            )}
          </div>

          <div className="profile-section glass">
            <h2>Skills</h2>
            {profileUser.skills && profileUser.skills.length > 0 ? (
              <div className="skills-list">
                {profileUser.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            ) : (
              <p>No skills added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
