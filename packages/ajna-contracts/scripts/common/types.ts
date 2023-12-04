import { Signer } from "ethers";

import { IAccountImplementation } from "../../typechain-types";

export interface User {
  signer: Signer;
  proxy: IAccountImplementation;
}

export type Pool = { pair: string; amount: number; price: number; deposit: boolean; deploy: boolean; rate: string };
