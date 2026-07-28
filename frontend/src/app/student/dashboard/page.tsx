'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchMyApplicationsApi } from '@/lib/api/applications';
import { fetchProjectsApi } from '@/lib/api/projects';
import { fetchStudentPortfolioApi } from '@/lib/api/portfolio';
import {
  Briefcase,
  Search,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Award,
  ArrowRight,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [portfolioEntries, setPortfolioEntries] = useState<any[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      if (authLoading || !token || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Set profile from auth context
        setProfile(user?.profile || user);

        // Fetch student applications
        const apps = await fetchMyApplicationsApi(token);
        setApplications(apps || []);

        // Fetch portfolio entries
        if (user?.profile?.id) {
          const portfolioData = await fetchStudentPortfolioApi(user.profile.id);
          setPortfolioEntries(portfolioData?.portfolio || []);
        }

        // Fetch latest 3 projects for recommendations
        const projectsRes = await fetchProjectsApi({
          status: 'OPEN',
          limit: 3,
          token,
        });
        setRecommendedProjects(projectsRes?.projects || []);
      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [token, user, authLoading]);

  // Count accepted applications (shortlisted)
  const acceptedAppsCount = applications.filter((app) => app.status === 'ACCEPTED').length;
  const activeProjectsCount = acceptedAppsCount; // Assuming 1 accepted = 1 active project

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="card-crisp p-6 bg-white text-center space-y-4 max-w-2xl mx-auto my-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Cannot Load Dashboard</h2>
        <p className="text-sm text-slate-500">{error || 'Student profile not found. Please try again later.'}</p>
        <Link href="/student/browse" className="btn-primary inline-block text-sm px-4 py-2">
          Browse Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-50 text-brand-primary text-[11px] font-bold px-2 py-0.5 rounded">
              STUDENT DASHBOARD
            </span>
            <span className="text-xs text-slate-500">
              {profile.university} · {profile.major} ({profile.year}th Year)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {profile.fullName}!
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            You have <strong className="text-slate-800">{activeProjectsCount} project{activeProjectsCount !== 1 ? 's' : ''} in progress</strong> and{' '}
            <strong className="text-slate-800">{portfolioEntries.length} verified portfolio item{portfolioEntries.length !== 1 ? 's' : ''}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/student/browse"
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Search className="h-4 w-4" />
            Browse Projects
          </Link>
          <Link
            href={`/student/profile/${profile.id}`}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Award className="h-4 w-4 text-emerald-500" />
            View Verified Portfolio
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Active Projects
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{activeProjectsCount}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand-primary" /> Accepted project{activeProjectsCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Submitted Applications
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{applications.length}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {acceptedAppsCount} shortlisted
          </p>
        </div>

        <div className="card-crisp p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Verified Portfolio Entries
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{portfolioEntries.length}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified by SkillBridge
          </p>
        </div>
      </div>

      {/* Recommended Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand-primary" /> Latest Projects Available
          </h2>
          <Link
            href="/student/browse"
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1"
          >
            View all projects <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recommendedProjects.length === 0 ? (
          <div className="card-crisp p-6 text-center text-slate-500">
            <p className="text-sm">No projects available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedProjects.map((proj) => {
              const categoryName = proj.categoryTag?.name || proj.category || 'General';
              const skills = Array.isArray(proj.requiredSkillTags) ? proj.requiredSkillTags : [];
              const budget = proj.budget || 0;
              const duration = proj.durationWeeks || 0;

              return (
                <div key={proj.id} className="card-crisp p-5 card-crisp-hover flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">{categoryName}</span>
                      <span className="status-pill status-open">Open</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{proj.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {proj.sme?.companyName || 'Doanh nghiệp'}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{proj.description}</p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {skills.slice(0, 3).map((skill: string, idx: number) => (
                        <span key={idx} className="tag-predefined">
                          {skill}
                        </span>
                      ))}
                      {skills.length > 3 && (
                        <span className="tag-predefined">+{skills.length - 3}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {budget.toLocaleString()} VND
                      </p>
                      <p className="text-[11px] text-slate-500">{duration} weeks</p>
                    </div>
                    <Link
                      href={`/student/projects/${proj.id}`}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
