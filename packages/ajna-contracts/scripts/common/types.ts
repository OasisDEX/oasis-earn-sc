import { Signer } from "ethers";

import { IAccountImplementation } from "../../typechain-types";

export interface User {
  signer: Signer;
  proxy: IAccountImplementation;
}
