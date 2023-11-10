import { createEnviroment, Enviroment } from '../logic/common/enviroment'

const Conf = require('conf');
const config = new Conf();

export function getEnvitoment() {
    return createEnviroment(
        config.get('wallet'),
        config.get('rpc'),
        config.get('chainId'),
    )
}
