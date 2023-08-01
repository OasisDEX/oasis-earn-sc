import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { AggregatedPriceOracle } from "../typechain-types";

describe("AggregatedPriceOracle", function () {
    describe("Setter Cases", function () {
        let aggregatedPriceOracle: AggregatedPriceOracle;

        // Initialize the contract
        beforeEach(async function () {
            const AggregatedPriceOracle = await ethers.getContractFactory("AggregatedPriceOracle");
            aggregatedPriceOracle = (await AggregatedPriceOracle.deploy(
                "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                BigNumber.from(100),
            )) as AggregatedPriceOracle;

            await aggregatedPriceOracle.deployed();
        });
        it("Valid deployment", async function () {
            expect(await aggregatedPriceOracle.token()).to.be.equal("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
            expect(await aggregatedPriceOracle.dailyPrice(0)).to.be.equal(100);
            expect(await aggregatedPriceOracle.nextDailyPriceIndex()).to.be.equal(1);
            expect(await aggregatedPriceOracle.nextWeeklyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.nextMonthlyPriceIndex()).to.be.equal(0);
        });
        it("Set Daily Price", async function () {
            await aggregatedPriceOracle.setDailyPrice(200);

            expect(await aggregatedPriceOracle.dailyPrice(0)).to.be.equal(100);
            expect(await aggregatedPriceOracle.dailyPrice(1)).to.be.equal(200);
        });
        it("Set Daily Price for Week", async function () {
            await aggregatedPriceOracle.setDailyPrice(200);
            await aggregatedPriceOracle.setDailyPrice(300);
            await aggregatedPriceOracle.setDailyPrice(400);
            await aggregatedPriceOracle.setDailyPrice(500);
            await aggregatedPriceOracle.setDailyPrice(600);
            await aggregatedPriceOracle.setDailyPrice(700);

            expect(await aggregatedPriceOracle.dailyPrice(0)).to.be.equal(100);
            expect(await aggregatedPriceOracle.dailyPrice(1)).to.be.equal(200);
            expect(await aggregatedPriceOracle.dailyPrice(2)).to.be.equal(300);
            expect(await aggregatedPriceOracle.dailyPrice(3)).to.be.equal(400);
            expect(await aggregatedPriceOracle.dailyPrice(4)).to.be.equal(500);
            expect(await aggregatedPriceOracle.dailyPrice(5)).to.be.equal(600);
            expect(await aggregatedPriceOracle.dailyPrice(6)).to.be.equal(700);
        });
        it("Set Daily Price for 1 Week + 1 Day", async function () {
            await aggregatedPriceOracle.setDailyPrice(200);
            await aggregatedPriceOracle.setDailyPrice(300);
            await aggregatedPriceOracle.setDailyPrice(400);
            await aggregatedPriceOracle.setDailyPrice(500);
            await aggregatedPriceOracle.setDailyPrice(600);
            await aggregatedPriceOracle.setDailyPrice(700);

            await aggregatedPriceOracle.setDailyPrice(800);

            expect(await aggregatedPriceOracle.nextDailyPriceIndex()).to.be.equal(1);
            expect(await aggregatedPriceOracle.nextWeeklyPriceIndex()).to.be.equal(1);

            expect(await aggregatedPriceOracle.dailyPrice(0)).to.be.equal(800);
            expect(await aggregatedPriceOracle.weeklyPriceAggregated(0)).to.be.equal(2800);
        });
        it("Set Daily Price for 1 Week + 6 Days", async function () {
            await aggregatedPriceOracle.setDailyPrice(200);
            await aggregatedPriceOracle.setDailyPrice(300);
            await aggregatedPriceOracle.setDailyPrice(400);
            await aggregatedPriceOracle.setDailyPrice(500);
            await aggregatedPriceOracle.setDailyPrice(600);
            await aggregatedPriceOracle.setDailyPrice(700);

            await aggregatedPriceOracle.setDailyPrice(800);
            await aggregatedPriceOracle.setDailyPrice(900);
            await aggregatedPriceOracle.setDailyPrice(1000);
            await aggregatedPriceOracle.setDailyPrice(1100);
            await aggregatedPriceOracle.setDailyPrice(1200);
            await aggregatedPriceOracle.setDailyPrice(1300);

            expect(await aggregatedPriceOracle.nextDailyPriceIndex()).to.be.equal(6);
            expect(await aggregatedPriceOracle.nextWeeklyPriceIndex()).to.be.equal(1);

            expect(await aggregatedPriceOracle.dailyPrice(0)).to.be.equal(800);
            expect(await aggregatedPriceOracle.dailyPrice(1)).to.be.equal(900);
            expect(await aggregatedPriceOracle.dailyPrice(2)).to.be.equal(1000);
            expect(await aggregatedPriceOracle.dailyPrice(3)).to.be.equal(1100);
            expect(await aggregatedPriceOracle.dailyPrice(4)).to.be.equal(1200);
            expect(await aggregatedPriceOracle.dailyPrice(5)).to.be.equal(1300);

            expect(await aggregatedPriceOracle.weeklyPriceAggregated(0)).to.be.equal(2800);
        });
        it("Set Daily Price for 2 Weeks", async function () {
            await aggregatedPriceOracle.setDailyPrice(200);
            await aggregatedPriceOracle.setDailyPrice(300);
            await aggregatedPriceOracle.setDailyPrice(400);
            await aggregatedPriceOracle.setDailyPrice(500);
            await aggregatedPriceOracle.setDailyPrice(600);
            await aggregatedPriceOracle.setDailyPrice(700);

            await aggregatedPriceOracle.setDailyPrice(800);
            await aggregatedPriceOracle.setDailyPrice(900);
            await aggregatedPriceOracle.setDailyPrice(1000);
            await aggregatedPriceOracle.setDailyPrice(1100);
            await aggregatedPriceOracle.setDailyPrice(1200);
            await aggregatedPriceOracle.setDailyPrice(1300);
            await aggregatedPriceOracle.setDailyPrice(1400);

            expect(await aggregatedPriceOracle.nextDailyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.nextWeeklyPriceIndex()).to.be.equal(2);

            expect(await aggregatedPriceOracle.weeklyPriceAggregated(0)).to.be.equal(2800);
            expect(await aggregatedPriceOracle.weeklyPriceAggregated(1)).to.be.equal(7700);
        });
        it("Set Daily Price for 3 Weeks + 6 days", async function () {
            await aggregatedPriceOracle.setDailyPrice(200);
            await aggregatedPriceOracle.setDailyPrice(300);
            await aggregatedPriceOracle.setDailyPrice(400);
            await aggregatedPriceOracle.setDailyPrice(500);
            await aggregatedPriceOracle.setDailyPrice(600);
            await aggregatedPriceOracle.setDailyPrice(700);

            await aggregatedPriceOracle.setDailyPrice(800);
            await aggregatedPriceOracle.setDailyPrice(900);
            await aggregatedPriceOracle.setDailyPrice(1000);
            await aggregatedPriceOracle.setDailyPrice(1100);
            await aggregatedPriceOracle.setDailyPrice(1200);
            await aggregatedPriceOracle.setDailyPrice(1300);
            await aggregatedPriceOracle.setDailyPrice(1400);

            await aggregatedPriceOracle.setDailyPrice(1500);
            await aggregatedPriceOracle.setDailyPrice(1600);
            await aggregatedPriceOracle.setDailyPrice(1700);
            await aggregatedPriceOracle.setDailyPrice(1800);
            await aggregatedPriceOracle.setDailyPrice(1900);
            await aggregatedPriceOracle.setDailyPrice(2000);
            await aggregatedPriceOracle.setDailyPrice(2100);

            await aggregatedPriceOracle.setDailyPrice(2200);
            await aggregatedPriceOracle.setDailyPrice(2300);
            await aggregatedPriceOracle.setDailyPrice(2400);
            await aggregatedPriceOracle.setDailyPrice(2500);
            await aggregatedPriceOracle.setDailyPrice(2600);
            await aggregatedPriceOracle.setDailyPrice(2700);

            expect(await aggregatedPriceOracle.nextDailyPriceIndex()).to.be.equal(6);
            expect(await aggregatedPriceOracle.nextWeeklyPriceIndex()).to.be.equal(3);

            expect(await aggregatedPriceOracle.weeklyPriceAggregated(0)).to.be.equal(2800);
            expect(await aggregatedPriceOracle.weeklyPriceAggregated(1)).to.be.equal(7700);
            expect(await aggregatedPriceOracle.weeklyPriceAggregated(2)).to.be.equal(12600);
        });
        it("Set Daily Price for 4 Weeks", async function () {
            await aggregatedPriceOracle.setDailyPrice(200);
            await aggregatedPriceOracle.setDailyPrice(300);
            await aggregatedPriceOracle.setDailyPrice(400);
            await aggregatedPriceOracle.setDailyPrice(500);
            await aggregatedPriceOracle.setDailyPrice(600);
            await aggregatedPriceOracle.setDailyPrice(700);

            await aggregatedPriceOracle.setDailyPrice(800);
            await aggregatedPriceOracle.setDailyPrice(900);
            await aggregatedPriceOracle.setDailyPrice(1000);
            await aggregatedPriceOracle.setDailyPrice(1100);
            await aggregatedPriceOracle.setDailyPrice(1200);
            await aggregatedPriceOracle.setDailyPrice(1300);
            await aggregatedPriceOracle.setDailyPrice(1400);

            await aggregatedPriceOracle.setDailyPrice(1500);
            await aggregatedPriceOracle.setDailyPrice(1600);
            await aggregatedPriceOracle.setDailyPrice(1700);
            await aggregatedPriceOracle.setDailyPrice(1800);
            await aggregatedPriceOracle.setDailyPrice(1900);
            await aggregatedPriceOracle.setDailyPrice(2000);
            await aggregatedPriceOracle.setDailyPrice(2100);

            await aggregatedPriceOracle.setDailyPrice(2200);
            await aggregatedPriceOracle.setDailyPrice(2300);
            await aggregatedPriceOracle.setDailyPrice(2400);
            await aggregatedPriceOracle.setDailyPrice(2500);
            await aggregatedPriceOracle.setDailyPrice(2600);
            await aggregatedPriceOracle.setDailyPrice(2700);
            await aggregatedPriceOracle.setDailyPrice(2800);

            expect(await aggregatedPriceOracle.nextDailyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.nextWeeklyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.nextMonthlyPriceIndex()).to.be.equal(1);

            expect(await aggregatedPriceOracle.weeklyPriceAggregated(0)).to.be.equal(2800);
            expect(await aggregatedPriceOracle.weeklyPriceAggregated(1)).to.be.equal(7700);
            expect(await aggregatedPriceOracle.weeklyPriceAggregated(2)).to.be.equal(12600);
            expect(await aggregatedPriceOracle.weeklyPriceAggregated(3)).to.be.equal(17500);

            expect(await aggregatedPriceOracle.monthlyPriceAggregated(0)).to.be.equal(40600);
        });
        it("Set Daily Price for 11 Months + 3 Weeks + 6 Days", async function () {
            const NumberOfDays = 7 * 4 * 12 - 2; // Minus 2 because a daily price is already set in the constructor
            const InitialPrice = 100;

            for (let i = 1; i <= NumberOfDays; i++) {
                await aggregatedPriceOracle.setDailyPrice(InitialPrice + i * 100);
            }

            expect(await aggregatedPriceOracle.nextDailyPriceIndex()).to.be.equal(6);
            expect(await aggregatedPriceOracle.nextWeeklyPriceIndex()).to.be.equal(3);
            expect(await aggregatedPriceOracle.nextMonthlyPriceIndex()).to.be.equal(11);

            expect(await aggregatedPriceOracle.dailyPrice(0)).to.be.equal(33000);
            expect(await aggregatedPriceOracle.dailyPrice(1)).to.be.equal(33100);
            expect(await aggregatedPriceOracle.dailyPrice(2)).to.be.equal(33200);
            expect(await aggregatedPriceOracle.dailyPrice(3)).to.be.equal(33300);
            expect(await aggregatedPriceOracle.dailyPrice(4)).to.be.equal(33400);
            expect(await aggregatedPriceOracle.dailyPrice(5)).to.be.equal(33500);
        });
        it("Set Daily Price for 1 Year", async function () {
            const NumberOfDays = 7 * 4 * 12 - 1;
            const InitialPrice = 100;

            for (let i = 1; i <= NumberOfDays; i++) {
                await aggregatedPriceOracle.setDailyPrice(InitialPrice + i * 100);
            }

            expect(await aggregatedPriceOracle.nextDailyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.nextWeeklyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.nextMonthlyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.getYearlyPriceAggregatedLength()).to.be.equal(1);

            expect(await aggregatedPriceOracle.yearlyPriceAggregated(0)).to.be.equal(5661600);
        });
        it("Set Daily Price for 3 Years", async function () {
            const NumberOfDaysPerYear = 7 * 4 * 12;
            const NumberOfYears = 3;
            const NumberOfDays = NumberOfDaysPerYear * NumberOfYears - 1;
            const InitialPrice = 100;

            for (let i = 1; i <= NumberOfDays; i++) {
                await aggregatedPriceOracle.setDailyPrice(InitialPrice + i * 100);
            }

            expect(await aggregatedPriceOracle.nextDailyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.nextWeeklyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.nextMonthlyPriceIndex()).to.be.equal(0);
            expect(await aggregatedPriceOracle.getYearlyPriceAggregatedLength()).to.be.equal(3);

            expect(await aggregatedPriceOracle.yearlyPriceAggregated(0)).to.be.equal(5661600);
            expect(await aggregatedPriceOracle.yearlyPriceAggregated(1)).to.be.equal(16951200);
            expect(await aggregatedPriceOracle.yearlyPriceAggregated(2)).to.be.equal(28240800);
        });
    });
});
