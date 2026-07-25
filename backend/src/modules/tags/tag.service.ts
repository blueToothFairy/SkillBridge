import { PrismaClient, TagType } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTags(type?: TagType, query?: string) {
  const where: any = { isActive: true };

  if (type) {
    where.type = type;
  }

  if (query) {
    where.name = {
      contains: query,
      mode: 'insensitive',
    };
  }

  return await prisma.tag.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function createTag(name: string, type: TagType) {
  return await prisma.tag.create({
    data: {
      name: name.trim(),
      type,
    },
  });
}
