import { ethers } from "ethers";

export const DAY = 1000 * 60 * 60 * 24;
export const WEEK = DAY * 7;
export const YEAR = DAY * 365;

export const bn = {
  six: {
    ONE: ethers.utils.parseUnits("1", 6),
    HUNDRED: ethers.utils.parseUnits("100", 6),
    THOUSAND: ethers.utils.parseUnits("1000", 6),
    TEN_THOUSAND: ethers.utils.parseUnits("10000", 6),
    HUNDRED_THOUSAND: ethers.utils.parseUnits("100000", 6),
    MILLION: ethers.utils.parseUnits("1000000", 6),
  },
  eight: {
    ONE: ethers.utils.parseUnits("1", 8),
    TEN: ethers.utils.parseUnits("10", 8),
    THOUSAND: ethers.utils.parseUnits("1000", 8),
    TEN_THOUSAND: ethers.utils.parseUnits("10000", 8),
    HUNDRED_THOUSAND: ethers.utils.parseUnits("100000", 8),
    MILLION: ethers.utils.parseUnits("1000000", 8),
  },
  eighteen: {
    ONE: ethers.utils.parseEther("1"),
    TEN: ethers.utils.parseEther("10"),
    THOUSAND: ethers.utils.parseEther("1000"),
    TEN_THOUSAND: ethers.utils.parseEther("10000"),
    HUNDRED_THOUSAND: ethers.utils.parseEther("100000"),
    MILLION: ethers.utils.parseEther("1000000"),
    TEST_PRICE_1: ethers.utils.parseUnits("93863.654", 18),
    TEST_PRICE_2: ethers.utils.parseUnits("99863.654", 18),
    TEST_PRICE_3: ethers.utils.parseUnits("16821.273", 18),
    TEST_PRICE_4: ethers.utils.parseUnits("46776653369145271678115", 0),
  },
};
