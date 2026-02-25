import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import './Programs.css';

const ProgramForm = ({ user }) => {
    const { id } = useParams();          // undefined for create
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        title: '', description: '', skillsCovered: '',
        level: 'Beginner', format: '1:1', schedule: '', outcomes: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isEdit) fetchProgram();
    }, [id]);

    const fetchProgram = async () => {
        try {
            const res = await axios.get(`/programs/${id}`);
            const p = res.data;
            setForm({
                title: p.title,
                description: p.description,
                skillsCovered: (p.skillsCovered || []).join(', '),
                level: p.level,
                format: p.format,
                schedule: p.schedule || '',
                outcomes: (p.outcomes || []).join('\n')
            });
        } catch (err) {
            console.error('Error:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            return alert('Title and description are required');
        }
        setSaving(true);
        try {
            const body = {
                title: form.title.trim(),
                description: form.description.trim(),
                skillsCovered: form.skillsCovered.split(',').map(s => s.trim()).filter(Boolean),
                level: form.level,
                format: form.format,
                schedule: form.schedule.trim(),
                outcomes: form.outcomes.split('\n').map(s => s.trim()).filter(Boolean)
            };

            if (isEdit) {
                await axios.put(`/programs/${id}`, body);
            } else {
                await axios.post('/programs', body);
            }
            navigate('/programs/my');
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving');
        } finally {
            setSaving(false);
        }
    };

    if (user.role !== 'mentor') {
        return <div className="form-page"><div className="loading-box">Only mentors can create programs</div></div>;
    }

    return (
        <div className="form-page">
            <button className="back-btn" onClick={() => navigate(-1)}>
                <FiArrowLeft /> Back
            </button>
            <h1>{isEdit ? 'Edit Program' : 'Create Program'}</h1>

            <form className="form-card" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Title *</label>
                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. React Masterclass" required />
                </div>

                <div className="form-group">
                    <label>Description *</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="What will this program cover?" rows={4} required />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Format *</label>
                        <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}
                            disabled={isEdit}>
                            <option value="1:1">1:1 Mentoring</option>
                            <option value="Group">Group Program</option>
                        </select>
                        {isEdit && <p className="form-hint">Format cannot be changed after creation</p>}
                    </div>
                    <div className="form-group">
                        <label>Level</label>
                        <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Skills Covered</label>
                    <input value={form.skillsCovered} onChange={e => setForm({ ...form, skillsCovered: e.target.value })}
                        placeholder="React, Node.js, MongoDB (comma separated)" />
                </div>

                <div className="form-group">
                    <label>Schedule (optional)</label>
                    <input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}
                        placeholder="e.g. Mon–Fri 8pm IST" />
                </div>

                <div className="form-group">
                    <label>Outcomes</label>
                    <textarea value={form.outcomes} onChange={e => setForm({ ...form, outcomes: e.target.value })}
                        placeholder="What will students achieve? (one per line)" rows={4} />
                    <p className="form-hint">One outcome per line</p>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        <FiSave /> {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Program'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProgramForm;
