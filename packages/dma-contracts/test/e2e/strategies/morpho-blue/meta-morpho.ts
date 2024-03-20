import {
  AccountImplementation,
  AccountImplementation__factory,
  ERC20__factory,
} from '@abis/types/ethers-contracts'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { Address } from '@deploy-configurations/types/address'
import { DeployedSystem } from '@deploy-configurations/types/deployed-system'
import { Network } from '@deploy-configurations/types/network'
import { getNetwork } from '@deploy-configurations/utils/network'
import { addressesByNetwork, createDPMAccount } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { getEvents } from '@dma-common/utils/common'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { restoreSnapshot, Snapshot, TestDeploymentSystem } from '@dma-contracts/utils'
import { strategies, views } from '@dma-library'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { impersonateAccount, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { IERC4626__factory } from '@typechain'
import BigNumber from 'bignumber.js'
import { expect } from 'chai'
import { ethers } from 'ethers'
import hre from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getOneInchCall } from './one-inch-utils/one-inch-swap'

const USER = '0x63C6139e8275391adA0e2a59d1599066243747c2'

const testVaults = [
  {
    vault: {
      address: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB',
      name: 'Steakhouse USDC Metamorpho Vault',
    },
    underlyingAsset: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      precision: 6,
      symbol: 'USDC',
    },
    pullReturnTokens: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        precision: 6,
        symbol: 'USDC',
        depositAmount: 1000,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        precision: 18,
        symbol: 'WETH',
        depositAmount: 1,
      },
    ],
  },
  {
    vault: {
      address: '0xbeef050ecd6a16c4e7bffbb52ebba7846c4b8cd4',
      name: 'Steakhouse WETH Metamorpho Vault',
    },
    underlyingAsset: {
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      precision: 18,
      symbol: 'WETH',
    },
    pullReturnTokens: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        precision: 6,
        symbol: 'USDC',
        depositAmount: 1000,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        precision: 18,
        symbol: 'WETH',
        depositAmount: 1,
      },
    ],
  },
  {
    vault: {
      address: '0x2371e134e3455e0593363cBF89d3b6cf53740618',
      name: 'Not Steakhouse WETH Metamorpho Vault',
    },
    underlyingAsset: {
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      precision: 18,
      symbol: 'WETH',
    },
    pullReturnTokens: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        precision: 6,
        symbol: 'USDC',
        depositAmount: 1000,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        precision: 18,
        symbol: 'WETH',
        depositAmount: 1,
      },
    ],
  },
  {
    vault: {
      address: '0x83f20f44975d03b1b09e64809b757c47f942beea',
      name: 'sDai',
    },
    underlyingAsset: {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      precision: 18,
      symbol: 'DAI',
    },
    pullReturnTokens: [
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        precision: 18,
        symbol: 'DAI',
        depositAmount: 1000,
      },
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        precision: 6,
        symbol: 'USDC',
        depositAmount: 1000,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        precision: 18,
        symbol: 'WETH',
        depositAmount: 1,
      },
      {
        address: '0x6c3ea9036406852006290770bedfcaba0e23a0e8',
        precision: 6,
        symbol: 'PYUSD',
        depositAmount: 1000,
      },
    ],
  },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getLazyVaultSubgraphResponse = (vaultAddress: string, proxy: string) => {
  return Promise.resolve({
    vaults: [
      {
        totalAssets: '0',
        totalShares: '0',
        interestRates: [],
      },
    ],
    positions: [
      {
        id: '0',
        shares: '0',
        earnCumulativeFeesUSD: '0',
        earnCumulativeDepositUSD: '0',
        earnCumulativeWithdrawUSD: '0',
        earnCumulativeFeesInQuoteToken: '0',
        earnCumulativeDepositInQuoteToken: '0',
        earnCumulativeWithdrawInQuoteToken: '0',
      },
    ],
  })
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getVaultApyParameters = (vaultAddress: string) => {
  return Promise.resolve({
    vault: {
      apy: '0',
      curator: 'xx',
      fee: 'xx',
    },
  })
}
const getUnderlyingTokens = (
  hre: HardhatRuntimeEnvironment,
  ds: DeploymentSystem,
): Promise<any> => {
  for (const vault of testVaults) {
    for (const pullToken of vault.pullReturnTokens) {
      ds.setTokenBalance(
        USER,
        pullToken.address,
        new BigNumber('100000000000000000000000000000000'),
      )
    }
  }
  return Promise.resolve({})
}
describe.skip('Deposit | ERC4626 | E2E', async () => {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  let snapshot: Snapshot
  let provider: ethers.providers.JsonRpcProvider
  let signer: SignerWithAddress
  let owner: ethers.Signer
  let address: string

  let dpmAccount: AccountImplementation
  let config: RuntimeConfig
  let system: DeployedSystem
  let testSystem: TestDeploymentSystem
  let network: Network
  let addresses: ReturnType<typeof addressesByNetwork>
  let aaveLikeAddresses: AaveLikeStrategyAddresses

  beforeEach(async () => {
    console.log('Restoring snapshot')
    ;({ snapshot } = await restoreSnapshot(
      {
        hre,
        blockNumber: 19475673,
        useFallbackSwap: false,
        debug: true,
        skipSnapshot: false,
      },
      [getUnderlyingTokens],
    ))

    console.log('snapshot restored')
    signer = await SignerWithAddress.create(
      snapshot.config.signer as ethers.providers.JsonRpcSigner,
    )
    await impersonateAccount(USER)
    owner = hre.ethers.provider.getSigner(USER)
    provider = signer.provider as ethers.providers.JsonRpcProvider

    address = await owner.getAddress()

    console.log('Address: ', address)

    system = snapshot.testSystem.deployment.system
    testSystem = snapshot.testSystem
    config = snapshot.config

    const swapOwnerAddress = '0x85f9b7408afE6CEb5E46223451f5d4b832B522dc'
    await setBalance(swapOwnerAddress, ethers.BigNumber.from('100000000000000000000'))
    await impersonateAccount(swapOwnerAddress)
    const swapOwner = hre.ethers.provider.getSigner(swapOwnerAddress)
    await system.Swap.contract.connect(swapOwner).addFeeTier(2)

    network = await getNetwork(config.provider)

    addresses = addressesByNetwork(Network.MAINNET)

    aaveLikeAddresses = {
      tokens: {
        DAI: ADDRESSES[network].common.DAI,
        ETH: ADDRESSES[network].common.ETH,
        USDC: ADDRESSES[network].common.USDC,
        WETH: ADDRESSES[network].common.WETH,
      },
      operationExecutor: system.OperationExecutor.contract.address,
      chainlinkEthUsdPriceFeed: addresses.chainlinkEthUsdPriceFeed,
      oracle: addresses.aaveOracle,
      lendingPool: addresses.pool,
      poolDataProvider: addresses.poolDataProvider,
    }

    await system.AccountGuard.contract.setWhitelist(system.OperationExecutor.contract.address, true)

    const [dpmProxy] = await createDPMAccount(
      system.AccountFactory.contract,
      await owner.getAddress(),
    )

    if (!dpmProxy) {
      throw new Error('Failed to create DPM proxy')
    }

    dpmAccount = AccountImplementation__factory.connect(dpmProxy, owner)

    await system.OperationsRegistry.contract.addOperation({
      actions: [
        '0x79f0e71ed647d96e08c6053ffaa360fb71487ea6066544a94fa7dc52df7df26e',
        '0x9f9d224c26adad40cade24655f1c5e3cf307c390fc6874e710cb56bdd504bc26',
        '0xb8020e49c93f2144cdce5b93dc159b086f98dcfba95a09eec862664fbfa6a8a4',
        '0x166438e3cb190ad4e896f7b4bd36c98f5b7dc3f5eb885f019521b3b819bc0de8',
        '0x166438e3cb190ad4e896f7b4bd36c98f5b7dc3f5eb885f019521b3b819bc0de8',
      ],
      optional: [false, true, true, false, true],
      name: 'ERC4626Withdraw',
    })
    await system.OperationsRegistry.contract.addOperation({
      actions: [
        '0x98203051894747605630ba7bcee424c0ec4e2f7d74e8e9d5a195b7eeba3cbd10',
        '0xae6d6b87bd69704c742ef3ff051d31d411798b8403cab6cb2d94a7ba91661f7d',
        '0x9f9d224c26adad40cade24655f1c5e3cf307c390fc6874e710cb56bdd504bc26',
        '0x36303c18db5a95d0dd17b9bac9bc1dbd0130264cd8a04fb5e9b427a3a03ad49e',
        '0xe2675cf8dabe9838c0788d7f687169e95d73004dfe8f1653e42314fe5688721e',
        '0x29732f3b4202acea9e682f5fafacfe4172f3140412e66931b5d00a4dda200962',
      ],
      optional: [true, true, true, false, false, true],
      name: 'ERC4626Deposit',
    })
  })

  for (const vault of testVaults) {
    for (const pullToken of vault.pullReturnTokens) {
      it(`deposit ${pullToken.depositAmount} of ${pullToken.symbol} to ${vault.vault.name} where ${vault.underlyingAsset.symbol} is the underlying asset`, async () => {
        await setBalance(address, ethers.BigNumber.from('100000000000000000000'))
        const pullTokenContract = ERC20__factory.connect(pullToken.address, owner)
        const depositTokenContract =
          pullToken.address.toLowerCase() === vault.underlyingAsset.address.toLowerCase()
            ? pullTokenContract
            : ERC20__factory.connect(vault.underlyingAsset.address, owner)
        const getBalance =
          pullToken.symbol == 'WETH' ? hre.ethers.provider.getBalance : pullTokenContract.balanceOf
        const pullTokenBalanceBeforeDeposit = await getBalance(address)

        const depositAmount = new BigNumber(pullToken.depositAmount)

        console.log(
          'Deposit amount                     : ',
          depositAmount.toString(),
          pullToken.symbol,
        )
        await pullTokenContract
          .connect(owner)
          .approve(dpmAccount.address, '10000000000000000000000000')

        await depositTokenContract
          .connect(owner)
          .approve(dpmAccount.address, '1000000000000000000000000')

        const result = await strategies.common.erc4626.deposit(
          {
            vault: vault.vault.address,
            depositTokenAddress: depositTokenContract.address,
            depositTokenPrecision: vault.underlyingAsset.precision,
            depositTokenSymbol: vault.underlyingAsset.symbol,
            pullTokenAddress: pullTokenContract.address,
            pullTokenPrecision: pullToken.precision,
            pullTokenSymbol: pullToken.symbol,
            amount: depositAmount,
            proxyAddress: dpmAccount.address,
            slippage: new BigNumber(0.025),
            user: address,
            quoteTokenPrice: new BigNumber(1),
          },
          {
            provider: provider,
            network: network,
            operationExecutor: aaveLikeAddresses.operationExecutor,
            getSwapData: getOneInchCall(system.Swap.contract.address, 1),
            getLazyVaultSubgraphResponse,
            getVaultApyParameters,
          },
        )
        const tx = await dpmAccount
          .connect(owner)
          .execute(system.OperationExecutor.contract.address, result.tx.data, {
            gasLimit: 5000000,
            value: result.tx.value,
          })
        const receipt = await tx.wait()
        const events = getEvents(
          receipt,
          testSystem.deployment.system.PositionCreated.contract.interface.getEvent(
            'CreatePosition',
          ),
        )
        expect(events.length).to.eq(1)
        expect(events[0].args?.protocol).to.eq(`erc4626-${vault.vault.address.toLowerCase()}`)

        const pullTokenBalanceAfterDeposit = await getBalance(address)

        const { shares: sharesAfterDeposit, balance: balanceAfterDeposit } =
          await getProxyShareAndDeposit(owner, dpmAccount, vault.vault.address)

        const currentPosition = await views.common.getErc4626Position(
          {
            vaultAddress: vault.vault.address,
            proxyAddress: dpmAccount.address,
            user: address,
            quotePrice: new BigNumber(1),
            underlyingAsset: {
              address: vault.underlyingAsset.address,
              precision: vault.underlyingAsset.precision,
              symbol: vault.underlyingAsset.symbol,
            },
          },
          {
            provider: hre.ethers.provider,
            getLazyVaultSubgraphResponse,
            getVaultApyParameters,
          },
        )

        const closeCalldata = await strategies.common.erc4626.withdraw(
          {
            vault: vault.vault.address,
            withdrawTokenAddress: vault.underlyingAsset.address,
            withdrawTokenPrecision: vault.underlyingAsset.precision,
            withdrawTokenSymbol: vault.underlyingAsset.symbol,
            returnTokenAddress: pullToken.address,
            returnTokenPrecision: pullToken.precision,
            returnTokenSymbol: pullToken.symbol,
            amount: currentPosition.quoteTokenAmount.times(0.5),
            proxyAddress: dpmAccount.address,
            slippage: new BigNumber(0.025),
            user: address,
            quoteTokenPrice: new BigNumber(1),
          },
          {
            provider: provider,
            network: network,
            operationExecutor: aaveLikeAddresses.operationExecutor,
            getSwapData: getOneInchCall(system.Swap.contract.address, 1),
            getLazyVaultSubgraphResponse,
            getVaultApyParameters,
          },
        )

        const tx2 = await dpmAccount.execute(
          system.OperationExecutor.contract.address,
          closeCalldata.tx.data,
          {
            gasLimit: 5000000,
          },
        )
        await tx2.wait()
        const pullTokenBalanceAfterWithdrawal = await getBalance(address)
        const { shares: sharesAfterWithdraw, balance: balanceAfterWithdraw } =
          await getProxyShareAndDeposit(owner, dpmAccount, vault.vault.address)
        console.log('Position shares after deposit      : ', sharesAfterDeposit.toString())
        console.log(
          'Position balance after deposit     : ',
          ethers.utils.formatUnits(balanceAfterDeposit, vault.underlyingAsset.precision).toString(),
        )

        console.log('Position shares after withdraw     : ', sharesAfterWithdraw.toString())
        console.log(
          'Position  balance after withdraw   : ',
          ethers.utils
            .formatUnits(balanceAfterWithdraw, vault.underlyingAsset.precision)
            .toString(),
        )

        console.log(
          `User ${pullToken.symbol} balance before deposit   : `,
          ethers.utils.formatUnits(pullTokenBalanceBeforeDeposit, pullToken.precision).toString(),
        )
        console.log(
          `User ${pullToken.symbol} after  deposit    : `,
          ethers.utils.formatUnits(pullTokenBalanceAfterDeposit, pullToken.precision).toString(),
        )
        console.log(
          `User ${pullToken.symbol} after  withdrawal    : `,
          ethers.utils.formatUnits(pullTokenBalanceAfterWithdrawal, pullToken.precision).toString(),
        )
        console.log(
          `User ${pullToken.symbol} balance diff             : `,
          ethers.utils
            .formatUnits(
              pullTokenBalanceBeforeDeposit.sub(pullTokenBalanceAfterWithdrawal),
              pullToken.precision,
            )
            .toString(),
        )
        expect(await depositTokenContract.balanceOf(dpmAccount.address)).to.eq(0)
        expect(await pullTokenContract.balanceOf(dpmAccount.address)).to.eq(0)
        expect(await hre.ethers.provider.getBalance(dpmAccount.address)).to.eq(0)
      })
    }
  }
})
async function getProxyShareAndDeposit(
  owner: ethers.Signer,
  dpmAccount: AccountImplementation,
  vaultAddress: Address,
) {
  const vault = IERC4626__factory.connect(vaultAddress, owner)
  const shares = await vault.balanceOf(dpmAccount.address)
  const balance = await vault.convertToAssets(shares)

  return { shares, balance }
}
