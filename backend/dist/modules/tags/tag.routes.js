"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tag_controller_1 = require("./tag.controller");
const router = (0, express_1.Router)();
router.get('/', tag_controller_1.getTags);
router.post('/', tag_controller_1.createTag);
exports.default = router;
