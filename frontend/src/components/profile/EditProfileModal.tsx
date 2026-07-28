'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { X, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchTagsApi } from '@/lib/api/tags';
import { Tag } from '@/types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const isStudent = user?.role === 'STUDENT';

  // Student fields
  const [fullName, setFullName] = useState(user?.profile?.fullName || '');
  const [university, setUniversity] = useState(user?.profile?.university || '');
  const [major, setMajor] = useState(user?.profile?.major || '');
  const [year, setYear] = useState<number>(user?.profile?.year || 3);
  const [githubUrl, setGithubUrl] = useState(user?.profile?.skills?.githubUrl || '');
  const [linkedInUrl, setLinkedInUrl] = useState(user?.profile?.skills?.linkedInUrl || '');
  const [availableSkills, setAvailableSkills] = useState<Tag[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.profile?.skills
      ? [
          ...(user.profile.skills.expert || []),
          ...(user.profile.skills.proficient || []),
          ...(user.profile.skills.familiar || []),
        ]
      : ['React', 'TypeScript', 'Node.js']
  );

  // SME fields
  const [companyName, setCompanyName] = useState(user?.profile?.companyName || '');
  const [taxCode, setTaxCode] = useState(user?.profile?.taxCode || '');
  const [industry, setIndustry] = useState(user?.profile?.industry || '');
  const [website, setWebsite] = useState(user?.profile?.website || '');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadSkills() {
      try {
        const tags = await fetchTagsApi('SKILL');
        if (tags && tags.length > 0) {
          setAvailableSkills(tags);
        } else {
          // fallback seed tags
          setAvailableSkills([
            { id: '1', name: 'React', type: 'SKILL', isActive: true, createdAt: '' },
            { id: '2', name: 'Node.js', type: 'SKILL', isActive: true, createdAt: '' },
            { id: '3', name: 'TypeScript', type: 'SKILL', isActive: true, createdAt: '' },
            { id: '4', name: 'Python', type: 'SKILL', isActive: true, createdAt: '' },
            { id: '5', name: 'Figma', type: 'SKILL', isActive: true, createdAt: '' },
            { id: '6', name: 'Flutter', type: 'SKILL', isActive: true, createdAt: '' },
            { id: '7', name: 'PostgreSQL', type: 'SKILL', isActive: true, createdAt: '' },
            { id: '8', name: 'Tailwind CSS', type: 'SKILL', isActive: true, createdAt: '' },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch skill tags:', err);
        setAvailableSkills([
          { id: '1', name: 'React', type: 'SKILL', isActive: true, createdAt: '' },
          { id: '2', name: 'Node.js', type: 'SKILL', isActive: true, createdAt: '' },
          { id: '3', name: 'TypeScript', type: 'SKILL', isActive: true, createdAt: '' },
          { id: '4', name: 'Python', type: 'SKILL', isActive: true, createdAt: '' },
          { id: '5', name: 'Figma', type: 'SKILL', isActive: true, createdAt: '' },
          { id: '6', name: 'Flutter', type: 'SKILL', isActive: true, createdAt: '' },
          { id: '7', name: 'PostgreSQL', type: 'SKILL', isActive: true, createdAt: '' },
          { id: '8', name: 'Tailwind CSS', type: 'SKILL', isActive: true, createdAt: '' },
        ]);
      }
    }
    if (isOpen) {
      loadSkills();
    }
  }, [isOpen]);

  const handleToggleSkill = (skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      if (isStudent) {
        if (selectedSkills.length === 0) {
          setError('Please select at least one skill.');
          setIsSubmitting(false);
          return;
        }

        await updateProfile({
          fullName,
          university,
          major,
          year,
          skills: {
            expert: selectedSkills.slice(0, 2),
            proficient: selectedSkills.slice(2, 4),
            familiar: selectedSkills.slice(4),
            githubUrl,
            linkedInUrl,
          },
        });
      } else {
        await updateProfile({
          companyName,
          taxCode,
          industry,
          website,
        });
      }

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isStudent ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    University
                  </label>
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Major
                  </label>
                  <input
                    type="text"
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs bg-white transition-all"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                    <option value={5}>Year 5+</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Skills (Choose from system tags) *
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 border border-slate-200 rounded-lg bg-slate-50/50">
                  {availableSkills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill.name);
                    return (
                      <button
                        key={skill.id || skill.name}
                        type="button"
                        onClick={() => handleToggleSkill(skill.name)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-brand-primary text-brand-primary shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tax Code / Reg Number
                  </label>
                  <input
                    type="text"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs transition-all"
                />
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-1.5 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
