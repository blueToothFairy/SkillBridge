import { ApiProject, CreateProjectPayload } from '../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function createProjectApi(token: string, payload: CreateProjectPayload): Promise<ApiProject> {
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to create project');
  }

  return data.data;
}

export async function fetchProjectsApi(params?: {
  categoryTagId?: string;
  query?: string;
  page?: number;
  limit?: number;
  status?: string;
  mine?: boolean;
  token?: string;
}): Promise<{ projects: ApiProject[]; meta: any }> {
  const url = new URL(`${API_BASE_URL}/api/projects`);
  if (params?.categoryTagId) url.searchParams.append('categoryTagId', params.categoryTagId);
  if (params?.query) url.searchParams.append('query', params.query);
  if (params?.page) url.searchParams.append('page', params.page.toString());
  if (params?.limit) url.searchParams.append('limit', params.limit.toString());
  if (params?.status) url.searchParams.append('status', params.status);
  if (params?.mine) url.searchParams.append('mine', 'true');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params?.token) headers.Authorization = `Bearer ${params.token}`;

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch projects');
  }

  return {
    projects: data.data,
    meta: data.meta,
  };
}

export async function fetchProjectByIdApi(id: string): Promise<ApiProject> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch project detail');
  }

  return data.data;
}

export async function updateProjectApi(
  token: string,
  id: string,
  payload: Partial<CreateProjectPayload> & { status?: string }
): Promise<ApiProject> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to update project');
  }

  return data.data;
}

export async function fetchPendingProjectsApi(token: string): Promise<ApiProject[]> {
  const res = await fetch(`${API_BASE_URL}/api/projects/pending`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch pending projects');
  }

  return data.data;
}

export async function reviewProjectApi(
  token: string,
  id: string,
  action: 'APPROVE' | 'REJECT'
): Promise<ApiProject> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to review project');
  }

  return data.data;
}

export async function acceptProjectApi(token: string, id: string): Promise<ApiProject> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to accept project');
  }

  return data.data;
}

export async function requestProjectRevisionApi(
  token: string,
  id: string,
  feedback: string
): Promise<ApiProject> {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}/revision`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ feedback }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to request project revision');
  }

  return data.data;
}
