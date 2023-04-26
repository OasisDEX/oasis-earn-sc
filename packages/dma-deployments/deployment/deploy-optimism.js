"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const deploy_1 = require("./deploy");
async function main() {
    const signer = hardhat_1.default.ethers.provider.getSigner(0);
    const network = hardhat_1.default.network.name || '';
    console.log(`Deployer address: ${await signer.getAddress()}`);
    console.log(`Network: ${network}`);
    const ds = new deploy_1.DeploymentSystem(hardhat_1.default);
    await ds.init();
    await ds.loadConfig();
    await ds.deployAll();
    await ds.saveConfig();
    await ds.addAllEntries();
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
