const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type EscrowApiStatus = 'PENDING' | 'HELD' | 'RELEASED';

export interface EscrowStatusResponse {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  escrowStatus: EscrowApiStatus;
  totalBudget: number;
  heldAmount: number;
  releasedAmount: number;
  milestones: {
    id: string;
    title: string;
    amountVnd: number;
    status: string;
    isFundReleased: boolean;
  }[];
  canDeposit: boolean;
  canRelease: boolean;
}

async function parseJson(res: Response) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }
  return data.data as EscrowStatusResponse;
}

export async function fetchEscrowStatusApi(
  token: string,
  projectId: string
): Promise<EscrowStatusResponse> {
  const url = new URL(`${API_BASE_URL}/api/escrow/status`);
  url.searchParams.set('projectId', projectId);
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJson(res);
}

export async function depositEscrowApi(
  token: string,
  projectId: string
): Promise<EscrowStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/escrow/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId }),
  });
  return parseJson(res);
}

export async function releaseEscrowApi(
  token: string,
  projectId: string
): Promise<EscrowStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/escrow/release`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId }),
  });
  return parseJson(res);
}
