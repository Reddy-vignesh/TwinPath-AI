import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore, type SkillCatalogItem } from '../stores/profileStore';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import { 
  User, GraduationCap, Target, Wrench, Award, Save, Plus, Trash2, 
  Search, CheckCircle, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

// ── Section collapse wrapper ──────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: 'var(--text-primary)', marginBottom: open ? 'var(--spacing-lg)' : 0,
        }}
      >
        {icon}
        <h3 style={{ margin: 0, flex: 1, textAlign: 'left' }}>{title}</h3>
        {open ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
      </button>
      {open && children}
    </div>
  );
}

// ── Proficiency label helper ──────────────────────────────────────
function profLabel(level: number) {
  if (level <= 2) return 'Beginner';
  if (level <= 4) return 'Elementary';
  if (level <= 6) return 'Intermediate';
  if (level <= 8) return 'Advanced';
  return 'Expert';
}

export default function Profile() {
  const navigate = useNavigate();
  const {
    profile, skills, skillCatalog,
    isLoading, isSaving, isLoadingSkills,
    fetchProfile, updateProfile, fetchSkills,
    searchSkillCatalog, addSkill, removeSkill,
    error,
  } = useProfileStore();

  // Local form state mirrors the profile
  const [form, setForm] = useState({
    bio: '',
    location: '',
    phone: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    current_cgpa: '',
    highest_degree: '',
    current_major: '',
    current_university: '',
    graduation_year: '',
    career_goal_primary: '',
    career_goal_secondary: '',
    preferred_industry: '',
    preferred_work_style: '',
    willing_to_relocate: false,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setIsDeletingAccount(true);
    try {
      await useAuthStore.getState().deleteAccount();
      navigate('/login');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
    }
  };

  // Skills sub-section state
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<SkillCatalogItem | null>(null);
  const [proficiency, setProficiency] = useState(5);
  const [yearsExp, setYearsExp] = useState('');
  const [skillError, setSkillError] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSkills();
  }, [fetchProfile, fetchSkills]);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio ?? '',
        location: profile.location ?? '',
        phone: profile.phone ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        github_url: profile.github_url ?? '',
        portfolio_url: profile.portfolio_url ?? '',
        current_cgpa: profile.current_cgpa?.toString() ?? '',
        highest_degree: profile.highest_degree ?? '',
        current_major: profile.current_major ?? '',
        current_university: profile.current_university ?? '',
        graduation_year: profile.graduation_year?.toString() ?? '',
        career_goal_primary: profile.career_goal_primary ?? '',
        career_goal_secondary: profile.career_goal_secondary ?? '',
        preferred_industry: profile.preferred_industry ?? '',
        preferred_work_style: profile.preferred_work_style ?? '',
        willing_to_relocate: profile.willing_to_relocate ?? false,
      });
    }
  }, [profile]);

  const handleField = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);
    try {
      const payload: any = { ...form };
      if (payload.current_cgpa !== '') payload.current_cgpa = parseFloat(payload.current_cgpa);
      else payload.current_cgpa = null;
      if (payload.graduation_year !== '') payload.graduation_year = parseInt(payload.graduation_year);
      else payload.graduation_year = null;
      // Clear empty strings → null
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });
      await updateProfile(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Failed to save. Check your inputs and try again.');
    }
  };

  // Skill search debounce
  const handleSkillSearch = useCallback(async (val: string) => {
    setSkillSearch(val);
    setSelectedSkill(null);
    if (val.length >= 1) {
      await searchSkillCatalog(val);
    }
  }, [searchSkillCatalog]);

  const handleAddSkill = async () => {
    if (!selectedSkill) { setSkillError('Select a skill from the catalog first.'); return; }
    setSkillError('');
    setAddingSkill(true);
    try {
      await addSkill(selectedSkill.id, proficiency, yearsExp ? parseFloat(yearsExp) : undefined);
      setSelectedSkill(null);
      setSkillSearch('');
      setProficiency(5);
      setYearsExp('');
    } catch (e: any) {
      setSkillError(e.message);
    } finally {
      setAddingSkill(false);
    }
  };

  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeSuccess, setResumeSuccess] = useState('');
  const [resumeError, setResumeError] = useState('');

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.pdf')) {
      setResumeError('Please select a valid PDF file.');
      return;
    }

    setUploadingResume(true);
    setResumeError('');
    setResumeSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post('/profiles/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResumeSuccess(res.data?.message || 'Resume parsed successfully!');
      fetchProfile();
      fetchSkills();
    } catch (err: any) {
      setResumeError(err?.response?.data?.detail || 'Failed to parse PDF resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const completeness = profile?.twin_completeness_score ?? 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2>Twin Profile</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Fill in your details below or upload your PDF resume to auto-build your Digital Twin.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          {/* Completeness badge */}
          <div style={{
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '12px', padding: '6px 16px',
            color: 'var(--accent-blue)', fontWeight: 600, fontSize: '0.875rem',
          }}>
            ⚡ Twin Completeness: {Math.round(completeness * 100)}%
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving…' : 'Save All'}
          </button>
        </div>
      </div>

      {/* PDF Resume Auto-Parser Hero Dropzone */}
      <div className="card" style={{
        marginBottom: 'var(--spacing-xl)',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(59, 130, 246, 0.12))',
        border: '1px dashed rgba(139, 92, 246, 0.4)',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '0.75rem', borderRadius: '50%', color: 'var(--accent-purple)' }}>
            <Wrench size={24} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>⚡ Fast Track: Auto-Build Twin from PDF Resume</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, maxWidth: '550px' }}>
            Upload your PDF resume (`.pdf`). Our AI Parser will extract your technical skills, experience, and major automatically!
          </p>

          <label className="btn btn-secondary" style={{ marginTop: '0.5rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {uploadingResume ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {uploadingResume ? 'Parsing PDF Resume...' : 'Upload PDF Resume'}
            <input
              type="file"
              accept=".pdf"
              onChange={handleResumeUpload}
              disabled={uploadingResume}
              style={{ display: 'none' }}
            />
          </label>

          {resumeSuccess && (
            <div style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}>
              ✓ {resumeSuccess}
            </div>
          )}

          {resumeError && (
            <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {resumeError}
            </div>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)',
          color: 'var(--success)', padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-lg)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <CheckCircle size={16} /> Profile saved successfully!
        </div>
      )}
      {(saveError || error) && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)',
          color: 'var(--error)', padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-lg)',
        }}>
          {saveError || error}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <>
          {/* ── Personal Info ── */}
          <Section title="Personal Information" icon={<User size={20} color="var(--accent-blue)" />}>
            <div className="grid grid-cols-2 gap-lg">
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Bio / About You</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={form.bio}
                  onChange={e => handleField('bio', e.target.value)}
                  placeholder="Tell us about yourself, your aspirations and background…"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Location</label>
                <input className="input-field" value={form.location} onChange={e => handleField('location', e.target.value)} placeholder="City, Country" />
              </div>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => handleField('phone', e.target.value)} placeholder="+1 234 567 8900" />
              </div>
              <div className="input-group">
                <label className="input-label">LinkedIn URL</label>
                <input className="input-field" value={form.linkedin_url} onChange={e => handleField('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/you" />
              </div>
              <div className="input-group">
                <label className="input-label">GitHub URL</label>
                <input className="input-field" value={form.github_url} onChange={e => handleField('github_url', e.target.value)} placeholder="https://github.com/you" />
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Portfolio URL</label>
                <input className="input-field" value={form.portfolio_url} onChange={e => handleField('portfolio_url', e.target.value)} placeholder="https://yourportfolio.com" />
              </div>
            </div>
          </Section>

          {/* ── Academics ── */}
          <Section title="Academic History" icon={<GraduationCap size={20} color="var(--accent-teal)" />}>
            <div className="grid grid-cols-2 gap-lg">
              <div className="input-group">
                <label className="input-label">Highest Degree</label>
                <select className="input-field" value={form.highest_degree} onChange={e => handleField('highest_degree', e.target.value)}>
                  <option value="">Select degree…</option>
                  <option>High School</option>
                  <option>Associate's</option>
                  <option>Bachelor's</option>
                  <option>Master's</option>
                  <option>PhD / Doctoral</option>
                  <option>Diploma</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Current Major / Field of Study</label>
                <input className="input-field" value={form.current_major} onChange={e => handleField('current_major', e.target.value)} placeholder="Computer Science" />
              </div>
              <div className="input-group">
                <label className="input-label">University / Institution</label>
                <input className="input-field" value={form.current_university} onChange={e => handleField('current_university', e.target.value)} placeholder="MIT, IIT, etc." />
              </div>
              <div className="input-group">
                <label className="input-label">CGPA / GPA (0–10)</label>
                <input
                  type="number" step="0.01" min="0" max="10"
                  className="input-field" value={form.current_cgpa}
                  onChange={e => handleField('current_cgpa', e.target.value)}
                  placeholder="8.5"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Expected Graduation Year</label>
                <input
                  type="number" min="2000" max="2040"
                  className="input-field" value={form.graduation_year}
                  onChange={e => handleField('graduation_year', e.target.value)}
                  placeholder="2026"
                />
              </div>
            </div>
          </Section>

          {/* ── Career Goals ── */}
          <Section title="Career Goals & Preferences" icon={<Target size={20} color="var(--accent-purple)" />}>
            <div className="grid grid-cols-2 gap-lg">
              <div className="input-group">
                <label className="input-label">Primary Career Goal</label>
                <input className="input-field" value={form.career_goal_primary} onChange={e => handleField('career_goal_primary', e.target.value)} placeholder="Software Engineer, Data Scientist…" />
              </div>
              <div className="input-group">
                <label className="input-label">Secondary Career Goal</label>
                <input className="input-field" value={form.career_goal_secondary} onChange={e => handleField('career_goal_secondary', e.target.value)} placeholder="Product Manager, ML Researcher…" />
              </div>
              <div className="input-group">
                <label className="input-label">Preferred Industry</label>
                <select className="input-field" value={form.preferred_industry} onChange={e => handleField('preferred_industry', e.target.value)}>
                  <option value="">Select industry…</option>
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Education</option>
                  <option>E-Commerce</option>
                  <option>Manufacturing</option>
                  <option>Media & Entertainment</option>
                  <option>Government</option>
                  <option>Research & Academia</option>
                  <option>Startup / Entrepreneurship</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Preferred Work Style</label>
                <select className="input-field" value={form.preferred_work_style} onChange={e => handleField('preferred_work_style', e.target.value)}>
                  <option value="">Select style…</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-Site</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', gridColumn: 'span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={form.willing_to_relocate}
                    onChange={e => handleField('willing_to_relocate', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-blue)' }}
                  />
                  <span style={{ fontWeight: 500 }}>Willing to Relocate</span>
                </label>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Checking this opens more career opportunities in other cities/countries.
                </span>
              </div>
            </div>
          </Section>

          {/* ── Skills Manager ── */}
          <Section title="Skills" icon={<Wrench size={20} color="var(--success)" />}>
            {/* Add Skill Form */}
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-md)' }}>
                Search the skill catalog and add skills with your proficiency level.
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="input-group" style={{ flex: '2 1 200px', position: 'relative' }}>

                  <label className="input-label">Search Skill Catalog</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '36px' }}
                      value={skillSearch}
                      onChange={e => handleSkillSearch(e.target.value)}
                      placeholder="Type to search: Python, React, SQL…"
                    />
                  </div>
                  {/* Dropdown results */}
                  {skillCatalog.length > 0 && skillSearch && !selectedSkill && (
                    <div style={{
                      position: 'absolute', zIndex: 50, background: 'var(--bg-surface)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxHeight: '200px', overflowY: 'auto',
                      width: '100%', marginTop: '4px',
                    }}>
                      {skillCatalog.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setSelectedSkill(s); setSkillSearch(s.name); }}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '10px 14px', background: 'none',
                            border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
                            textAlign: 'left', fontSize: '0.875rem',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <span>{s.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="input-group" style={{ flex: '1 1 140px' }}>
                  <label className="input-label">Proficiency: {proficiency} — {profLabel(proficiency)}</label>
                  <input
                    type="range" min="1" max="10" value={proficiency}
                    onChange={e => setProficiency(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
                  />
                </div>

                <div className="input-group" style={{ flex: '1 1 100px' }}>
                  <label className="input-label">Years Exp.</label>
                  <input
                    type="number" min="0" step="0.5" className="input-field"
                    value={yearsExp} onChange={e => setYearsExp(e.target.value)}
                    placeholder="e.g. 2"
                  />
                </div>

                <button
                  type="button" className="btn btn-primary"
                  onClick={handleAddSkill} disabled={!selectedSkill || addingSkill}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-end' }}
                >
                  {addingSkill ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add Skill
                </button>
              </div>
              {skillError && <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px' }}>{skillError}</p>}
            </div>

            {/* Skills List */}
            {isLoadingSkills ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : skills.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                No skills added yet. Search above to add your first skill.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {skills.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                    padding: '12px 16px', background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>{s.skill.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '8px' }}>{s.skill.category}</span>
                    </div>
                    {/* Proficiency bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                        <div style={{
                          width: `${(s.proficiency_level / 10) * 100}%`,
                          height: '100%', borderRadius: '3px',
                          background: s.proficiency_level >= 7 ? 'var(--success)' : s.proficiency_level >= 4 ? 'var(--accent-blue)' : 'var(--warning)',
                        }} />
                      </div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', minWidth: '80px' }}>
                        {s.proficiency_level}/10 · {profLabel(s.proficiency_level)}
                      </span>
                    </div>
                    {s.years_experience && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{s.years_experience}yr</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSkill(s.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', opacity: 0.6, padding: '4px' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                      title="Remove skill"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── Certifications hint ── */}
          <Section title="Certifications & Projects" icon={<Award size={20} color="var(--warning)" />}>
            <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                Coming soon — add your certifications and project portfolio to boost your Twin Completeness score further.
              </p>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </Section>

          {/* ── Danger Zone: Delete Account ── */}
          <Section title="Account Settings & Danger Zone" icon={<Trash2 size={20} color="var(--error)" />}>
            <div style={{ padding: 'var(--spacing-xs)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                Deleting your account will permanently remove your profile, career vectors, preferences, and all associated digital twin data. This action cannot be undone.
              </p>
              <div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: 'var(--error)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Trash2 size={16} />
                  Delete My Account
                </button>
              </div>
            </div>
          </Section>

          {/* Bottom save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 13, 22, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '420px', border: '1px solid var(--error)', textAlign: 'center', padding: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <Trash2 size={24} color="var(--error)" />
            </div>
            <h3 style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>Delete Account Permanently?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Are you sure you want to delete your account? All your digital twin vectors, skills, and settings will be permanently removed.
            </p>
            {deleteError && (
              <p style={{ color: 'var(--error)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{deleteError}</p>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)} disabled={isDeletingAccount}>
                Cancel
              </button>
              <button type="button" className="btn" style={{ flex: 1, background: 'var(--error)', color: 'white', fontWeight: 600 }} onClick={handleDeleteAccount} disabled={isDeletingAccount}>
                {isDeletingAccount ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
