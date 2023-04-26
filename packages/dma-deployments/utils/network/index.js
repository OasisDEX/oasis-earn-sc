"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainIdByNetwork = exports.NetworkByChainId = exports.ForkedNetworkByChainId = exports.getForkedNetwork = exports.getNetwork = exports.isSupportedNetwork = void 0;
const network_1 = require("@dma-deployments/types/network");
function isSupportedNetwork(network) {
    return Object.values(network_1.Network).includes(network);
}
exports.isSupportedNetwork = isSupportedNetwork;
const getNetwork = async (provider) => {
    const chainId = (await provider.getNetwork()).chainId;
    return exports.NetworkByChainId[chainId];
};
exports.getNetwork = getNetwork;
const getForkedNetwork = async (provider) => {
    const network = await (0, exports.getNetwork)(provider);
    if (network === network_1.Network.LOCAL) {
        const localProvider = provider;
        if (!localProvider.send)
            throw new Error('Provider does not support send method');
        const metadata = await localProvider.send('hardhat_metadata', []);
        return exports.ForkedNetworkByChainId[metadata.forkedNetwork.chainId];
    }
    if (!isForkedNetwork(network))
        throw new Error(`Unsupported forked network ${network}`);
    return network;
};
exports.getForkedNetwork = getForkedNetwork;
function isForkedNetwork(network) {
    return network !== network_1.Network.LOCAL && network !== network_1.Network.HARDHAT;
}
exports.ForkedNetworkByChainId = {
    1: network_1.Network.MAINNET,
    5: network_1.Network.GOERLI,
    10: network_1.Network.OPTIMISM,
};
exports.NetworkByChainId = {
    ...exports.ForkedNetworkByChainId,
    2137: network_1.Network.LOCAL,
};
exports.ChainIdByNetwork = {
    [network_1.Network.MAINNET]: 1,
    [network_1.Network.GOERLI]: 5,
    [network_1.Network.OPTIMISM]: 10,
    [network_1.Network.LOCAL]: 2137,
    [network_1.Network.HARDHAT]: 2137,
};
