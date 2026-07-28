const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchCertificateByCodeApi(code: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/certificates/verify/${code}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch certificate');
  }

  return data.data;
}

export async function issueCertificateApi(
  token: string,
  payload: { studentId: string; projectId: string }
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/certificates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to issue certificate');
  }

  return data.data;
}

export async function fetchStudentCertificatesApi(studentId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/api/certificates/student/${studentId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch student certificates');
  }

  return data.data;
}
