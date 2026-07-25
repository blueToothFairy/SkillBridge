'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole, RegisterPayload, Tag } from '@/types';
import { fetchTagsApi } from '@/lib/api/tags';
import {
  UserPlus,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');

  // Step 2 State - Student Profile
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState<number>(3);
  const [availableSkills, setAvailableSkills] = useState<Tag[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js']);

  // Step 2 State - SME Profile
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');

  const [error, setError] = useState<string | null>(null);
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
    loadSkills();
  }, []);

  const handleToggleSkill = (skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Please complete all account fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let payload: RegisterPayload;

    if (role === 'STUDENT') {
      if (!fullName || !university || !major) {
        setError('Please complete all required student profile fields.');
        return;
      }
      if (selectedSkills.length === 0) {
        setError('Please select at least one skill.');
        return;
      }

      payload = {
        account: { email, password, role },
        profile: {
          fullName,
          university,
          major,
          year,
          skills: {
            expert: selectedSkills.slice(0, 2),
            proficient: selectedSkills.slice(2, 4),
            familiar: selectedSkills.slice(4),
          },
        },
      };
    } else {
      if (!companyName) {
        setError('Please provide your Company Name.');
        return;
      }
      payload = {
        account: { email, password, role },
        profile: {
          companyName,
          taxCode: taxCode || undefined,
          industry: industry || undefined,
          website: website || undefined,
        },
      };
    }

    setIsSubmitting(true);
    try {
      const newUser = await register(payload);
      if (newUser.role === 'SME') {
        router.push('/sme/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center my-auto py-4">
      <div className="w-full max-w-3xl card-crisp p-6 sm:p-8">
        {/* Header & Step Indicator */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-brand-primary shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create SkillBridge Account</h1>
              <p className="text-xs text-slate-500">Step {step} of 2 — {step === 1 ? 'Account Credentials' : `Profile Setup (${role})`}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md ${step === 1 ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
              <span>1</span> Account
            </div>
            <div className="w-4 h-0.5 bg-slate-200" />
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md ${step === 2 ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
              <span>2</span> Profile
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          /* STEP 1 FORM */
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                I want to register as:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                    role === 'STUDENT'
                      ? 'border-brand-primary bg-blue-50/30 text-slate-900 ring-2 ring-brand-primary/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="p-2 bg-blue-50 text-brand-primary rounded-md shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm">University Student</span>
                      {role === 'STUDENT' && <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Apply to short-term projects & gain verified portfolio entries.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('SME')}
                  className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                    role === 'SME'
                      ? 'border-brand-primary bg-blue-50/30 text-slate-900 ring-2 ring-brand-primary/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="p-2 bg-blue-50 text-brand-primary rounded-md shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm">SME Enterprise</span>
                      {role === 'SME' && <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Post projects & hire verified student talent for 1-4 weeks.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* 3-Column Compact Credentials Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'STUDENT' ? 'student@university.edu.vn' : 'contact@company.com'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 btn-primary text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2 FORM */
          <form onSubmit={handleSubmitFinal} className="space-y-4">
            {role === 'STUDENT' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyen Van A"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      University *
                    </label>
                    <input
                      type="text"
                      required
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="HCMUT / VNU"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Major *
                    </label>
                    <input
                      type="text"
                      required
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="Computer Science"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Academic Year
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none bg-white"
                    >
                      <option value={1}>Year 1 (Freshman)</option>
                      <option value={2}>Year 2 (Sophomore)</option>
                      <option value={3}>Year 3 (Junior)</option>
                      <option value={4}>Year 4 (Senior)</option>
                      <option value={5}>Year 5+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Skills (Choose from system tags) *
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                    {availableSkills.map((skill) => {
                      const isSelected = selectedSkills.includes(skill.name);
                      return (
                        <button
                          key={skill.id || skill.name}
                          type="button"
                          onClick={() => handleToggleSkill(skill.name)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Artisan Coffee Co."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Tax Code / Reg Number
                    </label>
                    <input
                      type="text"
                      value={taxCode}
                      onChange={(e) => setTaxCode(e.target.value)}
                      placeholder="0312345678"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Industry / Sector
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Food & Beverage / E-Commerce"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Company Website
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-xs outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 btn-secondary text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 btn-primary text-white text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs sm:text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-primary hover:text-brand-primary-hover">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
