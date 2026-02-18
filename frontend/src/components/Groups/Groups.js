import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CreateGroup from './CreateGroup';
import { resolveMediaUrl } from '../../utils/url';
import './Groups.css';

const Groups = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('/groups');
      setGroups(res.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGroup = (newGroup) => {
    setGroups([newGroup, ...groups]);
    setShowCreate(false);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="groups-container">
      <div className="container">
        <div className="groups-header">
          <h1 className="groups-title">Groups</h1>
          <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
            {showCreate ? 'Cancel' : 'Create Group'}
          </button>
        </div>

        {showCreate && <CreateGroup user={user} onGroupCreated={addGroup} />}

        {groups.length === 0 ? (
          <div className="empty-state glass">
            <p>No groups yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="groups-grid">
            {groups.map(group => (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="group-card glass"
              >
                {group.groupPicture && (
                  <img
                    src={resolveMediaUrl(group.groupPicture)}
                    alt={group.name}
                    className="group-image"
                  />
                )}
                <div className="group-info">
                  <h2 className="group-name">{group.name}</h2>
                  <p className="group-description">{group.description || 'No description'}</p>
                  <div className="group-meta">
                    <span>{group.members?.length || 0} members</span>
                    <span>•</span>
                    <span>Admin: {group.admin?.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
