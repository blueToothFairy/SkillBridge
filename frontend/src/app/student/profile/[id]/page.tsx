'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { fetchStudentPortfolioApi } from '@/lib/api/portfolio';
import { fetchStudentCertificatesApi } from '@/lib/api/certificates';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import {
  MapPin,
  Star,
  CheckCircle2,
  Edit,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Award,
  Globe,
  Code2,
  Loader2,
  AlertCircle,
  Share2,
  Filter,
} from 'lucide-react';

type ProfileTab = 'overview' | 'portfolio' | 'completed' | 'experience';

function getInitials(name: string) {
  if (!name) return 'SB';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function formatDate(value?: string | Date) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params?.id as string;

  const { studentProfile, portfolioEntries } = useApp();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [skillFilter, setSkillFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');

  useEffect(() => {
    async function loadData() {
      if (!studentId) return;
      try {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchStudentPortfolioApi(studentId);
          setProfile(data.profile);
          setPortfolios(data.portfolio);
          try {
            const certs = await fetchStudentCertificatesApi(studentId);
            setCertificates(certs);
          } catch {
            setCertificates([]);
          }
        } catch (apiErr) {
          console.warn('API fetch failed, falling back to mock data:', apiErr);
          if (studentId === 'stu-1' || studentId === studentProfile.id) {
            setProfile(studentProfile);
            setPortfolios(portfolioEntries);
            setCertificates([]);
          } else {
            throw apiErr;
          }
        }
      } catch (err: any) {
        console.error('Failed to load profile/portfolio:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [studentId, studentProfile, portfolioEntries]);

  const isOwner = user?.role === 'STUDENT' && user?.profile?.id === studentId;
  const activeProfile = isOwner ? user?.profile || profile : profile;

  const skillsData = activeProfile?.skills as any;
  const githubUrl = skillsData?.githubUrl || activeProfile?.githubUrl || '';
  const linkedInUrl = skillsData?.linkedInUrl || activeProfile?.linkedInUrl || '';

  const displayProfile = activeProfile
    ? {
        fullName: activeProfile.fullName,
        university: activeProfile.university,
        major: activeProfile.major,
        year: activeProfile.year,
        location: skillsData?.location || activeProfile.location || 'Ho Chi Minh City, Vietnam',
        rating: activeProfile.rating || 5.0,
        reviewCount: activeProfile.reviewCount || portfolios.length,
        completedProjectsCount: portfolios.length,
        githubUrl,
        linkedInUrl,
        bio:
          skillsData?.bio ||
          activeProfile.bio ||
          'SkillBridge student building verified SME project experience.',
        skills: {
          expert: skillsData?.expert || [],
          proficient: skillsData?.proficient || [],
          familiar: skillsData?.familiar || [],
        },
        availability: skillsData?.availability || activeProfile.availability || 'Available — up to 20h/week',
        availableUntil: skillsData?.availableUntil || activeProfile.availableUntil || 'Dec 2026',
      }
    : null;

  const allSkills = useMemo(() => {
    if (!displayProfile) return [];
    return [
      ...new Set([
        ...(displayProfile.skills.expert || []),
        ...(displayProfile.skills.proficient || []),
        ...(displayProfile.skills.familiar || []),
      ]),
    ];
  }, [displayProfile]);

  const portfolioYears = useMemo(() => {
    const years = portfolios
      .map((item) => new Date(item.completedAt || item.completedDate).getFullYear())
      .filter((year) => !Number.isNaN(year));
    return ['All', ...Array.from(new Set(years)).sort((a, b) => b - a).map(String)];
  }, [portfolios]);

  const filteredPortfolios = useMemo(() => {
    return portfolios.filter((item) => {
      const completedYear = new Date(item.completedAt || item.completedDate).getFullYear().toString();
      const yearMatch = yearFilter === 'All' || completedYear === yearFilter;
      const skillMatch =
        skillFilter === 'All' ||
        (item.skillsApplied || []).some((skill: string) => skill.toLowerCase() === skillFilter.toLowerCase());
      return yearMatch && skillMatch;
    });
  }, [portfolios, skillFilter, yearFilter]);

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'completed', label: 'Completed Projects' },
    { id: 'experience', label: 'Experience' },
  ];

  const handleSharePortfolio = async (item: any) => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/certificates/${item.verificationCode}`
        : '';
    try {
      await navigator.clipboard.writeText(url);
      alert('Certificate verification link copied.');
    } catch {
      alert('Unable to copy link.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !displayProfile) {
    return (
      <div className="card-crisp p-6 bg-white text-center space-y-4 max-w-xl mx-auto my-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Student Profile Not Found</h2>
        <p className="text-sm text-slate-500">{error || 'The requested student profile does not exist or could not be loaded.'}</p>
        <Link href="/student/dashboard" className="btn-primary inline-block text-sm px-4 py-2">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const renderSkillTier = (label: string, skills: string[], tierClass: string) => {
    if (!skills?.length) return null;
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={`${label}-${skill}`} className={tierClass}>
              {skill}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderPortfolioCards = (items: any[]) => {
    if (items.length === 0) {
      return <p className="text-xs text-slate-400 italic">No verified portfolio entries match your filters.</p>;
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="card-crisp p-5 bg-white card-crisp-hover space-y-3">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                {getInitials(item.smeCompany || item.smeName || 'SB')}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    SME VERIFIED
                  </span>
                  <span className="text-[11px] text-slate-400">{formatDate(item.completedAt || item.completedDate)}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{item.projectTitle}</h3>
                <p className="text-xs text-slate-500">
                  {item.smeCompany || item.smeName} · {item.role || item.studentRole || 'Contributor'} ·{' '}
                  {item.duration || `${item.durationWeeks} weeks`}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(item.skillsApplied || []).map((sk: string) => (
                    <span key={sk} className="tag-predefined text-[11px]">
                      {sk}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-amber-500 pt-1">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-[11px] text-slate-500 ml-1">Verified completion</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              {item.deliverableUrl && (
                <a
                  href={item.deliverableUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  View details <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                onClick={() => handleSharePortfolio(item)}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <Link
                href={`/certificates/${item.verificationCode}`}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Award className="h-3.5 w-3.5" /> Certificate
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="card-crisp p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center font-bold text-blue-700 text-2xl shrink-0">
              {getInitials(displayProfile.fullName)}
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{displayProfile.fullName}</h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {displayProfile.major} · {displayProfile.university} · Year {displayProfile.year}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {displayProfile.location}
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {displayProfile.rating.toFixed(1)} ({displayProfile.reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {displayProfile.completedProjectsCount} projects completed
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start flex-wrap">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-slate-700" /> GitHub
              </a>
            )}
            {linkedInUrl && (
              <a href={linkedInUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-blue-600" /> LinkedIn
              </a>
            )}
            {isOwner && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">{displayProfile.bio}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> {displayProfile.availability}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-600 px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-500" /> Until {displayProfile.availableUntil}
          </span>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-crisp p-5 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900">Skills</h2>
                {isOwner && (
                  <button onClick={() => setIsEditModalOpen(true)} className="text-xs text-blue-600 font-semibold hover:underline">
                    Edit
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {renderSkillTier('Expert', displayProfile.skills.expert, 'tag-skill-expert')}
                {renderSkillTier('Proficient', displayProfile.skills.proficient, 'tag-skill-proficient')}
                {renderSkillTier('Familiar', displayProfile.skills.familiar, 'tag-skill-familiar')}
                {!displayProfile.skills.expert?.length &&
                  !displayProfile.skills.proficient?.length &&
                  !displayProfile.skills.familiar?.length && (
                    <p className="text-xs text-slate-400 italic">Chưa chọn kỹ năng nào.</p>
                  )}
              </div>
            </div>

            <div className="card-crisp p-5 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" /> Certificates
                </h2>
                <Link href="/certificates" className="text-xs text-blue-600 font-semibold hover:underline">
                  View all
                </Link>
              </div>
              {certificates.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No certificates issued yet.</p>
              ) : (
                <div className="space-y-3">
                  {certificates.slice(0, 3).map((cert) => (
                    <div key={cert.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{cert.projectTitle}</p>
                        <p className="text-[11px] text-slate-500">{cert.smeCompany} · {cert.issueDate}</p>
                      </div>
                      <Link href={`/certificates/${cert.verificationCode}`} className="text-xs font-semibold text-blue-600 hover:underline">
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-crisp p-5 bg-white space-y-3">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Availability</h2>
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-bold text-emerald-600">Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hours/week</span>
                  <span className="font-semibold text-slate-900">Up to 20h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available until</span>
                  <span className="font-semibold text-slate-900">{displayProfile.availableUntil}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Preferred work</span>
                  <span className="font-semibold text-slate-900">Remote</span>
                </div>
              </div>
            </div>

            <div className="card-crisp p-5 bg-white space-y-3">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Stats</h2>
              <div className="text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Projects completed</span>
                  <span className="font-bold text-slate-900 text-sm">{portfolios.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">SME verified entries</span>
                  <span className="font-bold text-emerald-600">{portfolios.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Certificates earned</span>
                  <span className="font-bold text-blue-600">{certificates.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Skill verification score</span>
                  <span className="font-bold text-blue-600">{displayProfile.rating.toFixed(1)} / 5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'portfolio' || activeTab === 'completed') && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Verified SkillBridge Portfolio
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {filteredPortfolios.length} projects · {portfolios.length} SME-verified
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Filters
              </span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white"
              >
                {portfolioYears.map((year) => (
                  <option key={year} value={year}>
                    {year === 'All' ? 'All years' : year}
                  </option>
                ))}
              </select>
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white"
              >
                <option value="All">All skills</option>
                {allSkills.map((skill) => (
                  <option key={skill} value={skill}>
                    {skill}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Projects', value: portfolios.length, tone: 'text-slate-900' },
              { label: 'SME Verified', value: portfolios.length, tone: 'text-emerald-600' },
              { label: 'Certificates', value: certificates.length, tone: 'text-blue-600' },
              { label: 'Avg Rating', value: `${displayProfile.rating.toFixed(1)}`, tone: 'text-amber-600' },
            ].map((stat) => (
              <div key={stat.label} className="card-crisp p-4 bg-white text-center">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{stat.label}</p>
                <p className={`text-2xl font-extrabold mt-1 ${stat.tone}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {renderPortfolioCards(activeTab === 'completed' ? filteredPortfolios : filteredPortfolios)}
        </div>
      )}

      {activeTab === 'experience' && (
        <div className="card-crisp p-10 bg-white text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Professional Experience</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Detailed work experience timeline is planned for V1.1. For MVP, verified SME project history is available in the Portfolio tab.
          </p>
          <button onClick={() => setActiveTab('portfolio')} className="btn-primary text-sm px-4 py-2">
            View Verified Portfolio
          </button>
        </div>
      )}

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
}
