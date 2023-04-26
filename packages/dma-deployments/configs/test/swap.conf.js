"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    mpa: {
        core: {
            Swap: {
                name: 'Swap',
                deploy: true,
                address: '',
                serviceRegistryName: 'Swap',
                history: [],
                constructorArgs: [
                    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
                    '0xC7b548AD9Cf38721810246C079b2d8083aba8909',
                    20,
                    'address:ServiceRegistry',
                ],
            },
        },
        actions: {},
    },
};
