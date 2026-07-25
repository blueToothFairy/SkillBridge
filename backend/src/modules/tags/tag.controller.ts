import { Request, Response } from 'express';
import { TagType } from '@prisma/client';
import * as tagService from './tag.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function getTags(req: Request, res: Response) {
  try {
    const { type, query } = req.query;

    let tagType: TagType | undefined;
    if (type === 'CATEGORY' || type === 'SKILL') {
      tagType = type as TagType;
    }

    const tags = await tagService.getTags(tagType, query as string | undefined);
    return sendSuccess(res, tags);
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch tags', 500, 'SERVER_ERROR');
  }
}

export async function createTag(req: Request, res: Response) {
  try {
    const { name, type } = req.body;

    if (!name || typeof name !== 'string') {
      return sendError(res, 'Tag name is required', 400, 'VALIDATION_ERROR');
    }

    if (!type || (type !== 'CATEGORY' && type !== 'SKILL')) {
      return sendError(res, 'Valid tag type (CATEGORY or SKILL) is required', 400, 'VALIDATION_ERROR');
    }

    const newTag = await tagService.createTag(name, type as TagType);
    return sendSuccess(res, newTag, 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return sendError(res, 'Tag with this name already exists', 400, 'DUPLICATE_TAG');
    }
    return sendError(res, error.message || 'Failed to create tag', 500, 'SERVER_ERROR');
  }
}
