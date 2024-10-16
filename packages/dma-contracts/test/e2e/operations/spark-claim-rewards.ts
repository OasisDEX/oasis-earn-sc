import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { addressesByNetwork, asPercentageValue } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { restoreSnapshot, Snapshot, TestDeploymentSystem, TestHelpers } from '@dma-contracts/utils'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { getAaveLikeSystemContracts, getContract } from '@dma-library/protocols/aave-like/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { AaveRewardsProxyActions, AccountGuard, ERC20, ERC20__factory, WETH, WETH__factory } from '@abis/types/ethers-contracts'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'
import { executeThroughDPMProxy } from '@dma-common/utils/execute'
import { impersonateAccount } from '@nomicfoundation/hardhat-network-helpers'

describe.only('AAVE V3 | Claim Rewards | E2E', async () => {
    let snapshot: Snapshot
    let provider: ethers.providers.JsonRpcProvider
    let address: string
    let signer: SignerWithAddress
    let user: SignerWithAddress
    let WETH: WETH
    let USDC: ERC20
    let config: RuntimeConfig
    let system: DeployedSystem
    let network: Network
    let addresses: ReturnType<typeof addressesByNetwork>
    let aaveLikeAddresses: AaveLikeStrategyAddresses

    let rewardsControllerAddress: string
    let rewardsControllerProxyActionsAddress: string
    let rewardsControllerProxyActionsContract: AaveRewardsProxyActions
    beforeEach(async () => {
        ; ({ snapshot } = await restoreSnapshot({
            hre,
            blockNumber: 20978544,
            useFallbackSwap: true,
        }))

        signer = await SignerWithAddress.create(
            snapshot.config.signer as ethers.providers.JsonRpcSigner,
        )
        user = signer
        provider = signer.provider as ethers.providers.JsonRpcProvider

        address = await signer.getAddress()

        console.log('Address: ', address)

        system = snapshot.testSystem.deployment.system
        config = snapshot.config

        network = await getNetwork(config.provider)

        WETH = WETH__factory.connect(ADDRESSES[network].common.WETH, config.signer)
        USDC = ERC20__factory.connect(ADDRESSES[network].common.USDC, config.signer)

        addresses = addressesByNetwork(Network.MAINNET)

        aaveLikeAddresses = {
            tokens: {
                WETH: WETH.address,
                DAI: ADDRESSES[network].common.DAI,
                USDC: USDC.address,
                ETH: ADDRESSES[network].common.ETH,
            },
            operationExecutor: system.OperationExecutor.contract.address,
            chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
            oracle: ADDRESSES[network].spark.Oracle!,
            lendingPool: ADDRESSES[network].spark.LendingPool!,
            poolDataProvider: ADDRESSES[network].spark.PoolDataProvider!,
        }
        rewardsControllerAddress = ADDRESSES[network].spark.RewardsController!
        // we use mainnet address since we user forked network and an existing dpm proxy
        const accountGuardAddress = ADDRESSES['mainnet'].mpa.core.AccountGuard
        rewardsControllerProxyActionsAddress = system.AaveRewardsProxyActions.contract.address
        rewardsControllerProxyActionsContract = system.AaveRewardsProxyActions.contract as AaveRewardsProxyActions
        const accountGuard = (await hre.ethers.getContractAt('AccountGuard', accountGuardAddress)) as AccountGuard
        const guardOwner = await accountGuard.owner()
        await impersonateAccount(guardOwner)
        const impersonatedSigner = await hre.ethers.getSigner(guardOwner)
        await accountGuard.connect(impersonatedSigner).setWhitelist(rewardsControllerProxyActionsAddress, true)
    })

    it('should claim rewards through proxy actions', async () => {
        const IMPERSONATED_SPARK_OWNER = '0xb2a33ae0e07fd2ca8dbde9545f6ce0b3234dc4e8'
        const PROXY = '0xda8203bbcff1ce6781e483078b72e6c56293d2e1'
        const rewardToken = addresses.WSTETH

        await impersonateAccount(IMPERSONATED_SPARK_OWNER)
        const impersonatedSigner = await hre.ethers.getSigner(IMPERSONATED_SPARK_OWNER)
        // Prepare the calldata for claiming rewards
        const { poolDataProvider } = await getAaveLikeSystemContracts(
            aaveLikeAddresses,
            impersonatedSigner.provider!,
            'Spark',
        );
        const tokens = await poolDataProvider.getReserveTokensAddresses(addresses.WETH)
        const assets = [tokens.spTokenAddress, tokens.variableDebtTokenAddress]


        const rewards = await rewardsControllerProxyActionsContract.getAllUserRewards(rewardsControllerAddress, ADDRESSES[network].spark.PoolDataProvider!, PROXY, addresses.WETH)
        const calldata = rewardsControllerProxyActionsContract.interface.encodeFunctionData("claimAllRewards", [
            rewardsControllerAddress,
            assets,
        ]);
        const rewardTokenBalanceBefore = await ERC20__factory.connect(rewardToken, impersonatedSigner).balanceOf(IMPERSONATED_SPARK_OWNER)
        // Execute the claim rewards operation through the proxy
        const [success, receipt] = await executeThroughDPMProxy(
            PROXY,
            {
                address: rewardsControllerProxyActionsAddress,
                calldata: calldata,
            },
            impersonatedSigner
        )
        const rewardBalanceAfter = await ERC20__factory.connect(rewardToken, impersonatedSigner).balanceOf(IMPERSONATED_SPARK_OWNER)
        expect(+rewardBalanceAfter.toString()).to.be.gt(+rewards[1].toString())
        expect(success).to.be.true
        expect(rewardBalanceAfter).to.be.gt(rewardTokenBalanceBefore)
    })
})

