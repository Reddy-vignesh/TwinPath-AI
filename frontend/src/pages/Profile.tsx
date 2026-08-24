import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore, type SkillCatalogItem } from '../stores/profileStore';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import {
  User, GraduationCap, Target, Wrench, Save, Plus, Trash2,
  Search, CheckCircle, ChevronDown, ChevronUp, Loader2,
  Globe, Code2, HelpCircle, CheckCheck, AlertCircle,
  Download, ShieldCheck
} from 'lucide-react';
import { CyberResumeUpload } from '../components/profile/CyberResumeUpload';

function Section({ title, icon, children, badge }: { title: string; icon: React.ReactNode; children: React.ReactNode; badge?: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color: 'var(--text-primary)', marginBottom: open ? '1.25rem' : 0,
        }}
      >
        {icon}
        <h3 style={{ margin: 0, flex: 1, textAlign: 'left', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        {badge && (
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            padding: '0.15rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(37, 99, 235, 0.1)',
            color: 'var(--accent-primary)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            marginRight: '0.5rem'
          }}>
            {badge}
          </span>
        )}
        {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {open && children}
    </div>
  );
}

// Academic Degree Mappings
const DEGREE_OPTIONS_BY_LEVEL: Record<string, string[]> = {
  'Undergraduate': ['B.Tech', 'B.E.', 'B.Sc', 'BCA', 'BBA', 'B.Com', 'BA', 'MBBS', 'Other Undergraduate Degree'],
  'Postgraduate': ['M.Tech', 'M.E.', 'MBA', 'MCA', 'M.Sc', 'M.Com', 'MA', 'Other Postgraduate Degree'],
  'Diploma': ['Polytechnic Diploma', 'Post Graduate Diploma', 'Vocational Diploma', 'Other Diploma'],
  'PhD': ['Ph.D in Engineering / Computer Science', 'Ph.D in Sciences', 'Ph.D in Management / Humanities', 'Other Doctorate'],
  'High School': ['10+2 / Higher Secondary (Science)', '10+2 / Higher Secondary (Commerce)', '10+2 / Higher Secondary (Arts/Humanities)'],
};

// Application Context Checkboxes
const APPLICATION_CONTEXTS = [
  'Academic',
  'Personal Projects',
  'Internship',
  'Professional Work',
  'Freelancing',
  'Open Source',
  'Learning / No Practical Application Yet'
];

// Comprehensive Master Skill Catalog for Instant Search and Recommendations
const MASTER_SKILLS_CATALOG: SkillCatalogItem[] = [
  { id: '1', name: 'Python', category: 'Programming' },
  { id: '2', name: 'JavaScript', category: 'Programming' },
  { id: '3', name: 'TypeScript', category: 'Programming' },
  { id: '4', name: 'Java', category: 'Programming' },
  { id: '5', name: 'C++', category: 'Programming' },
  { id: '6', name: 'C', category: 'Programming' },
  { id: '7', name: 'Go', category: 'Programming' },
  { id: '8', name: 'Rust', category: 'Programming' },
  { id: '9', name: 'React', category: 'Web Development' },
  { id: '10', name: 'Node.js', category: 'Web Development' },
  { id: '11', name: 'Next.js', category: 'Web Development' },
  { id: '12', name: 'FastAPI', category: 'Web Development' },
  { id: '13', name: 'Django', category: 'Web Development' },
  { id: '14', name: 'HTML', category: 'Web Development' },
  { id: '15', name: 'CSS', category: 'Web Development' },
  { id: '16', name: 'SQL', category: 'Database' },
  { id: '17', name: 'PostgreSQL', category: 'Database' },
  { id: '18', name: 'MySQL', category: 'Database' },
  { id: '19', name: 'MongoDB', category: 'Database' },
  { id: '20', name: 'Redis', category: 'Database' },
  { id: '21', name: 'Machine Learning', category: 'Data Science' },
  { id: '22', name: 'Deep Learning', category: 'Data Science' },
  { id: '23', name: 'PyTorch', category: 'Data Science' },
  { id: '24', name: 'TensorFlow', category: 'Data Science' },
  { id: '25', name: 'Scikit-learn', category: 'Data Science' },
  { id: '26', name: 'Pandas', category: 'Data Science' },
  { id: '27', name: 'NumPy', category: 'Data Science' },
  { id: '28', name: 'Natural Language Processing', category: 'Data Science' },
  { id: '29', name: 'Computer Vision', category: 'Data Science' },
  { id: '30', name: 'Docker', category: 'Cloud / DevOps' },
  { id: '31', name: 'Kubernetes', category: 'Cloud / DevOps' },
  { id: '32', name: 'AWS', category: 'Cloud / DevOps' },
  { id: '33', name: 'Google Cloud', category: 'Cloud / DevOps' },
  { id: '34', name: 'Git', category: 'Cloud / DevOps' },
  { id: '35', name: 'CI/CD', category: 'Cloud / DevOps' },
  { id: '36', name: 'Linux', category: 'Cloud / DevOps' },
  { id: '37', name: 'System Design', category: 'Cloud / DevOps' },
  { id: '38', name: 'Data Structures', category: 'Computer Science' },
  { id: '39', name: 'Algorithms', category: 'Computer Science' },
  { id: '40', name: 'UI/UX Design', category: 'Design' },
  { id: '41', name: 'Figma', category: 'Design' },
  { id: '42', name: 'Product Management', category: 'Business' },
  { id: '43', name: 'Agile / Scrum', category: 'Business' },
  { id: '44', name: 'Problem Solving', category: 'Soft Skills' },
  { id: '45', name: 'Communication', category: 'Soft Skills' },
  { id: '46', name: 'Cybersecurity', category: 'Security' },
];

// Typo-Tolerant Real-Time Search & Autocomplete Matcher
function matchSkillWithTypoTolerance(query: string, skill: SkillCatalogItem): number {
  const q = query.toLowerCase().trim().replace(/[\s\-_.]/g, '');
  const nameNorm = skill.name.toLowerCase().replace(/[\s\-_.]/g, '');
  const catNorm = skill.category.toLowerCase().replace(/[\s\-_.]/g, '');

  if (!q) return 0;
  if (nameNorm === q) return 100;
  if (nameNorm.startsWith(q)) return 90;
  if (nameNorm.includes(q)) return 75;
  if (catNorm.includes(q)) return 50;

  // Typo tolerance: Levenshtein / character edit distance for typos (e.g. "pythn", "doker", "reactjs", "kubrnetes")
  const target = nameNorm;
  let distance = 0;
  let qi = 0;
  let ti = 0;

  while (qi < q.length && ti < target.length) {
    if (q[qi] === target[ti]) {
      qi++;
      ti++;
    } else {
      distance++;
      if (q.length > target.length) qi++;
      else if (target.length > q.length) ti++;
      else { qi++; ti++; }
    }
  }
  distance += (q.length - qi) + (target.length - ti);

  const allowedErrors = q.length <= 4 ? 1 : 2;
  if (distance <= allowedErrors) {
    return 40 - distance * 10;
  }
  return 0;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    profile, skills, skillCatalog,
    isLoading, isSaving, isLoadingSkills,
    fetchProfile, updateProfile, fetchSkills,
    searchSkillCatalog, removeSkill,
  } = useProfileStore();

  // User identity names
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Multiple Coding Profiles
  const [codingProfiles, setCodingProfiles] = useState<Array<{ platform: string; url: string }>>([
    { platform: 'LeetCode', url: '' }
  ]);

  // Main Profile Evidence Form
  const [form, setForm] = useState({
    bio: '',
    location: '',
    phone: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    education_level: 'Undergraduate',
    highest_degree: 'B.Tech',
    current_major: '',
    current_university: '',
    current_cgpa: '',
    graduation_year: '',
    career_goal_primary: '',
    career_goal_secondary: '',
    preferred_industry: '',
    company_type: 'Product Company',
    preferred_work_style: 'Hybrid',
    preferred_location: '',
    willing_to_relocate: false,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Delete account modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Skill Intelligence Builder State
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<SkillCatalogItem | null>(null);
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('Intermediate');
  const [selectedContexts, setSelectedContexts] = useState<string[]>(['Personal Projects']);
  const [skillError, setSkillError] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const skillAutocompleteRef = useRef<HTMLDivElement>(null);

  // Close autocomplete dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        skillAutocompleteRef.current &&
        !skillAutocompleteRef.current.contains(event.target as Node)
      ) {
        setIsSkillDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectSkillItem = (sk: SkillCatalogItem) => {
    setSelectedSkill(sk);
    setSkillSearch(sk.name);
    setIsSkillDropdownOpen(false);
    setSkillError('');
  };

  // Resume Ingestion States
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeSuccessBanner, setResumeSuccessBanner] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState('');

  // GDPR Data Portability State
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const handleExportData = async () => {
    setIsExporting(true);
    setExportMessage('');
    try {
      let exportData = null;
      try {
        const response = await apiClient.get('/profiles/export-data');
        exportData = response.data.data || response.data;
      } catch {
        // High-fidelity fallback export using current in-memory Twin state
        exportData = {
          export_metadata: {
            platform: "TwinPath AI",
            exported_at: new Date().toISOString(),
            user_id: user?.id || "local-user",
            version: "1.0-GDPR",
          },
          user_account: {
            email: user?.email || "",
            first_name: firstName || user?.firstName || "",
            last_name: lastName || user?.lastName || "",
            role: "student",
          },
          student_profile: {
            ...form,
            coding_profiles: codingProfiles,
            twin_completeness_score: profile?.twin_completeness_score || 0,
          },
          calibrated_skills: skills.map(s => ({
            skill_id: s.skill?.id || s.id,
            skill_name: s.skill?.name || "Skill",
            proficiency_level: s.proficiency_level,
            verified: s.is_primary,
            source: s.source,
          })),
        };
      }

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `twinpath_digital_twin_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setExportMessage('Digital Twin archive exported successfully!');
    } catch {
      setExportMessage('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSkills();
  }, [fetchProfile, fetchSkills]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      // Determine initial education level from highest_degree if present
      let initialLevel = 'Undergraduate';
      if (profile.highest_degree) {
        for (const [lvl, degrees] of Object.entries(DEGREE_OPTIONS_BY_LEVEL)) {
          if (degrees.includes(profile.highest_degree)) {
            initialLevel = lvl;
            break;
          }
        }
      }

      setForm({
        bio: profile.bio ?? '',
        location: profile.location ?? '',
        phone: profile.phone ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        github_url: profile.github_url ?? '',
        portfolio_url: profile.portfolio_url ?? '',
        education_level: initialLevel,
        highest_degree: profile.highest_degree ?? (DEGREE_OPTIONS_BY_LEVEL[initialLevel]?.[0] || 'B.Tech'),
        current_major: profile.current_major ?? '',
        current_university: profile.current_university ?? '',
        current_cgpa: profile.current_cgpa?.toString() ?? '',
        graduation_year: profile.graduation_year?.toString() ?? '',
        career_goal_primary: profile.career_goal_primary ?? '',
        career_goal_secondary: profile.career_goal_secondary ?? '',
        preferred_industry: profile.preferred_industry ?? '',
        company_type: 'Product Company',
        preferred_work_style: profile.preferred_work_style ?? 'Hybrid',
        preferred_location: profile.location ?? '',
        willing_to_relocate: profile.willing_to_relocate ?? false,
      });
    }
  }, [profile]);

  const addCodingProfile = () => {
    setCodingProfiles(prev => [...prev, { platform: 'LeetCode', url: '' }]);
  };

  const removeCodingProfile = (index: number) => {
    setCodingProfiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateCodingProfile = (index: number, field: 'platform' | 'url', value: string) => {
    setCodingProfiles(prev => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleField = (field: string, value: any) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      // When education_level changes, auto-set highest_degree to first degree in that level
      if (field === 'education_level') {
        const availableDegrees = DEGREE_OPTIONS_BY_LEVEL[value] || [];
        updated.highest_degree = availableDegrees[0] || '';
      }
      return updated;
    });
  };

  const toggleContext = (ctx: string) => {
    setSelectedContexts(prev => {
      if (ctx === 'Learning / No Practical Application Yet') {
        return prev.includes(ctx) ? [] : [ctx];
      }
      const filtered = prev.filter(c => c !== 'Learning / No Practical Application Yet');
      return filtered.includes(ctx) ? filtered.filter(c => c !== ctx) : [...filtered, ctx];
    });
  };

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(false);

    // URL Validations
    if (!form.github_url.trim()) {
      setSaveError('GitHub Profile URL is required to verify code artifacts.');
      return;
    }
    if (!form.linkedin_url.trim()) {
      setSaveError('LinkedIn Profile URL is required to verify career history.');
      return;
    }

    try {
      // 1. Update user name via /auth/me
      if (firstName.trim() || lastName.trim()) {
        await apiClient.patch('/auth/me', {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        });
        await useAuthStore.getState().fetchUser();
      }

      // 2. Prepare Profile Payload
      const payload: any = {
        bio: form.bio,
        location: form.location || form.preferred_location,
        phone: form.phone,
        linkedin_url: form.linkedin_url,
        github_url: form.github_url,
        portfolio_url: form.portfolio_url,
        highest_degree: form.highest_degree,
        current_major: form.current_major,
        current_university: form.current_university,
        career_goal_primary: form.career_goal_primary,
        career_goal_secondary: form.career_goal_secondary,
        preferred_industry: form.preferred_industry,
        preferred_work_style: form.preferred_work_style,
        willing_to_relocate: form.willing_to_relocate,
      };

      if (form.current_cgpa !== '') payload.current_cgpa = parseFloat(form.current_cgpa);
      else payload.current_cgpa = null;

      if (form.graduation_year !== '') payload.graduation_year = parseInt(form.graduation_year);
      else payload.graduation_year = null;

      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });

      await updateProfile(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to save evidence. Please check your inputs.');
    }
  };

  const handleSkillSearch = useCallback(async (val: string) => {
    setSkillSearch(val);
    setSelectedSkill(null);
    if (val.length >= 1) {
      await searchSkillCatalog(val);
    }
  }, [searchSkillCatalog]);

  const mapProficiencyToNumber = (p: string): number => {
    switch (p) {
      case 'Beginner': return 3;
      case 'Intermediate': return 6;
      case 'Advanced': return 8;
      case 'Expert': return 10;
      default: return 6;
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill && !skillSearch.trim()) {
      setSkillError('Select a skill from the catalog dropdown first.');
      return;
    }
    setSkillError('');
    setAddingSkill(true);
    try {
      const skillName = selectedSkill ? selectedSkill.name : skillSearch.trim();
      const skillCat = selectedSkill ? selectedSkill.category : 'Other';
      const sourceStr = selectedContexts.length > 0 ? selectedContexts.join(', ') : 'Personal Projects';

      // Post skill directly to endpoint with name and category fallback
      await apiClient.post('/skills', {
        skill_name: skillName,
        category: skillCat,
        proficiency_level: mapProficiencyToNumber(proficiencyLevel),
        source: sourceStr,
      });

      await fetchSkills();
      setSelectedSkill(null);
      setSkillSearch('');
      setIsSkillDropdownOpen(false);
      setProficiencyLevel('Intermediate');
      setSelectedContexts(['Personal Projects']);
    } catch (e: any) {
      setSkillError(e.response?.data?.message || e.message || 'Failed to add skill.');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleResumeFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setResumeError('Please select a valid PDF file.');
      return;
    }

    setUploadingResume(true);
    setResumeError('');
    setResumeSuccessBanner(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post('/profiles/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const extracted = res.data?.data?.extracted_fields || {};
      const matchedSkills = res.data?.data?.matched_skills || [];

      // 1. Pre-fill First & Last Name if detected
      if (extracted.first_name) setFirstName(extracted.first_name);
      if (extracted.last_name) setLastName(extracted.last_name);

      // 2. Pre-fill Form Fields
      setForm(prev => ({
        ...prev,
        phone: extracted.phone || prev.phone,
        github_url: extracted.github_url || prev.github_url,
        linkedin_url: extracted.linkedin_url || prev.linkedin_url,
        portfolio_url: extracted.portfolio_url || prev.portfolio_url,
        education_level: extracted.education_level || prev.education_level,
        highest_degree: extracted.highest_degree || prev.highest_degree,
        current_major: extracted.current_major || prev.current_major,
        current_cgpa: extracted.current_cgpa ? extracted.current_cgpa.toString() : prev.current_cgpa,
        graduation_year: extracted.graduation_year ? extracted.graduation_year.toString() : prev.graduation_year,
      }));

      // 3. Populate Matched Skills into User Profile
      if (matchedSkills.length > 0) {
        for (const sk of matchedSkills) {
          try {
            await apiClient.post('/skills', {
              skill_id: sk.skill_id,
              proficiency_level: sk.proficiency_level || 8,
              source: sk.source || 'Personal Projects, Academic',
            });
          } catch {
            // Ignore duplicate skill errors
          }
        }
        await fetchSkills();
      }

      setResumeSuccessBanner(
        `✨ Resume Parsed! Found ${matchedSkills.length} skills and pre-filled your profile fields. Please verify, add or adjust any details below, and click 'Save Evidence & Calibrate Twin'.`
      );
    } catch (err: any) {
      setResumeError(err.response?.data?.detail || err.response?.data?.message || 'Failed to parse resume PDF.');
    } finally {
      setUploadingResume(false);
    }
  };

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

  const completeness = profile?.twin_completeness_score || 0;
  const isComplete = completeness >= 0.8;

  if (isLoading && !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 size={32} className="spin" color="var(--accent-primary)" />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading Evidence & Digital Twin...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '4rem' }}>

      {/* Executive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Digital Twin Evidence Layer
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Every piece of evidence calibrates your 216-D vector space for accurate career trajectories and salary models.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-surface)', padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-md)', border: 'var(--micro-border)'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isComplete ? 'var(--success)' : 'var(--warning)',
              boxShadow: `0 0 8px ${isComplete ? 'var(--success)' : 'var(--warning)'}`
            }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Fidelity: {Math.round(completeness * 100)}%
            </span>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem', gap: '0.4rem' }}
          >
            {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Calibrating...' : 'Save Evidence & Calibrate'}</span>
          </button>
        </div>
      </div>

      {/* Global Status Notifications */}
      {saveSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
        }}>
          <CheckCheck size={16} />
          <span>Profile evidence saved and Digital Twin recalibrated successfully!</span>
        </div>
      )}

      {saveError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
        }}>
          <AlertCircle size={16} />
          <span>{saveError}</span>
        </div>
      )}

      {resumeSuccessBanner && (
        <div style={{
          background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.4)',
          color: 'var(--text-primary)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.875rem',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.15)'
        }}>
          <CheckCircle size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem', color: 'var(--accent-primary)' }}>
              Resume Evidence Extracted
            </span>
            <span>{resumeSuccessBanner}</span>
          </div>
        </div>
      )}

      {/* Cyber Holographic Resume & Evidence Ingestion Vault */}
      <CyberResumeUpload
        onFileSelect={handleResumeFile}
        uploading={uploadingResume}
      />

      {resumeError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--danger)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem', fontSize: '0.8125rem'
        }}>
          {resumeError}
        </div>
      )}

      {/* SECTION 1: PROFESSIONAL IDENTITY */}
      <Section title="1. Professional Identity" icon={<User size={18} color="var(--accent-primary)" />} badge="Required Links">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

          {/* First Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              First Name *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Alex"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
          </div>

          {/* Last Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Last Name *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Morgan"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Current Location
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Hyderabad, India"
              value={form.location}
              onChange={e => handleField('location', e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Phone Number
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. +91 98765 43210"
              value={form.phone}
              onChange={e => handleField('phone', e.target.value)}
            />
          </div>

        </div>

        {/* Bio */}
        <div style={{ marginBottom: '1.25rem', width: '100%' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Professional Summary & Research Focus
          </label>
          <textarea
            className="input-field"
            rows={4}
            placeholder="Describe your engineering domain, technical interests, research projects, and focus areas..."
            value={form.bio}
            onChange={e => handleField('bio', e.target.value)}
            style={{ width: '100%', minHeight: '110px', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        {/* Verified Link Collection Bar */}
        <div style={{ background: 'var(--bg-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: 'var(--micro-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Globe size={15} color="var(--accent-primary)" />
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Professional Links & Evidence Verification
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* GitHub URL (Required) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                  <span>GitHub Profile URL *</span>
                </label>
                <span title="Verifies technical skills, projects, and coding frequency for salary predictions." style={{ cursor: 'help', color: 'var(--accent-primary)' }}>
                  <HelpCircle size={13} />
                </span>
              </div>
              <input
                type="url"
                className="input-field"
                placeholder="https://github.com/your-handle"
                value={form.github_url}
                onChange={e => handleField('github_url', e.target.value)}
                required
              />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Powers repo analysis, tech stack detection, and project quality scoring.
              </span>
            </div>

            {/* LinkedIn URL (Required) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  <span>LinkedIn Profile URL *</span>
                </label>
                <span title="Extracts professional tenure, certifications, and career trajectories." style={{ cursor: 'help', color: 'var(--accent-primary)' }}>
                  <HelpCircle size={13} />
                </span>
              </div>
              <input
                type="url"
                className="input-field"
                placeholder="https://linkedin.com/in/your-handle"
                value={form.linkedin_url}
                onChange={e => handleField('linkedin_url', e.target.value)}
                required
              />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Validates work history, internships, and increases Digital Twin confidence.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Portfolio Website (Optional) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Portfolio / Personal Website <span style={{ opacity: 0.6 }}>(Optional)</span>
                </label>
                <span title="Evaluates portfolio architecture and personal project showcase." style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                  <HelpCircle size={13} />
                </span>
              </div>
              <input
                type="url"
                className="input-field"
                placeholder="https://yourportfolio.dev"
                value={form.portfolio_url}
                onChange={e => handleField('portfolio_url', e.target.value)}
              />
            </div>

            {/* Dynamic Coding Platform Manager */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Code2 size={12} />
                  <span>Coding Platforms & Profiles</span>
                </label>
                <button
                  type="button"
                  onClick={addCodingProfile}
                  style={{
                    background: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid rgba(37, 99, 235, 0.4)',
                    color: 'var(--accent-primary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Plus size={11} />  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {codingProfiles.map((cp, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <select
                      className="input-field"
                      value={cp.platform}
                      onChange={e => updateCodingProfile(idx, 'platform', e.target.value)}
                      style={{ width: '130px', flexShrink: 0 }}
                    >
                      <option value="LeetCode">LeetCode</option>
                      <option value="HackerRank">HackerRank</option>
                      <option value="CodeChef">CodeChef</option>
                      <option value="Codeforces">Codeforces</option>
                      <option value="Kaggle">Kaggle</option>
                      <option value="GeeksforGeeks">GeeksforGeeks</option>
                      <option value="AtCoder">AtCoder</option>
                    </select>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Username or profile URL"
                      value={cp.url}
                      onChange={e => updateCodingProfile(idx, 'url', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {codingProfiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCodingProfile(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.2rem',
                        }}
                        title="Remove Platform"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </Section>

      {/* SECTION 2: ACADEMIC PROFILE (DEPENDENT DROPDOWNS) */}
      <Section title="2. Academic Profile" icon={<GraduationCap size={18} color="var(--accent-primary)" />} badge="Dependent Taxonomy">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

          {/* Step 1: Highest Education Level */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step 1: Highest Education Level *
            </label>
            <select
              className="input-field"
              value={form.education_level}
              onChange={e => handleField('education_level', e.target.value)}
            >
              <option value="High School">High School</option>
              <option value="Diploma">Diploma</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="PhD">PhD</option>
            </select>
          </div>

          {/* Step 2: Dependent Degree Options */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step 2: Degree Program *
            </label>
            <select
              className="input-field"
              value={form.highest_degree}
              onChange={e => handleField('highest_degree', e.target.value)}
            >
              {(DEGREE_OPTIONS_BY_LEVEL[form.education_level] || []).map(deg => (
                <option key={deg} value={deg}>{deg}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Step 3: Branch, Institution, CGPA, Grad Year */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Major / Branch of Study *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Computer Science and Engineering"
              value={form.current_major}
              onChange={e => handleField('current_major', e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              University / Institution *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Indian Institute of Technology"
              value={form.current_university}
              onChange={e => handleField('current_university', e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cumulative CGPA / GPA (Scale of 10)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              className="input-field"
              placeholder="e.g. 8.75"
              value={form.current_cgpa}
              onChange={e => handleField('current_cgpa', e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Graduation Year
            </label>
            <input
              type="number"
              min="1950"
              max="2035"
              className="input-field"
              placeholder="e.g. 2026"
              value={form.graduation_year}
              onChange={e => handleField('graduation_year', e.target.value)}
            />
          </div>

        </div>
      </Section>

      {/* SECTION 3: CAREER INTENT */}
      <Section title="3. Career Intent" icon={<Target size={18} color="var(--accent-primary)" />} badge="Trajectory Vectoring">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Primary Career Goal *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. AI Systems Engineer"
              value={form.career_goal_primary}
              onChange={e => handleField('career_goal_primary', e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Secondary Career Goal
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Site Reliability Engineer"
              value={form.career_goal_secondary}
              onChange={e => handleField('career_goal_secondary', e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Preferred Industry
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Artificial Intelligence, FinTech, SaaS"
              value={form.preferred_industry}
              onChange={e => handleField('preferred_industry', e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Preferred Company Type
            </label>
            <select
              className="input-field"
              value={form.company_type}
              onChange={e => handleField('company_type', e.target.value)}
            >
              <option value="Startup">Startup</option>
              <option value="Product Company">Product Company</option>
              <option value="Service Company">Service Company</option>
              <option value="Research">Research & Labs</option>
              <option value="Government">Government & Defense</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Preferred Work Mode
            </label>
            <select
              className="input-field"
              value={form.preferred_work_style}
              onChange={e => handleField('preferred_work_style', e.target.value)}
            >
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

        </div>

        {/* Relocation Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="relocateCheck"
            checked={form.willing_to_relocate}
            onChange={e => handleField('willing_to_relocate', e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
          />
          <label htmlFor="relocateCheck" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
            Open to domestic and international relocation for optimal career trajectories.
          </label>
        </div>
      </Section>

      {/* SECTION 4: SKILL INTELLIGENCE */}
      <Section title="4. Skill Intelligence" icon={<Wrench size={18} color="var(--accent-primary)" />} badge={`${skills.length} Verified`}>

        {/* Add Skill Builder */}
        <div style={{ background: 'var(--bg-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: 'var(--micro-border)', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Add Skill with Verified Application Evidence
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

            {/* Search Dropdown with Full Catalog Autocomplete & Typo Protection */}
            <div ref={skillAutocompleteRef} style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Search Skill Catalog *
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '32px', paddingRight: skillSearch ? '30px' : '10px' }}
                  placeholder="e.g. Python, Docker, PyTorch, React, SQL..."
                  value={skillSearch}
                  onFocus={() => {
                    if (skillSearch.trim().length >= 1) {
                      setIsSkillDropdownOpen(true);
                    }
                  }}
                  onChange={e => {
                    setSkillSearch(e.target.value);
                    setIsSkillDropdownOpen(true);
                    handleSkillSearch(e.target.value);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      setIsSkillDropdownOpen(false);
                    }
                  }}
                />
                {skillSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setSkillSearch('');
                      setSelectedSkill(null);
                      setIsSkillDropdownOpen(false);
                    }}
                    style={{
                      position: 'absolute', right: '10px', top: '9px',
                      background: 'none', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '2px'
                    }}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown displaying clearly below input */}
              {isSkillDropdownOpen && skillSearch.trim().length >= 1 && (() => {
                const pool = [...MASTER_SKILLS_CATALOG, ...skillCatalog];
                const seen = new Set<string>();
                const scored: Array<{ skill: SkillCatalogItem; score: number }> = [];

                for (const sk of pool) {
                  const key = sk.name.toLowerCase();
                  if (seen.has(key)) continue;
                  seen.add(key);
                  const score = matchSkillWithTypoTolerance(skillSearch, sk);
                  if (score > 0) {
                    scored.push({ skill: sk, score });
                  }
                }

                scored.sort((a, b) => b.score - a.score);
                const matches = scored.slice(0, 10).map(s => s.skill);

                if (matches.length === 0) {
                  return (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
                      background: 'var(--bg-surface)', border: '1px solid rgba(56, 189, 248, 0.35)',
                      borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginTop: '2px',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)', fontSize: '0.8125rem', color: 'var(--text-muted)'
                    }}>
                      No exact match found in catalog.
                    </div>
                  );
                }

                return (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999,
                    background: 'var(--bg-surface)', border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: 'var(--radius-md)', maxHeight: '220px', overflowY: 'auto',
                    marginTop: '2px', boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)'
                  }}>
                    {matches.map(sk => {
                      const isSelected = selectedSkill?.name.toLowerCase() === sk.name.toLowerCase();
                      return (
                        <div
                          key={sk.id}
                          onClick={() => handleSelectSkillItem(sk)}
                          style={{
                            padding: '0.65rem 0.9rem', cursor: 'pointer', fontSize: '0.8125rem',
                            borderBottom: 'var(--micro-border)', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center',
                            background: isSelected ? 'rgba(37, 99, 235, 0.18)' : 'transparent',
                            transition: 'background 0.12s ease',
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sk.name}</span>
                            {isSelected && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>✓ Selected</span>
                            )}
                          </div>
                          <span style={{
                            fontSize: '0.6875rem', color: 'var(--text-muted)',
                            background: 'rgba(255, 255, 255, 0.04)', padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-sm)', border: 'var(--micro-border)'
                          }}>
                            {sk.category}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Proficiency Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Proficiency Level *
              </label>
              <select
                className="input-field"
                value={proficiencyLevel}
                onChange={e => setProficiencyLevel(e.target.value as any)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

          </div>

          {/* Where have you used this skill? Checkboxes */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Where have you applied this skill? (Evidence Collection) *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {APPLICATION_CONTEXTS.map(ctx => {
                const isSelected = selectedContexts.includes(ctx);
                return (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => toggleContext(ctx)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      border: isSelected ? '1px solid rgba(37, 99, 235, 0.5)' : 'var(--micro-border)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}{ctx}
                  </button>
                );
              })}
            </div>
          </div>

          {skillError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.75rem', margin: '0 0 0.75rem 0' }}>
              {skillError}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddSkill}
              disabled={addingSkill}
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem', gap: '0.35rem' }}
            >
              {addingSkill ? <Loader2 size={13} className="spin" /> : <Plus size={13} />}
              <span>Add to Intelligence Inventory</span>
            </button>
          </div>

        </div>

        {/* Existing Skills List */}
        {isLoadingSkills ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            <Loader2 size={20} className="spin" />
          </div>
        ) : skills.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', margin: '1rem 0' }}>
            No skills added yet. Upload your resume or search the catalog above to populate skill vectors.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {skills.map(us => (
              <div
                key={us.id}
                style={{
                  background: 'var(--bg-elevated)', padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)', border: 'var(--micro-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {us.skill?.name || 'Skill'}
                    </span>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 600, padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-sm)', background: 'rgba(37, 99, 235, 0.15)', color: 'var(--accent-primary)'
                    }}>
                      Level {us.proficiency_level}/10
                    </span>
                  </div>
                  {us.source && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>
                      Context: {us.source}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await removeSkill(us.id);
                    } catch (e) {
                      console.error('Failed to remove skill', e);
                    } finally {
                      await fetchSkills();
                    }
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '0.2rem', transition: 'color 0.15s ease'
                  }}
                  title="Remove Skill"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* GDPR Data Sovereignty & Portability Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.04) 0%, rgba(147, 51, 234, 0.04) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 700 }}>
              Data Sovereignty & GDPR Portability
            </h4>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              Download a complete JSON snapshot of your Digital Twin vector matrix, calibrated skills, and academic profile.
            </p>
            {exportMessage && (
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                ✓ {exportMessage}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportData}
          disabled={isExporting}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            border: 'none',
            color: '#fff',
            padding: '0.55rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.8125rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.25)',
          }}
        >
          {isExporting ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
          <span>{isExporting ? 'Exporting Archive...' : 'Download My Data (JSON)'}</span>
        </button>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div
        className="card"
        style={{
          background: 'rgba(239, 68, 68, 0.03)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--danger)', fontSize: '0.9375rem', fontWeight: 700 }}>
            Danger Zone — Delete Account
          </h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            Permanently delete your profile, Digital Twin embeddings, and all simulation records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', backdropFilter: 'blur(8px)'
          }}
        >
          <div
            className="card"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '420px', width: '100%', padding: '1.5rem',
              background: 'var(--bg-surface)', border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)', fontSize: '1.15rem', fontWeight: 700 }}>
              Confirm Account Deletion
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Are you sure you want to permanently delete your account? This action cannot be undone and will erase all Digital Twin representations.
            </p>

            {deleteError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {deleteError}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                style={{ fontSize: '0.8125rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                style={{
                  background: 'var(--danger)', border: 'none', color: '#fff',
                  padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-md)',
                  fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                }}
              >
                {isDeletingAccount ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                <span>{isDeletingAccount ? 'Deleting...' : 'Confirm Deletion'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
