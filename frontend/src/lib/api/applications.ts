import { Application, ApplicationStatus, ApiProject } from '../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiApplication {
  id: string;
  projectId: string;
  studentId: string;
  coverMessage?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  matchScore: number;
  matchingSkills: string[];
  matchingSkillsCount: number;
  totalRequiredSkills: number;
  project?: ApiProject & {
    title: string;
    requiredSkillTags: string[];
    sme?: { id: string; companyName: string };
  };
  student?: {
    id: string;
    fullName: string;
    university: string;
    major: string;
    year: number;
    skills: unknown;
  };
}

async function parseJson(res: Response) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }
  return data.data;
}

export async function applyToProjectApi(
  token: string,
  projectId: string,
  coverMessage: string
): Promise<ApiApplication> {
  const res = await fetch(`${API_BASE_URL}/api/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId, coverMessage }),
  });
  return parseJson(res);
}

export async function fetchMyApplicationsApi(token: string): Promise<ApiApplication[]> {
  const res = await fetch(`${API_BASE_URL}/api/applications/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJson(res);
}

export async function fetchProjectApplicantsApi(
  token: string,
  projectId: string
): Promise<ApiApplication[]> {
  const res = await fetch(`${API_BASE_URL}/api/applications/project/${projectId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJson(res);
}

export async function updateApplicationStatusApi(
  token: string,
  applicationId: string,
  status: 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED'
): Promise<ApiApplication> {
  const res = await fetch(`${API_BASE_URL}/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return parseJson(res);
}

export async function confirmMatchApi(
  token: string,
  projectId: string,
  studentIds: string[]
): Promise<{ project: ApiProject; applications: ApiApplication[] }> {
  const res = await fetch(`${API_BASE_URL}/api/applications/confirm-match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId, studentIds }),
  });
  return parseJson(res);
}

export async function withdrawApplicationApi(token: string, applicationId: string): Promise<ApiApplication> {
  const res = await fetch(`${API_BASE_URL}/api/applications/${applicationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJson(res);
}

/** Map API application → legacy Application type used by some mock pages */
export function toLegacyApplication(app: ApiApplication): Application {
  return {
    id: app.id,
    projectId: app.projectId,
    projectTitle: app.project?.title || 'Project',
    studentId: app.studentId,
    studentName: app.student?.fullName || 'Student',
    studentUniversity: app.student?.university || '',
    studentMajor: app.student?.major || '',
    studentYear: app.student?.year || 1,
    studentAvatar: '',
    skills: (app.matchingSkills || []) as Application['skills'],
    matchScore: app.matchScore,
    matchingSkillsCount: app.matchingSkillsCount,
    totalRequiredSkills: app.totalRequiredSkills,
    status: app.status,
    coverMessage: app.coverMessage || '',
    appliedAt: new Date(app.createdAt).toLocaleDateString('vi-VN'),
  };
}
