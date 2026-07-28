const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchCertificateByCodeApi(code: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/certificates/${code}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch certificate');
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
