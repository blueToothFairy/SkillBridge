'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';

export default function StudentProfilePage() {
  const { studentProfile, portfolioEntries } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Portfolio' | 'Completed Projects'>('Overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const displayProfile = {
    fullName: user?.profile?.fullName || studentProfile.fullName,
    university: user?.profile?.university || studentProfile.university,
    major: user?.profile?.major || studentProfile.major,
    year: user?.profile?.year || studentProfile.year,
    location: studentProfile.location,
    rating: studentProfile.rating,
    reviewCount: studentProfile.reviewCount,
    completedProjectsCount: studentProfile.completedProjectsCount,
    githubUrl: studentProfile.githubUrl,
    linkedInUrl: studentProfile.linkedInUrl,
    bio: studentProfile.bio,
    skills: user?.profile?.skills || studentProfile.skills,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Profile Card */}
      <div className="card-crisp p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar Circle */}
            <div className="h-20 w-20 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center font-bold text-blue-700 text-2xl shrink-0">
              {getInitials(displayProfile.fullName)}
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {displayProfile.fullName}
              </h1>
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
                  {displayProfile.rating} ({displayProfile.reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {displayProfile.completedProjectsCount} projects completed
                </span>
              </div>
            </div>
          </div>

          {/* External Links & Edit */}
          <div className="flex items-center gap-2 self-end sm:self-start">
            <a
              href={displayProfile.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Code2 className="h-3.5 w-3.5 text-slate-700" /> GitHub
            </a>
            {displayProfile.linkedInUrl && (
              <a
                href={displayProfile.linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Globe className="h-3.5 w-3.5 text-blue-600" /> LinkedIn
              </a>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-primary text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 text-white rounded-lg shadow-sm"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Bio Text */}
        <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
          {displayProfile.bio}
        </p>

        {/* Availability Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> {studentProfile.availability}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-600 px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-500" /> Until {studentProfile.availableUntil}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-semibold">
        {(['Overview', 'Portfolio', 'Completed Projects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Skills & Verified Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills Breakdown Box */}
          <div className="card-crisp p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold text-slate-900">Skills</h2>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Edit
              </button>
            </div>

            {/* EXPERT */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                EXPERT
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(displayProfile.skills.expert || []).map((s: string) => (
                  <span
                    key={s}
                    className="tag-matched bg-blue-50 text-blue-700 border-blue-200 text-xs px-2.5 py-1"
                  >
                    {s} · Expert
                  </span>
                ))}
              </div>
            </div>

            {/* PROFICIENT */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                PROFICIENT
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(displayProfile.skills.proficient || []).map((s: string) => (
                  <span key={s} className="tag-predefined text-xs px-2.5 py-1">
                    {s} · Proficient
                  </span>
                ))}
              </div>
            </div>

            {/* FAMILIAR */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                FAMILIAR
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(displayProfile.skills.familiar || []).map((s: string) => (
                  <span
                    key={s}
                    className="bg-slate-50 text-slate-500 border border-slate-200 text-xs px-2.5 py-1 rounded"
                  >
                    {s} · Familiar
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Verified Portfolio Entries Section */}
          <div className="card-crisp p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Verified SkillBridge Portfolio
              </h2>
              <span className="text-xs text-slate-500">Auto-generated upon acceptance</span>
            </div>

            <div className="space-y-4">
              {portfolioEntries.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          VERIFIED
                        </span>
                        <span className="text-xs text-slate-500">{item.completedDate}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{item.projectTitle}</h3>
                      <p className="text-xs text-slate-500">
                        {item.smeCompany} · Client: {item.smeName}
                      </p>
                    </div>

                    <a
                      href={item.deliverableUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                    >
                      View Deliverable <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong>Role:</strong> {item.role} ({item.duration})
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.skillsApplied.map((sk) => (
                      <span key={sk} className="tag-predefined text-[11px]">
                        {sk}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Code: {item.verificationCode}</span>
                    <Link
                      href="/certificates/cert-1"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-sans font-semibold"
                    >
                      <Award className="h-3 w-3" /> Digital Certificate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Availability & Stats */}
        <div className="space-y-6">
          {/* Availability Box */}
          <div className="card-crisp p-5 bg-white space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Availability
            </h2>
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
                <span className="font-semibold text-slate-900">May 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Preferred work</span>
                <span className="font-semibold text-slate-900">Remote</span>
              </div>
            </div>
          </div>

          {/* Stats Box */}
          <div className="card-crisp p-5 bg-white space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Stats
            </h2>
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Projects completed</span>
                <span className="font-bold text-slate-900 text-sm">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">On-time delivery</span>
                <span className="font-bold text-emerald-600">100%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Skill verification score</span>
                <span className="font-bold text-blue-600">4.8 / 5.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
