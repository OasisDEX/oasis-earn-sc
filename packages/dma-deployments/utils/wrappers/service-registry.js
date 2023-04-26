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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRegistry = void 0;
const ethers_1 = require("ethers");
class ServiceRegistry {
    constructor(address, signer) {
        this.address = address;
        this.signer = signer;
    }
    async getContractInstance() {
        const ethers = (await Promise.resolve().then(() => __importStar(require('hardhat')))).ethers;
        return await ethers.getContractAt('ServiceRegistry', this.address, this.signer);
    }
    async addEntry(label, address, debug = false) {
        const ethers = (await Promise.resolve().then(() => __importStar(require('hardhat')))).ethers;
        const entryHash = ethers_1.utils.keccak256(ethers_1.utils.toUtf8Bytes(label));
        const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer);
        await registry.addNamedService(entryHash, address);
        if (debug) {
            console.log(`DEBUG: Service '${label}' has been added with hash: ${entryHash}`);
        }
        return entryHash;
    }
    async addEntryCalldata(label, address, debug = false) {
        const ethers = (await Promise.resolve().then(() => __importStar(require('hardhat')))).ethers;
        const entryHash = ethers_1.utils.keccak256(ethers_1.utils.toUtf8Bytes(label));
        const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer);
        const encodedData = registry.interface.encodeFunctionData('addNamedService', [
            entryHash,
            address,
        ]);
        if (debug) {
            console.log(`DEBUG: Calldata for service '${label}' has been prepared for addition with hash: ${entryHash}`);
        }
        return encodedData;
    }
    async removeEntry(label) {
        const ethers = (await Promise.resolve().then(() => __importStar(require('hardhat')))).ethers;
        const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer);
        await registry.removeNamedService(await this.getEntryHash(label));
    }
    async getEntryHash(label) {
        const ethers = (await Promise.resolve().then(() => __importStar(require('hardhat')))).ethers;
        const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer);
        return registry.getServiceNameHash(label);
    }
    async getServiceAddress(label) {
        const ethers = (await Promise.resolve().then(() => __importStar(require('hardhat')))).ethers;
        const registry = await ethers.getContractAt('ServiceRegistry', this.address, this.signer);
        return registry.getRegisteredService(label);
    }
}
exports.ServiceRegistry = ServiceRegistry;
