'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  UserRole,
  Project,
  Application,
  StudentProfile,
  PortfolioEntry,
  MilestoneStatus,
  ApplicationStatus,
} from '../types';
import {
  MOCK_PROJECTS,
  MOCK_APPLICATIONS,
  MOCK_STUDENT_PROFILE,
  MOCK_PORTFOLIO_ENTRIES,
} from '../lib/mockData';

import { useAuth } from './AuthContext';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  projects: Project[];
  applications: Application[];
  studentProfile: StudentProfile;
  portfolioEntries: PortfolioEntry[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'status' | 'escrowStatus' | 'applicantCount'>) => void;
  applyToProject: (projectId: string, coverMessage: string) => void;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;
  confirmMatching: (projectId: string, selectedStudentIds: string[]) => void;
  submitMilestoneDeliverable: (projectId: string, milestoneId: string, deliverableUrl: string) => void;
  reviewMilestone: (projectId: string, milestoneId: string, action: 'APPROVE' | 'REVISION', feedback?: string) => void;
  acceptProjectAndReleaseEscrow: (projectId: string) => void;
  getProjectById: (id: string) => Project | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role: authRole, setRole: setAuthRole } = useAuth();
  const [localRole, setLocalRole] = useState<UserRole>('STUDENT');

  const role = authRole || localRole;
  const setRole = (r: UserRole) => {
    setLocalRole(r);
    setAuthRole(r);
  };

  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [studentProfile] = useState<StudentProfile>(MOCK_STUDENT_PROFILE);
  const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntry[]>(MOCK_PORTFOLIO_ENTRIES);

  const getProjectById = (id: string) => {
    return projects.find((p) => p.id === id);
  };

  const addProject = (
    newProjData: Omit<Project, 'id' | 'createdAt' | 'status' | 'escrowStatus' | 'applicantCount'>
  ) => {
    const newId = `proj-${Date.now()}`;
    const newProject: Project = {
      ...newProjData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'OPEN', // In MVP admin auto-approves or starts OPEN for demo
      escrowStatus: 'PENDING',
      applicantCount: 0,
      milestones: newProjData.milestones.map((m, idx) => ({
        ...m,
        id: `ms-${newId}-${idx + 1}`,
        projectId: newId,
        orderIndex: idx + 1,
        status: 'PENDING',
      })),
    };
    setProjects((prev) => [newProject, ...prev]);
  };

  const applyToProject = (projectId: string, coverMessage: string) => {
    const project = getProjectById(projectId);
    if (!project) return;

    // calculate match score
    const matchingSkills = project.requiredSkills.filter((s) =>
      [
        ...studentProfile.skills.expert,
        ...studentProfile.skills.proficient,
        ...studentProfile.skills.familiar,
      ].includes(s)
    );
    const score = Math.round(
      (matchingSkills.length / Math.max(project.requiredSkills.length, 1)) * 100
    );

    const newApp: Application = {
      id: `app-${Date.now()}`,
      projectId,
      projectTitle: project.title,
      studentId: studentProfile.id,
      studentName: studentProfile.fullName,
      studentUniversity: studentProfile.university,
      studentMajor: studentProfile.major,
      studentYear: studentProfile.year,
      studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      skills: matchingSkills,
      matchScore: score,
      matchingSkillsCount: matchingSkills.length,
      totalRequiredSkills: project.requiredSkills.length,
      status: 'APPLIED',
      coverMessage,
      appliedAt: new Date().toISOString().split('T')[0],
    };

    setApplications((prev) => [newApp, ...prev]);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, applicantCount: p.applicantCount + 1 } : p
      )
    );
  };

  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === applicationId ? { ...app, status } : app))
    );
  };

  const confirmMatching = (projectId: string, selectedStudentIds: string[]) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            status: 'IN_PROGRESS',
            escrowStatus: 'LOCKED',
            acceptedStudentId: selectedStudentIds[0] || 'stu-1',
            acceptedStudentName: 'Alex Chen',
            acceptedStudentUniversity: 'UCL',
          };
        }
        return p;
      })
    );
    // Mark non-selected as REJECTED and selected as ACCEPTED
    setApplications((prev) =>
      prev.map((app) => {
        if (app.projectId === projectId) {
          return {
            ...app,
            status: selectedStudentIds.includes(app.studentId) ? 'ACCEPTED' : 'REJECTED',
          };
        }
        return app;
      })
    );
  };

  const submitMilestoneDeliverable = (
    projectId: string,
    milestoneId: string,
    deliverableUrl: string
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updatedMilestones = p.milestones.map((m) => {
            if (m.id === milestoneId) {
              return {
                ...m,
                status: 'SUBMITTED' as MilestoneStatus,
                deliverableUrl,
                submittedAt: new Date().toISOString().split('T')[0],
              };
            }
            return m;
          });
          return { ...p, milestones: updatedMilestones };
        }
        return p;
      })
    );
  };

  const reviewMilestone = (
    projectId: string,
    milestoneId: string,
    action: 'APPROVE' | 'REVISION',
    feedback?: string
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updatedMilestones = p.milestones.map((m) => {
            if (m.id === milestoneId) {
              return {
                ...m,
                status: (action === 'APPROVE' ? 'ACCEPTED' : 'REVISION_REQUIRED') as MilestoneStatus,
                revisionFeedback: action === 'REVISION' ? feedback : undefined,
              };
            }
            return m;
          });

          // Check if all milestones accepted
          const allAccepted = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.status === 'ACCEPTED');
          const newProjectStatus = allAccepted ? 'PENDING_ACCEPTANCE' : p.status;

          return { ...p, milestones: updatedMilestones, status: newProjectStatus };
        }
        return p;
      })
    );
  };

  const acceptProjectAndReleaseEscrow = (projectId: string) => {
    const project = getProjectById(projectId);
    if (!project) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            status: 'COMPLETED',
            escrowStatus: 'RELEASED',
          };
        }
        return p;
      })
    );

    // Auto-create portfolio entry
    const newPort: PortfolioEntry = {
      id: `port-${Date.now()}`,
      studentId: project.acceptedStudentId || 'stu-1',
      projectTitle: project.title,
      smeCompany: project.smeCompany,
      smeName: project.smeName,
      role: 'Student Specialist',
      duration: `${project.durationWeeks} weeks`,
      skillsApplied: project.requiredSkills,
      deliverableUrl: project.milestones[project.milestones.length - 1]?.deliverableUrl || 'https://skillbridge.vn/deliverable',
      completedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      verificationCode: `SKILLBRIDGE-VERIFIED-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setPortfolioEntries((prev) => [newPort, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        projects,
        applications,
        studentProfile,
        portfolioEntries,
        addProject,
        applyToProject,
        updateApplicationStatus,
        confirmMatching,
        submitMilestoneDeliverable,
        reviewMilestone,
        acceptProjectAndReleaseEscrow,
        getProjectById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
