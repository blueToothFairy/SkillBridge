import { Tag, TagType } from '../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchTagsApi(type?: TagType, query?: string): Promise<Tag[]> {
  const url = new URL(`${API_BASE_URL}/api/tags`);
  if (type) url.searchParams.append('type', type);
  if (query) url.searchParams.append('query', query);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch tags');
  }

  return data.data;
}

export async function createTagApi(token: string, name: string, type: TagType): Promise<Tag> {
  const res = await fetch(`${API_BASE_URL}/api/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, type }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to create tag');
  }

  return data.data;
}
