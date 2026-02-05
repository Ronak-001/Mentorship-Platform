import React, { useState } from 'react';
import axios from 'axios';
import { FiImage, FiVideo, FiFileText } from 'react-icons/fi';
import Avatar from '../Avatar';
import './Feed.css';

const CreatePost = ({ user, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    const fileType = e.target.files[0]?.type.startsWith('image/') ? 'image' : 'video';
    setType(fileType);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('content', content);
    formData.append('type', type);
    
    files.forEach(file => {
      formData.append('media', file);
    });

    try {
      const res = await axios.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onPostCreated(res.data);
      setContent('');
      setFiles([]);
      setType('text');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post glass">
      <form onSubmit={handleSubmit}>
        <div className="post-header">
          <Avatar name={user.name} src={user.profilePicture} size="sm" className="post-avatar" />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="post-input"
            rows="3"
          />
        </div>
        
        {files.length > 0 && (
          <div className="post-preview">
            {files.map((file, index) => (
              <div key={index} className="preview-item">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="preview-image"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(file)}
                    controls
                    className="preview-video"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="remove-preview"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="post-actions">
          <label className="file-label">
            <FiImage /> Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
            />
          </label>
          <label className="file-label">
            <FiVideo /> Video
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
            />
          </label>
          <label className="file-label">
            <FiFileText /> Blog
            <input
              type="file"
              accept="text/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
