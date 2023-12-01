# Refinance Operations

The refinance operations framework provides a way of adding new refinance operations easily for new
protocols.

The framework divides each operation in 5 steps:

- Closing of the previous position (customisable)
- Swapping of the collateral into the new collateral (if needed)
- Opening of the new position (customisable)
- Swapping of the new debt into the old debt (if needed, to repay the flashloan)
- Returning of the funds to the user

By doing this, the intention is to allow for composition of this operations among the different
protocols. This way we can implement a refinance operation between AAVE and Ajna, for example as:

- Close current position in AAVE for ETH/USDC
- Swap the ETH collateral into DAI
- Open a new position in Ajna for DAI/rETH
- Swap the rETH debt into ETH to repay the flashloan
- Return the remaining ETH to the user

# How to add a new protocol

The framework allows to add new protocols by implementing the `RefinancePartialOperationGenerator`
interface for the new Operation. This interface defines a function that receives the list of
arguments needed for the refinance operation and returns a list of calls to be executed. It also
returns the value of the last storage index that was used in that set of calls. This is used to keep
track of the last Operation storage slot used by the system.

Each function implementing the `RefinancePartialOperationGenerator` interface must self register
into the Refinance framework by means of the `registerRefinanceOperation` function. This function
receives the name of the protocol, the type of operation to be registered and the callback of type
`RefinancePartialOperationGenerator` that will generate the necessary calls.

Each `RefinancePartialOperationGenerator` function receives the same exact arguments and it is up to
each function to collate the arguments into the necessary subset of arguments. If a new protocol
needs a new argument this must be added to the common list of arguments in the `types.ts` file, to
the `RefinanceOperationArgs` type.

Once a new `RefinancePartialOperationGenerator` function is implemented and it has the call to
self-register, it must be added to the `index.ts` file so that the self-registration is executed.

# How to retrieve the list of calls for a refinance operation

As a user of the library, the entry point to generate the list of calls for a refinance operation is
to call the `getRefinanceOperation` function. This function receives the origin protocol, the target
protocol and the list of arguments for the refinance operation. It returns a list of calls to be
executed in the form of an `IOperation`, same as the rest of the operations defined in the library.

Three helper functions are also provided:

- `getRefinanceOperationName`: retrieves the name of an operation given the origin and target
  protocols
- `getAvailableRefinanceOperationsNames`: retrieves all of the defined refinance operations that are
  available
- `getRefinanceOperationDefinition`: retrieves the operation definition, including the name of the
  operation, the different actions that are used and their optionality. This can be used to create a
  tool that generates the corresponding operation definitions in the `package/deploy-configurations`
  folder

# Directory and files structure

## types.ts

This file contains the common types used by the refinance operations framework. In particular it
contains the definitions of the `RefinanceOperationArgs` type that is used to pass the arguments to
the `RefinancePartialOperationGenerator` functions.

## refinance.operations.ts

This is the file that defines the entry point for the user of the framework. It contains the
functions that retrieve an operation given the origin and target protocols, and the list of
arguments. It also contains the helper functions to retrieve the name of an operation and the list
of available operations.

## index.ts

This file exports all of the public symbols of the refinance operations framework. It also contains
all the imports for the different refinance operations that are implemented. These imports are
important as they trigger the self-registration code upon module loading.

## common

This directory contains the common code for the refinance operations framework. In particular it
has:

- Swap between close and open `RefinancePartialOperationGenerator` used across all of the protocols
  for swapping the retrieved collateral from the initial position into the collateral needed for the
  new position (skipped if the collateral is the same)
- Swap after open used to swap the borrowed debt from the new position into the old position debt to
  repay the flashloan (skipped if the debt is the same)
- Return funds used to return the remaining funds to the user after the refinance operation is
  completed

## aave

This directory contains the code for the AAVE refinance operations. A particular file in this
directory is the `aave/common/refinance.aave.casts.ts` file. This file contains the casts for the
different arguments that are used in the AAVE refinance operations. This is needed as the refinance
framework tries to follow the approach for arguments that is present in the `multiply` operations.

This approach uses the `WithXXX` nomenclature to define the different arguments that are used in the
different operations. This semantic grouping is very useful and expandable and is also used in the
`RefinanceOperationArgs` type.

Because the underlying borrow operations do NOT use this approach, a set of casts is needed to
convert the arguments from the `RefinanceOperationArgs` type to the arguments used in the AAVE
borrow operations.
