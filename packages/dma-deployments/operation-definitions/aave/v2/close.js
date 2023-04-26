"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aaveCloseV2OperationDefinition = void 0;
const constants_1 = require("@dma-deployments/constants");
const action_hash_1 = require("@dma-deployments/utils/action-hash");
exports.aaveCloseV2OperationDefinition = {
    name: constants_1.OPERATION_NAMES.aave.v2.CLOSE_POSITION,
    actions: [
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.common.TAKE_A_FLASHLOAN),
            optional: false,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.common.SET_APPROVAL),
            optional: false,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.aave.v2.DEPOSIT),
            optional: false,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.aave.v2.WITHDRAW),
            optional: false,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.common.SWAP_ACTION),
            optional: false,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.common.SET_APPROVAL),
            optional: false,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.aave.v2.PAYBACK),
            optional: false,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.aave.v2.WITHDRAW),
            optional: false,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.common.UNWRAP_ETH),
            optional: true,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.common.RETURN_FUNDS),
            optional: false,
        },
        {
            hash: (0, action_hash_1.getActionHash)(constants_1.CONTRACT_NAMES.common.RETURN_FUNDS),
            optional: false,
        },
    ],
};
