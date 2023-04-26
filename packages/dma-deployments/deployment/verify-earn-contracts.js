"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = __importDefault(require("hardhat"));
const deploy_1 = require("./deploy");
async function main() {
    const ds = new deploy_1.DeploymentSystem(hardhat_1.default);
    await ds.init();
    await ds.loadConfig();
    await ds.deployAll();
    const { system } = ds.getSystem();
    const contracts = Object.keys(system)
        .filter(key => key == 'DSGuardFactory')
        .map((key) => {
        const entry = system[key];
        return {
            address: entry.config.address,
            constructorArgs: entry.config.constructorArgs.map((param) => {
                if (typeof param === 'string' && param.indexOf('address:') >= 0) {
                    const contractName = param.replace('address:', '');
                    return system[contractName].contract.address;
                }
                return param;
            }),
        };
    });
    for (const contract of contracts) {
        await ds.verifyContract(contract.address, contract.constructorArgs);
    }
}
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
