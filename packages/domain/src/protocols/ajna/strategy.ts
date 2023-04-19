import { Tx } from '@oasisdex/dma-common/types/tx';
import { AjnaError, AjnaWarning } from './validation';


export type Strategy<Position> = {
  simulation: {
    swaps: [];
    // @deprecated - use position
    targetPosition: Position;
    position: Position;
    errors: AjnaError[];
    warnings: AjnaWarning[];
  };
  tx: Tx;
};
