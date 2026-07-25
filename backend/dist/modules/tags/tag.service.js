"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTags = getTags;
exports.createTag = createTag;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getTags(type, query) {
    const where = { isActive: true };
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
async function createTag(name, type) {
    return await prisma.tag.create({
        data: {
            name: name.trim(),
            type,
        },
    });
}
