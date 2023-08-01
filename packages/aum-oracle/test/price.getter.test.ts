import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

import { AggregatedPriceOracle } from "../typechain-types";

describe("AggregatedPriceOracle", function () {
    describe("Getter Cases", function () {
        /// CONSTANTS
        const NumberOfDaysPerWeek = 7;
        const NumberOfWeeksPerMonth = 4;
        const NumberOfMonthsPerYear = 12;

        const NumberOfDaysPerMonth = NumberOfDaysPerWeek * NumberOfWeeksPerMonth;
        const NumberOfDaysPerYear = NumberOfDaysPerWeek * NumberOfWeeksPerMonth * NumberOfMonthsPerYear;

        /// DEPLOYMENT VARIABLES
        let aggregatedPriceOracle: AggregatedPriceOracle;
        let initialTimestamp: BigNumber;
        let lastTimestamp: BigNumber;

        // Initialize the contract
        before(async function () {
            const AggregatedPriceOracle = await ethers.getContractFactory("AggregatedPriceOracle");
            aggregatedPriceOracle = (await AggregatedPriceOracle.deploy(
                "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                BigNumber.from(100),
            )) as AggregatedPriceOracle;

            await aggregatedPriceOracle.deployed();

            // Populate the contracts

            /// CONFIG
            const NumberOfYears = 1;
            const NumberOfMonths = 6;
            const NumberOfWeeks = 3;
            const NumberOfDays = 6;

            const TotalNumberOfDays =
                NumberOfYears * NumberOfDaysPerYear +
                NumberOfMonths * NumberOfDaysPerMonth +
                NumberOfWeeks * NumberOfDaysPerWeek +
                NumberOfDays -
                1; // Minus one because first price is set in the constructor
            const InitialPrice = 100;

            const NumberOfSecondsPerDay = 86400;
            const NumberOfSecondsToAdvance = NumberOfSecondsPerDay * TotalNumberOfDays;

            for (let i = 1; i <= TotalNumberOfDays; i++) {
                await aggregatedPriceOracle.setDailyPrice(InitialPrice + i * 100);
            }

            // Default to one year
            await ethers.provider.send("evm_increaseTime", [NumberOfSecondsToAdvance]);
            await ethers.provider.send("evm_mine", []);

            initialTimestamp = await aggregatedPriceOracle.initialTimestamp();
            lastTimestamp = initialTimestamp.add(NumberOfSecondsToAdvance);
        });

        // The following tests are skipped while the getAggregatedPrice function is not marked as view,
        // because then the return value cannot be retrieved
        it.skip("Start Timestamp in the Future", async function () {
            const timestampInTheFuture = lastTimestamp.add(10000);
            await expect(aggregatedPriceOracle.getAggregatedPrice(timestampInTheFuture)).to.be.revertedWith(
                "StartTSAfterEndTS",
            );
        });

        it.skip("Start Timestamp Before Initial Timestamp", async function () {
            const timestampBeforeInitialTimestamp = initialTimestamp.sub(1);
            await expect(aggregatedPriceOracle.getAggregatedPrice(timestampBeforeInitialTimestamp)).to.be.revertedWith(
                "StartTSBeforeInitialTS",
            );
        });

        it.skip("Get Price for Last 2 Days", async function () {
            const NumberOfDays = 2;
            const NumberOfSecondsPerDay = 86400;
            const NumberOfSeconds = NumberOfSecondsPerDay * (NumberOfDays - 1);

            const aggregatedPrice = await aggregatedPriceOracle.getAggregatedPrice(lastTimestamp.sub(NumberOfSeconds));

            expect(aggregatedPrice).to.equal(106100);
        });

        it.skip("Get Price for Last 6 Days", async function () {
            const NumberOfDays = 6;
            const NumberOfSecondsPerDay = 86400;
            const NumberOfSeconds = NumberOfSecondsPerDay * (NumberOfDays - 1);

            const aggregatedPrice = await aggregatedPriceOracle.getAggregatedPrice(lastTimestamp.sub(NumberOfSeconds));

            expect(aggregatedPrice).to.equal(317100);
        });

        it.skip("Get Price for Last 11 Days", async function () {
            const NumberOfDays = 11;
            const NumberOfSecondsPerDay = 86400;
            const NumberOfSeconds = NumberOfSecondsPerDay * (NumberOfDays - 1);

            const aggregatedPrice = await aggregatedPriceOracle.getAggregatedPrice(lastTimestamp.sub(NumberOfSeconds));

            expect(aggregatedPrice).to.equal(682500);
        });

        it.skip("Get Price for Last Year, 6 Months, 3 weeks and 2 Days", async function () {
            const NumberOfDays = NumberOfDaysPerYear + NumberOfDaysPerMonth * 6 + NumberOfDaysPerWeek * 3 + 2;
            const NumberOfSecondsPerDay = 86400;
            const NumberOfSeconds = NumberOfSecondsPerDay * (NumberOfDays - 1);

            const aggregatedPrice = await aggregatedPriceOracle.getAggregatedPrice(lastTimestamp.sub(NumberOfSeconds));

            expect(aggregatedPrice).to.equal(14124600);
        });

        it("Get Price for Different Ranges", async function () {
            const NumberOfDays = NumberOfDaysPerYear + NumberOfDaysPerMonth * 6 + NumberOfDaysPerWeek * 3 + 6;
            const NumberOfSecondsPerDay = 86400;

            let startTimestamp = initialTimestamp;
            for (let i = 0; i < NumberOfDays; i++) {
                await aggregatedPriceOracle.getAggregatedPrice(startTimestamp);
                startTimestamp = startTimestamp.add(NumberOfSecondsPerDay);
            }
        });
    });
});
