const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchStudentPortfolioApi(studentId: string): Promise<{ profile: any; portfolio: any[] }> {
  const res = await fetch(`${API_BASE_URL}/api/portfolio/student/${studentId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch student portfolio');
  }

  return data.data;
}
