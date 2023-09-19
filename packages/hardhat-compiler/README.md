# hardhat-compiler

Dummy package to install the necessary hardhat compilers when using Lerna, so that we don't hit the
download concurrency issue.

The problem is that Hardhat tries to download the compilers in parallel for `dma-contracts` and
`ajna-contracts`, which makes one of the download fail sometimes.

This package is a workaround to install the compilers in a single step, so that we don't hit the
concurrency issue. The idea is to compile the dummy contracts here, and then trigger the other
packages.

## How to use

If a new compiler is added to `dma-contracts` or `ajna-contracts` packages, or to any new package in
the repo, the same compiler must be added in this package's [hardhat.config.ts](./hardhat.config.ts)
file. Then a new dummy contract must be added to the `contracts` directory for the new compiler.
This will force Hardhat download the compiler and compile the dummy contract, so that the compiler
is available for the other packages.
