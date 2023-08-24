import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { expect } from '@dma-common/test-utils'
import { getAddressesFor, getServiceNameHash } from '@dma-common/utils/common'
import { createDeploy } from '@dma-common/utils/deploy'
import { executeThroughProxy } from '@dma-common/utils/execute'
import init from '@dma-common/utils/init'
import { getDsProxyRegistry, getOrCreateProxy } from '@dma-common/utils/proxy'
import { takeAFlashLoan } from '@dma-library/actions/common'
import { FlashloanProvider } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'
import { Contract } from 'ethers'
import hre from 'hardhat'

const ethers = hre.ethers

describe('Rewards Redeemer Factory', () => {

  let rewardsFactory: Contract | undefined = undefined

  let owner, partner1, partner2: any = undefined

  before(async () => {
    const config = await init()

    const deploy = await createDeploy({ config }, hre)
    const addresses = await ethers.getSigners();
    owner = addresses[0]
    partner1 = addresses[1]
    partner2 = addresses[2]

    const [contract, address] = await deploy('RewardsFactory')

    rewardsFactory = contract
  });

  describe('Adding/removing partners', () => {

    it('Should allow to add and remove partner', async () => {
      if (!rewardsFactory) return false

      const tx = await rewardsFactory.addPartner(partner1.address)
      const result = await tx.wait()
      expect.toBeEqual(result.status, 1)

      const tx2 = await rewardsFactory.removePartner(partner1.address)
      const result2 = await tx2.wait()
      expect.toBeEqual(result2.status, 1)
    })

    it('Should allow create new redeemer contract by entitle partner', async () => {
      if (!rewardsFactory) return false

      const tx = await rewardsFactory.addPartner(partner2.address)
      await tx.wait()

      const tx2 = await rewardsFactory.connect(partner2).createRewardsRedeemer()
      const result2 = await tx2.wait()

      expect.toBeEqual(result2.status, 1)
    })

    it('Shouldnt allow to add/remove partner without admin role', async () => {
      if (!rewardsFactory) return false

      await expect(rewardsFactory.connect(partner2).addPartner(partner1.address)).to.be.revertedWith('RewardsFactory: Caller is not an admin');

      const tx = await rewardsFactory.addPartner(partner1.address)
      await tx.wait()

      await expect(rewardsFactory.connect(partner2).removePartner(partner1.address)).to.be.revertedWith('RewardsFactory: Caller is not an admin');
    })


    it('Should allow to create new redeemer contract by partner role', async () => {
      if (!rewardsFactory) return false

      const tx = await rewardsFactory.addPartner(partner1.address)
      await tx.wait()

      await expect(rewardsFactory.connect(partner1).createRewardsRedeemer()).to.be.not.reverted;
    })

    it('Shouldnt allow to create new redeemer contract without partner role', async () => {
      if (!rewardsFactory) return false

      const tx = await rewardsFactory.removePartner(partner2.address)
      await tx.wait()

      await expect(rewardsFactory.connect(partner2).createRewardsRedeemer()).to.be.revertedWith('RewardsFactory: Caller is not a partner');
    })


  })
})
