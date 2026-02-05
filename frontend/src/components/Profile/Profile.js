import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FiVideo, FiMessageCircle, FiUserPlus, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import Avatar from '../Avatar';
import './Profile.css';

const emptyExperience = () => ({ title: '', company: '', startDate: '', endDate: '', description: '', current: false });
const emptyEducation = () => ({ school: '', degree: '', field: '', startDate: '', endDate: '', description: '' });
const emptyCertificate = () => ({ name: '', issuer: '', issueDate: '', credentialUrl: '', image: '' });

const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const Profile = ({ user: currentUser }) => {
  const { id } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editExperience, setEditExperience] = useState([]);
  const [editEducation, setEditEducation] = useState([]);
  const [editCertificates, setEditCertificates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);

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

  const toDateInput = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  };

  const startEditing = () => {
    setEditBio(profileUser.bio || '');
    setEditSkills(Array.isArray(profileUser.skills) ? profileUser.skills.join(', ') : '');
    setEditExperience(
      profileUser.experience?.length
        ? profileUser.experience.map((e) => ({
            title: e.title || '',
            company: e.company || '',
            startDate: toDateInput(e.startDate),
            endDate: toDateInput(e.endDate),
            description: e.description || '',
            current: !!e.current,
          }))
        : []
    );
    setEditEducation(
      profileUser.education?.length
        ? profileUser.education.map((e) => ({
            school: e.school || '',
            degree: e.degree || '',
            field: e.field || '',
            startDate: toDateInput(e.startDate),
            endDate: toDateInput(e.endDate),
            description: e.description || '',
          }))
        : []
    );
    setEditCertificates(
      profileUser.certificates?.length
        ? profileUser.certificates.map((c) => ({
            name: c.name || '',
            issuer: c.issuer || '',
            issueDate: toDateInput(c.issueDate),
            credentialUrl: c.credentialUrl || '',
            image: c.image || '',
          }))
        : []
    );
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setProfilePictureFile(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bio', editBio);
      formData.append('skills', editSkills);
      if (profilePictureFile) formData.append('profilePicture', profilePictureFile);
      // Send arrays as JSON; convert date strings to ISO for backend
      const expPayload = editExperience.map((e) => ({
        ...e,
        startDate: e.startDate || undefined,
        endDate: e.current ? undefined : (e.endDate || undefined),
        current: !!e.current,
      }));
      const eduPayload = editEducation.map((e) => ({
        ...e,
        startDate: e.startDate || undefined,
        endDate: e.endDate || undefined,
      }));
      const certPayload = editCertificates.map((c) => ({
        ...c,
        issueDate: c.issueDate || undefined,
      }));
      formData.append('experience', JSON.stringify(expPayload));
      formData.append('education', JSON.stringify(eduPayload));
      formData.append('certificates', JSON.stringify(certPayload));
      const res = await axios.put(`/users/${id}`, formData);
      setProfileUser(res.data);
      setEditing(false);
      setProfilePictureFile(null);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="container">
        <div className="profile-header glass">
          <div className="profile-cover">
            <div className="profile-picture-container">
              <Avatar name={profileUser.name} src={profileUser.profilePicture} size="lg" className="profile-picture" />
            </div>
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{profileUser.name}</h1>
            <p className="profile-role">{profileUser.role}</p>
            <p className="profile-bio">{profileUser.bio || 'No bio yet'}</p>

            {isOwnProfile && !editing && (
              <button type="button" onClick={startEditing} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                <FiEdit2 /> Edit Profile
              </button>
            )}

            {isOwnProfile && editing && (
              <form onSubmit={handleSaveProfile} className="profile-edit-form" style={{ marginTop: '1rem', textAlign: 'left' }}>
                <label>
                  <span>Bio</span>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
                </label>
                <label>
                  <span>Skills (comma-separated)</span>
                  <input type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} placeholder="e.g. JavaScript, React, Node.js" />
                </label>
                <label>
                  <span>Profile picture</span>
                  <input type="file" accept="image/*" onChange={(e) => setProfilePictureFile(e.target.files?.[0] || null)} />
                </label>

                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Experience</h3>
                {editExperience.map((exp, idx) => (
                  <div key={idx} className="edit-item-card">
                    <h4>Experience #{idx + 1}</h4>
                    <label><span>Title</span><input type="text" value={exp.title} onChange={(e) => { const n = [...editExperience]; n[idx].title = e.target.value; setEditExperience(n); }} placeholder="Job title" /></label>
                    <label><span>Company</span><input type="text" value={exp.company} onChange={(e) => { const n = [...editExperience]; n[idx].company = e.target.value; setEditExperience(n); }} /></label>
                    <label><span>Start date</span><input type="date" value={exp.startDate} onChange={(e) => { const n = [...editExperience]; n[idx].startDate = e.target.value; setEditExperience(n); }} /></label>
                    <label><span>Current job</span><input type="checkbox" checked={exp.current} onChange={(e) => { const n = [...editExperience]; n[idx].current = e.target.checked; setEditExperience(n); }} /></label>
                    {!exp.current && <label><span>End date</span><input type="date" value={exp.endDate} onChange={(e) => { const n = [...editExperience]; n[idx].endDate = e.target.value; setEditExperience(n); }} /></label>}
                    <label><span>Description</span><textarea value={exp.description} onChange={(e) => { const n = [...editExperience]; n[idx].description = e.target.value; setEditExperience(n); }} rows={2} /></label>
                    <button type="button" className="btn btn-remove" onClick={() => setEditExperience(editExperience.filter((_, i) => i !== idx))}><FiTrash2 /> Remove</button>
                  </div>
                ))}
                <button type="button" className="btn btn-add" onClick={() => setEditExperience([...editExperience, emptyExperience()])}><FiPlus /> Add experience</button>

                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Education</h3>
                {editEducation.map((edu, idx) => (
                  <div key={idx} className="edit-item-card">
                    <h4>Education #{idx + 1}</h4>
                    <label><span>School</span><input type="text" value={edu.school} onChange={(e) => { const n = [...editEducation]; n[idx].school = e.target.value; setEditEducation(n); }} /></label>
                    <label><span>Degree</span><input type="text" value={edu.degree} onChange={(e) => { const n = [...editEducation]; n[idx].degree = e.target.value; setEditEducation(n); }} placeholder="e.g. B.Tech" /></label>
                    <label><span>Field</span><input type="text" value={edu.field} onChange={(e) => { const n = [...editEducation]; n[idx].field = e.target.value; setEditEducation(n); }} placeholder="e.g. Computer Science" /></label>
                    <label><span>Start date</span><input type="date" value={edu.startDate} onChange={(e) => { const n = [...editEducation]; n[idx].startDate = e.target.value; setEditEducation(n); }} /></label>
                    <label><span>End date</span><input type="date" value={edu.endDate} onChange={(e) => { const n = [...editEducation]; n[idx].endDate = e.target.value; setEditEducation(n); }} /></label>
                    <label><span>Description</span><textarea value={edu.description} onChange={(e) => { const n = [...editEducation]; n[idx].description = e.target.value; setEditEducation(n); }} rows={2} /></label>
                    <button type="button" className="btn btn-remove" onClick={() => setEditEducation(editEducation.filter((_, i) => i !== idx))}><FiTrash2 /> Remove</button>
                  </div>
                ))}
                <button type="button" className="btn btn-add" onClick={() => setEditEducation([...editEducation, emptyEducation()])}><FiPlus /> Add education</button>

                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Certificates</h3>
                {editCertificates.map((cert, idx) => (
                  <div key={idx} className="edit-item-card">
                    <h4>Certificate #{idx + 1}</h4>
                    <label><span>Name</span><input type="text" value={cert.name} onChange={(e) => { const n = [...editCertificates]; n[idx].name = e.target.value; setEditCertificates(n); }} /></label>
                    <label><span>Issuer</span><input type="text" value={cert.issuer} onChange={(e) => { const n = [...editCertificates]; n[idx].issuer = e.target.value; setEditCertificates(n); }} /></label>
                    <label><span>Issue date</span><input type="date" value={cert.issueDate} onChange={(e) => { const n = [...editCertificates]; n[idx].issueDate = e.target.value; setEditCertificates(n); }} /></label>
                    <label><span>Credential URL</span><input type="url" value={cert.credentialUrl} onChange={(e) => { const n = [...editCertificates]; n[idx].credentialUrl = e.target.value; setEditCertificates(n); }} placeholder="https://..." /></label>
                    <button type="button" className="btn btn-remove" onClick={() => setEditCertificates(editCertificates.filter((_, i) => i !== idx))}><FiTrash2 /> Remove</button>
                  </div>
                ))}
                <button type="button" className="btn btn-add" onClick={() => setEditCertificates([...editCertificates, emptyCertificate()])}><FiPlus /> Add certificate</button>

                <div style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                  <button type="button" onClick={cancelEditing} className="btn" style={{ marginLeft: '0.5rem' }}>Cancel</button>
                </div>
              </form>
            )}
            
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
                    {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
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
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
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
                    <p className="date">{formatDate(cert.issueDate)}</p>
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
