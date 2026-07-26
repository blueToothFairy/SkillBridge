import { Milestone } from '../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchProjectMilestonesApi(token: string, projectId: string): Promise<Milestone[]> {
  const url = new URL(`${API_BASE_URL}/api/milestones`);
  url.searchParams.append('projectId', projectId);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch project milestones');
  }

  return data.data;
}

export async function submitMilestoneDeliverableApi(
  token: string,
  id: string,
  deliverableUrl: string
): Promise<Milestone> {
  const res = await fetch(`${API_BASE_URL}/api/milestones/${id}/submit`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ deliverableUrl }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to submit milestone deliverable');
  }

  return data.data;
}

export async function reviewMilestoneApi(
  token: string,
  id: string,
  action: 'APPROVE' | 'REVISE',
  feedback?: string
): Promise<Milestone> {
  const res = await fetch(`${API_BASE_URL}/api/milestones/${id}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, feedback }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to review milestone');
  }

  return data.data;
}

export async function cancelMilestoneSubmissionApi(token: string, id: string): Promise<Milestone> {
  const res = await fetch(`${API_BASE_URL}/api/milestones/${id}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to cancel milestone submission');
  }

  return data.data;
}
