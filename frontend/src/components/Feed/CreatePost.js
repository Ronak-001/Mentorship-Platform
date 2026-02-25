import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiImage, FiVideo, FiFileText } from 'react-icons/fi';
import Avatar from '../Avatar';
import './Feed.css';

const CreatePost = ({ user, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // const handleFileChange = (e) => {
  //   setFiles(Array.from(e.target.files));
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   let fileType = 'text';
  //   if (file.type.startsWith('image/')) fileType = 'image';
  //   else if (file.type.startsWith('video/')) fileType = 'video';
  //   else fileType = 'blog';

  //   setType(fileType);
  // };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (!selectedFiles.length) return;

    const filesWithPreview = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setFiles(prev => [...prev, ...filesWithPreview]);

    const firstFile = selectedFiles[0];
    if (firstFile.type.startsWith('image/')) setType('image');
    else if (firstFile.type.startsWith('video/')) setType('video');
    else setType('blog');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('content', content);
    formData.append('type', type);

    files.forEach(({ file }) => {
      formData.append('media', file);
    });

    try {
      const res = await axios.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onPostCreated(res.data);
      files.forEach(f => URL.revokeObjectURL(f.preview));
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

  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

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
            {files.map(({ file, preview }, index) => (
              <div key={index} className="preview-item">
                {file.type.startsWith('image/') ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="preview-image"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    className="preview-video"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(files[index].preview);
                    setFiles(prev => prev.filter((_, i) => i !== index));
                  }}
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
