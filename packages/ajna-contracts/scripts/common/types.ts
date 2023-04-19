import { IAccountImplementation } from "@ajna-contracts/typechain-types";
import { Signer } from "ethers";

export interface User {
  signer: Signer;
  proxy: IAccountImplementation;
}
