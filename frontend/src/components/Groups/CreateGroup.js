import React, { useState } from 'react';
import axios from 'axios';
import './Groups.css';

const CreateGroup = ({ user, onGroupCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    if (file) {
      data.append('groupPicture', file);
    }

    try {
      const res = await axios.post('/groups', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onGroupCreated(res.data);
      setFormData({ name: '', description: '' });
      setFile(null);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-group glass">
      <h2>Create New Group</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Group Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            required
            placeholder="Enter group name"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input"
            rows="3"
            placeholder="Enter group description"
          />
        </div>
        <div className="form-group">
          <label>Group Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="input"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  );
};

export default CreateGroup;
