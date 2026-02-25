import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FiVideo, FiMessageCircle, FiUserPlus, FiEdit2, FiPlus, FiTrash2, FiCheck, FiClock, FiX, FiDownload, FiFileText, FiActivity, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { resolveMediaUrl } from '../../utils/url';
import Avatar from '../Avatar';
import PostCard from '../Feed/PostCard';
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
  const [connectionStatus, setConnectionStatus] = useState('NOT_CONNECTED');
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editExperience, setEditExperience] = useState([]);
  const [editEducation, setEditEducation] = useState([]);
  const [editCertificates, setEditCertificates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [viewingCert, setViewingCert] = useState(null);

  // Activity section state
  const [showActivity, setShowActivity] = useState(false);
  const [activityPosts, setActivityPosts] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);

  // Instant profile photo upload
  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.patch('/users/profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfileUser(res.data);
      console.log('Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      alert('Failed to upload profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Instant cover photo upload
  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.patch('/users/cover-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfileUser(res.data);
      console.log('Cover photo updated successfully');
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      alert('Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get(`/users/${id}`);
      setProfileUser(res.data);

      // Fetch connection status if viewing someone else's profile
      const myId = currentUser.id || currentUser._id;
      if (id !== myId) {
        try {
          const statusRes = await axios.get(`/users/${id}/connection-status`);
          setConnectionStatus(statusRes.data.status);
        } catch {
          setConnectionStatus('NOT_CONNECTED');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await axios.get(`/posts/user/${id}`);
      setActivityPosts(res.data);
      setActivityLoaded(true);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setActivityLoading(false);
    }
  }, [id]);

  const toggleActivity = () => {
    const next = !showActivity;
    setShowActivity(next);
    if (next && !activityLoaded) {
      fetchActivity();
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setActivityPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handlePostDelete = (postId) => {
    setActivityPosts(prev => prev.filter(p => p._id !== postId));
  };

  useEffect(() => {
    fetchProfile();
    // Reset activity when profile changes
    setShowActivity(false);
    setActivityPosts([]);
    setActivityLoaded(false);
  }, [fetchProfile]);

  const handleConnect = async () => {
    setConnectionStatus('loading');
    try {
      const res = await axios.post(`/users/${id}/connect`);
      setConnectionStatus(res.data.status);
    } catch (error) {
      const status = error.response?.data?.status;
      if (status) {
        setConnectionStatus(status);
      } else {
        setConnectionStatus('NOT_CONNECTED');
        console.error('Error connecting:', error);
      }
    }
  };

  const handleAcceptRequest = async () => {
    setConnectionStatus('loading');
    try {
      await axios.post(`/users/${id}/accept`);
      setConnectionStatus('CONNECTED');
    } catch (error) {
      console.error('Error accepting:', error);
      setConnectionStatus('REQUEST_RECEIVED');
    }
  };

  const handleDeclineRequest = async () => {
    setConnectionStatus('loading');
    try {
      await axios.post(`/users/${id}/decline`);
      setConnectionStatus('NOT_CONNECTED');
    } catch (error) {
      console.error('Error declining:', error);
      setConnectionStatus('REQUEST_RECEIVED');
    }
  };

  const handleRequestMentor = async () => {
    try {
      await axios.post(`/users/${id}/request-mentor`, {
        message: 'I would like to learn from you!'
      });
      alert('Mentor request sent!');
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
    setCertificateFiles([]);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bio', editBio);
      formData.append('skills', editSkills);
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
      formData.append('certificatesData', JSON.stringify(certPayload));
      // Append certificate files with unique field names for correct mapping
      certificateFiles.forEach((file, idx) => {
        if (file) formData.append(`certificate_file_${idx}`, file);
      });
      const res = await axios.put(`/users/${id}`, formData);
      setProfileUser(res.data);
      setEditing(false);
      setCertificateFiles([]);
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
          <div className="profile-cover" style={{
            backgroundImage: (profileUser.coverPhoto && (profileUser.coverPhoto.startsWith('http://') || profileUser.coverPhoto.startsWith('https://')))
              ? `url(${profileUser.coverPhoto})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '200px',
            position: 'relative',
            marginBottom: '-60px'
          }}>
            {isOwnProfile && (
              <label style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                {uploadingCover ? '⏳ Uploading...' : '📷 Change Cover'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPhotoUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingCover}
                />
              </label>
            )}
          </div>
          <div className="profile-picture-container" style={{ position: 'relative', zIndex: 1, marginTop: '-30px' }}>
            <Avatar name={profileUser.name} src={profileUser.profilePicture} size="lg" className="profile-picture" />
            {isOwnProfile && (
              <label style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                background: '#667eea',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '16px'
              }}>
                {uploadingPhoto ? '⏳' : '📷'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingPhoto}
                />
              </label>
            )}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{profileUser.name}</h1>
            <p className="profile-role">{profileUser.role}</p>
            <p className="profile-connections">
              {profileUser.connections?.length || 0} Connections
            </p>
            <p className="profile-bio">{profileUser.bio || 'No bio yet'}</p>

            {isOwnProfile && !editing && (
              <button type="button" onClick={startEditing} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                <FiEdit2 /> Edit Profile
              </button>
            )}

            {isOwnProfile && editing && (
              <form onSubmit={handleSaveProfile} className="profile-edit-form" style={{ marginTop: '1rem', textAlign: 'left' }}>
                <label>
                  <span className="bio-label" >Bio</span>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
                </label>
                <label>
                  <span className="skill-label">Skills (comma-separated)</span>
                  <input type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} placeholder="e.g. JavaScript, React, Node.js" />
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
                    <label>
                      <span>Upload Certificate (PDF or Image)</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = [...certificateFiles];
                          files[idx] = e.target.files?.[0] || null;
                          setCertificateFiles(files);
                        }}
                        style={{ fontSize: '0.875rem' }}
                      />
                      {certificateFiles[idx] && (
                        <small style={{ display: 'block', marginTop: '0.25rem', color: '#059669' }}>
                          ✓ {certificateFiles[idx].name}
                        </small>
                      )}
                    </label>
                    <label><span>Credential URL (optional)</span><input type="url" value={cert.credentialUrl} onChange={(e) => { const n = [...editCertificates]; n[idx].credentialUrl = e.target.value; setEditCertificates(n); }} placeholder="https://..." /></label>
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
                {connectionStatus === 'NOT_CONNECTED' && (
                  <button onClick={handleConnect} className="btn btn-primary">
                    <FiUserPlus /> Connect
                  </button>
                )}
                {connectionStatus === 'REQUEST_SENT' && (
                  <button className="btn" disabled style={{ opacity: 0.7 }}>
                    <FiClock /> Request Sent
                  </button>
                )}
                {connectionStatus === 'REQUEST_RECEIVED' && (
                  <>
                    <button onClick={handleAcceptRequest} className="btn btn-primary">
                      <FiCheck /> Accept
                    </button>
                    <button onClick={handleDeclineRequest} className="btn btn-danger" style={{ marginLeft: '4px' }}>
                      <FiX /> Decline
                    </button>
                  </>
                )}
                {connectionStatus === 'CONNECTED' && (
                  <>
                    <button className="btn btn-success" disabled style={{ opacity: 0.8 }}>
                      <FiCheck /> Connected
                    </button>
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
                {connectionStatus === 'loading' && (
                  <button className="btn btn-primary" disabled>...</button>
                )}
                {profileUser.role === 'mentor' && currentUser.role === 'student' && (
                  <button onClick={handleRequestMentor} className="btn">
                    Request Mentor
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
            <h2>Certificates</h2>
            {profileUser.certificates && profileUser.certificates.length > 0 ? (
              <div className="certificates-grid">
                {profileUser.certificates.map((cert, index) => (
                  <div key={index} className="certificate-item">
                    {cert.image && (
                      <>
                        {cert.image.toLowerCase().endsWith('.pdf') || (cert.image.includes('cloudinary') && !cert.image.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                          <div style={{
                            padding: '1rem',
                            background: '#f3f4f6',
                            borderRadius: '8px',
                            textAlign: 'center',
                            marginBottom: '0.5rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                          }}>
                            <FiFileText size={36} color="#667eea" />
                            <button
                              onClick={() => setViewingCert({ url: cert.image, name: cert.name || 'Certificate' })}
                              className="btn btn-primary"
                              style={{ fontSize: '0.875rem', padding: '6px 16px' }}
                            >
                              View Certificate
                            </button>
                          </div>
                        ) : (
                          <img src={resolveMediaUrl(cert.image)} alt={cert.name} className="certificate-image" />
                        )}
                      </>
                    )}
                    <h3>{cert.name}</h3>
                    <p>{cert.issuer}</p>
                    <p className="date">{formatDate(cert.issueDate)}</p>
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                        View External Credential
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

          {/* ─── Activity Section (LinkedIn-style) ─── */}
          <div className="profile-section glass activity-section">
            <div className="activity-header" onClick={toggleActivity}>
              <div className="activity-header-left">
                <FiActivity className="activity-icon" />
                <h2>Activity</h2>
                <span className="activity-count">
                  {activityLoaded ? `${activityPosts.length} post${activityPosts.length !== 1 ? 's' : ''}` : ''}
                </span>
              </div>
              <button className="activity-toggle-btn">
                {showActivity ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>

            {showActivity && (
              <div className="activity-content">
                {activityLoading ? (
                  <div className="activity-loading">Loading activity...</div>
                ) : activityPosts.length === 0 ? (
                  <div className="activity-empty">
                    <FiFileText size={32} />
                    <p>{isOwnProfile ? "You haven't posted anything yet" : 'No activity yet'}</p>
                  </div>
                ) : (
                  <div className="activity-posts">
                    {activityPosts.map(post => (
                      <PostCard
                        key={post._id}
                        post={post}
                        currentUser={currentUser}
                        onUpdate={handlePostUpdate}
                        onDelete={handlePostDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Certificate Viewer Modal */}
      {viewingCert && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', flexDirection: 'column'
          }}
          onClick={() => setViewingCert(null)}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 20px', color: 'white'
          }} onClick={(e) => e.stopPropagation()}>
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>
              {viewingCert.name}
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a
                href={resolveMediaUrl(viewingCert.url)}
                download={viewingCert.name || 'certificate'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', textDecoration: 'none' }}
              >
                <FiDownload /> Download
              </a>
              <button
                onClick={() => setViewingCert(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
              >
                <FiX size={24} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, padding: '0 20px 20px' }} onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(resolveMediaUrl(viewingCert.url))}&embedded=true`}
              title={viewingCert.name || 'Certificate viewer'}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: 'white' }}
            />
          </div>
        </div>
      )}
    </div >
  );
};

export default Profile;
