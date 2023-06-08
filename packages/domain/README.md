# Precision

Token amounts represented at maximum precision allowed by the token are suffixed with the $ symbol
Token amounts that have been standardised to 18 decimal places are suffixed with the $$ symbols
Regular token amounts are unadorned

```shell
// Ordinary balance
// 1 ETH = 1
// 1 USDC = 1
const balance

// Balance at max precision for the token
// 1 ETH = 1e18
// 1 USDC = 1e6
const balance$

// Balance standardised to 18 decimal places for domain logic purposes
// 1 ETH = 1e18
// 1 USDC = 1e18
const balance$$
```

Longer term we can progressively refactor our code to use the precision-aware Amount class.