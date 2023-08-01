// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import "./interfaces/IAggregatedPriceOracle.sol";
import { Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title AggregatedPriceOracle
 * @notice Keeps track of aggregated prices for a period of time. Aggregated means the summatory of all daily prices
 *         for the given period of time. This can be used to calculate for example a daily fee over a period of time.
 */
contract AggregatedPriceOracle is Ownable, IAggregatedPriceOracle {
  /// IMMUTABLES
  address public immutable token; // Zero address indicates ETH
  uint256 public immutable initialTimestamp;

  /// CONSTANTS

  // The grouping does not follow natural years or months, but rather a fixed number of days/weeks/months/years
  // so we can optimize the aggregation of the prices
  uint256 public constant SECONDS_IN_DAY = 86400;
  uint256 public constant DAYS_IN_WEEK = 7;
  uint256 public constant WEEKS_IN_MONTH = 4;
  uint256 public constant DAYS_IN_MONTH = DAYS_IN_WEEK * WEEKS_IN_MONTH;
  uint256 public constant MONTHS_IN_YEAR = 12;
  uint256 public constant DAYS_IN_YEAR = DAYS_IN_MONTH * MONTHS_IN_YEAR;

  /// STATE VARIABLES
  uint256 public nextDailyPriceIndex; // = 0
  int256[7] public dailyPrice;

  uint256 public nextWeeklyPriceIndex; // = 0;
  int256[4] public weeklyPriceAggregated;

  uint256 public nextMonthlyPriceIndex; // = 0;
  int256[12] public monthlyPriceAggregated;

  int256[] public yearlyPriceAggregated;

  /// CONSTRUCTOR
  constructor(address token_, int256 initialPrice_) {
    token = token_;
    initialTimestamp = block.timestamp;

    _setDailyPrice(initialPrice_);
  }

  /// STATE CHANGING FUNCTIONS

  /**
   * @dev Implementation assumes price is set every day and only once. Edge cases are not
   *      covered as this is just a PoC to estimate gas costs.
   *
   * @dev There is no protection against setting the same price twice in a row. There is also no control
   *      on the timestamp where the price is set, meaning that if it's set twice in a row the contract
   *      assumes the latest price is for the next day
   */
  function setDailyPrice(int256 price) external onlyOwner {
    _setDailyPrice(price);

    // Weekly price is updated every 7 days
    if (nextDailyPriceIndex == 0) {
      _updateWeeklyPrice();
    }
  }

  /// VIEW FUNCTIONS

  /**
    @dev This function is not marked as view to temporarily get gas usage from it in the tests
   */
  function getAggregatedPrice(uint256 fromTimestamp) external returns (int256) {
    uint256 toTimestamp = block.timestamp;

    if (fromTimestamp > toTimestamp) {
      revert StartTSAfterEndTS(fromTimestamp, toTimestamp);
    }
    if (fromTimestamp < initialTimestamp) {
      revert StartTSBeforeInitialTS(fromTimestamp, initialTimestamp);
    }

    uint256 fromDayIndex = (fromTimestamp - initialTimestamp) / SECONDS_IN_DAY;
    uint256 toDayIndex = (toTimestamp - initialTimestamp) / SECONDS_IN_DAY;

    int256 yearlyAggregatedPrice = _getAggregatedYearlyPrice(fromDayIndex, toDayIndex);
    int256 monthlyAggregatedPrice = _getAggregatedMonthlyPrice(fromDayIndex, toDayIndex);
    int256 weeklyAggregatedPrice = _getAggregatedWeeklyPrice(fromDayIndex, toDayIndex);
    int256 dailyAggregatedPrice = _getAggregatedDailyPrice(fromDayIndex, toDayIndex);

    return
      yearlyAggregatedPrice + monthlyAggregatedPrice + weeklyAggregatedPrice + dailyAggregatedPrice;
  }

  function getYearlyPriceAggregatedLength() external view returns (uint256) {
    return yearlyPriceAggregated.length;
  }

  /// INTERNALS
  function _getAggregatedYearlyPrice(
    uint256 fromDayIndex,
    uint256 nowDayIndex
  ) internal view returns (int256) {
    // Using 1 years here because it doesn't matter if it's a leap year or not,
    // just want the aggregation in blocks of 365 days
    uint256 yearStartIndex = fromDayIndex / DAYS_IN_YEAR;
    uint256 yearEndIndex = nowDayIndex / DAYS_IN_YEAR;

    if (yearStartIndex >= yearlyPriceAggregated.length) {
      return 0;
    }

    if (yearEndIndex >= yearlyPriceAggregated.length) {
      yearEndIndex = yearlyPriceAggregated.length - 1;
    }

    int256 aggregatedPrice = 0;
    for (uint256 i = yearStartIndex; i <= yearEndIndex; i++) {
      aggregatedPrice += yearlyPriceAggregated[i];
    }
    return aggregatedPrice;
  }

  function _getAggregatedMonthlyPrice(
    uint256 fromDayIndex,
    uint256 nowDayIndex
  ) internal view returns (int256) {
    uint256 monthStartIndex = fromDayIndex / DAYS_IN_MONTH;
    uint256 monthNowIndex = nowDayIndex / DAYS_IN_MONTH;

    monthStartIndex = _calculateAdjustedIndex(
      monthStartIndex,
      monthNowIndex,
      monthlyPriceAggregated.length,
      MONTHS_IN_YEAR
    );

    int256 aggregatedPrice = 0;
    for (uint256 i = monthStartIndex; i < nextMonthlyPriceIndex; i++) {
      aggregatedPrice += monthlyPriceAggregated[i];
    }
    return aggregatedPrice;
  }

  function _getAggregatedWeeklyPrice(
    uint256 fromDayIndex,
    uint256 nowDayIndex
  ) internal view returns (int256) {
    uint256 weeklyStartIndex = fromDayIndex / DAYS_IN_WEEK;
    uint256 weeklyNowIndex = nowDayIndex / DAYS_IN_WEEK;

    weeklyStartIndex = _calculateAdjustedIndex(
      weeklyStartIndex,
      weeklyNowIndex,
      weeklyPriceAggregated.length,
      WEEKS_IN_MONTH
    );

    int256 aggregatedPrice = 0;
    for (uint256 i = weeklyStartIndex; i < nextWeeklyPriceIndex; i++) {
      aggregatedPrice += weeklyPriceAggregated[i];
    }
    return aggregatedPrice;
  }

  function _getAggregatedDailyPrice(
    uint256 fromDayIndex,
    uint256 nowDayIndex
  ) internal view returns (int256) {
    fromDayIndex = _calculateAdjustedIndex(
      fromDayIndex,
      nowDayIndex,
      dailyPrice.length,
      DAYS_IN_WEEK
    );

    int256 aggregatedPrice = 0;
    for (uint256 i = fromDayIndex; i < nextDailyPriceIndex; i++) {
      aggregatedPrice += dailyPrice[i];
    }
    return aggregatedPrice;
  }

  function _calculateAdjustedIndex(
    uint256 startIndex,
    uint256 endIndex,
    uint256 currentDataLength,
    uint256 maxDataLength
  ) internal pure returns (uint256) {
    if (endIndex - startIndex + 1 > currentDataLength) {
      return 0;
    } else {
      return startIndex % maxDataLength;
    }
  }

  function _setDailyPrice(int256 price) internal {
    dailyPrice[nextDailyPriceIndex] = price;
    nextDailyPriceIndex = (nextDailyPriceIndex + 1) % DAYS_IN_WEEK;
  }

  function _updateWeeklyPrice() internal {
    int256 sum = 0;
    for (uint256 i = 0; i < dailyPrice.length; i++) {
      sum += dailyPrice[i];
    }

    weeklyPriceAggregated[nextWeeklyPriceIndex] = sum;
    nextWeeklyPriceIndex = (nextWeeklyPriceIndex + 1) % WEEKS_IN_MONTH;

    // Monthly price is updated every 4 weeks
    if (nextWeeklyPriceIndex == 0) {
      _updateMonthlyPrice();
    }
  }

  function _updateMonthlyPrice() internal {
    int256 sum = 0;
    for (uint256 i = 0; i < weeklyPriceAggregated.length; i++) {
      sum += weeklyPriceAggregated[i];
    }

    monthlyPriceAggregated[nextMonthlyPriceIndex] = sum;
    nextMonthlyPriceIndex = (nextMonthlyPriceIndex + 1) % MONTHS_IN_YEAR;

    // Yearly price is updated every 12 months
    if (nextMonthlyPriceIndex == 0) {
      _updateYearlyPrice();
    }
  }

  function _updateYearlyPrice() internal {
    int256 sum = 0;
    for (uint256 i = 0; i < monthlyPriceAggregated.length; i++) {
      sum += monthlyPriceAggregated[i];
    }

    yearlyPriceAggregated.push(sum);
  }
}
