"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificate_controller_1 = require("./certificate.controller");
const router = (0, express_1.Router)();
// Public verification endpoint
router.get('/:code', certificate_controller_1.getCertificateByCode);
exports.default = router;
