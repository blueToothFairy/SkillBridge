"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTags = getTags;
exports.createTag = createTag;
const tagService = __importStar(require("./tag.service"));
const response_1 = require("../../utils/response");
async function getTags(req, res) {
    try {
        const { type, query } = req.query;
        let tagType;
        if (type === 'CATEGORY' || type === 'SKILL') {
            tagType = type;
        }
        const tags = await tagService.getTags(tagType, query);
        return (0, response_1.sendSuccess)(res, tags);
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || 'Failed to fetch tags', 500, 'SERVER_ERROR');
    }
}
async function createTag(req, res) {
    try {
        const { name, type } = req.body;
        if (!name || typeof name !== 'string') {
            return (0, response_1.sendError)(res, 'Tag name is required', 400, 'VALIDATION_ERROR');
        }
        if (!type || (type !== 'CATEGORY' && type !== 'SKILL')) {
            return (0, response_1.sendError)(res, 'Valid tag type (CATEGORY or SKILL) is required', 400, 'VALIDATION_ERROR');
        }
        const newTag = await tagService.createTag(name, type);
        return (0, response_1.sendSuccess)(res, newTag, 201);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return (0, response_1.sendError)(res, 'Tag with this name already exists', 400, 'DUPLICATE_TAG');
        }
        return (0, response_1.sendError)(res, error.message || 'Failed to create tag', 500, 'SERVER_ERROR');
    }
}
