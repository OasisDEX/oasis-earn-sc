"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActionHash = void 0;
const ethers_1 = require("ethers");
function getActionHash(name) {
    return ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(name));
}
exports.getActionHash = getActionHash;
