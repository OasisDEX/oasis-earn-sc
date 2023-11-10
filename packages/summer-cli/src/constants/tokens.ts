import { ADDRESSES, Address, Network } from "@deploy-configurations/"
import { SupportedNetowkrs } from "./network"


export const tokens = [
    "WETH",
    "DAI",
    "USDC",
    "WBTC",
    "STETH",
    "WSTETH",
    "PEPE",
] as const

export type SupportedTokens = typeof tokens[number]

export const tokenPrecision: Record<SupportedTokens, number> = {
    "WETH": 18,
    "DAI": 18,
    "USDC": 6,
    "WBTC": 8,
    "STETH": 18,
    "WSTETH": 18,
    "PEPE": 18,
}

export const tokenHolders: Record<SupportedTokens, Record<SupportedNetowkrs, Address | null>> = {
    "WETH": {
        // in case of WETH we will just wrap ETH 
        [Network.MAINNET]: ADDRESSES.mainnet.common.WETH,
        [Network.GOERLI]: ADDRESSES.goerli.common.WETH,
        [Network.BASE]: ADDRESSES.base.common.WETH,
        [Network.ARBITRUM]: ADDRESSES.arbitrum.common.WETH,
        [Network.OPTIMISM]: ADDRESSES.optimism.common.WETH,
    },
    "DAI": {
        [Network.MAINNET]: "0x60FaAe176336dAb62e284Fe19B885B095d29fB7F",
        [Network.GOERLI]: ADDRESSES.goerli.common.DAI,
        [Network.BASE]: ADDRESSES.base.common.DAI,
        [Network.ARBITRUM]: ADDRESSES.arbitrum.common.DAI,
        [Network.OPTIMISM]: ADDRESSES.optimism.common.DAI,
    },
    "USDC": {
        [Network.MAINNET]: "0xDa9CE944a37d218c3302F6B82a094844C6ECEb17",
        [Network.GOERLI]: ADDRESSES.goerli.common.USDC,
        [Network.BASE]: ADDRESSES.base.common.USDC,
        [Network.ARBITRUM]: ADDRESSES.arbitrum.common.USDC,
        [Network.OPTIMISM]: ADDRESSES.optimism.common.USDC,
    },
    "WBTC": {
        [Network.MAINNET]: "0x7f62f9592b823331E012D3c5DdF2A7714CfB9de2",
        [Network.GOERLI]: ADDRESSES.goerli.common.WBTC,
        [Network.BASE]: ADDRESSES.base.common.WBTC,
        [Network.ARBITRUM]: ADDRESSES.arbitrum.common.WBTC,
        [Network.OPTIMISM]: ADDRESSES.optimism.common.WBTC,
    },
    "STETH": {
        [Network.MAINNET]: "0xa980d4c0C2E48d305b582AA439a3575e3de06f0E",
        [Network.GOERLI]: null,
        [Network.BASE]: null,
        [Network.ARBITRUM]: null,
        [Network.OPTIMISM]: null,
    },
    "WSTETH": {
        [Network.MAINNET]: "0x248cCBf4864221fC0E840F29BB042ad5bFC89B5c",
        [Network.GOERLI]: null,
        [Network.BASE]: null,
        [Network.ARBITRUM]: null,
        [Network.OPTIMISM]: null,
    },
    "PEPE": {
        [Network.MAINNET]: "0xf3B0073E3a7F747C7A38B36B805247B222C302A3",
        [Network.GOERLI]: ADDRESSES.goerli.common.UNI,
        [Network.BASE]: ADDRESSES.base.common.UNI,
        [Network.ARBITRUM]: ADDRESSES.arbitrum.common.UNI,
        [Network.OPTIMISM]: ADDRESSES.optimism.common.UNI,
    },
}