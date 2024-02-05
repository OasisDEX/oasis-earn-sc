import { SwapData } from '@oasisdex/dma-library';
import { BigNumber } from 'bignumber.js';

function formatOneInchSwapUrl(
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: string,
  recepient: string,
  chainId: number,
  oneInchVersion: 'v4.0' | 'v5.0',
  protocols: string[] = [],
) {
  const protocolsParam = !protocols?.length
    ? ''
    : `&protocols=${protocols.join(',')}`;
  return `${`https://api-oasis.1inch.io`}/${oneInchVersion}/${chainId}/swap?fromTokenAddress=${fromToken.toLowerCase()}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${recepient}&slippage=${slippage}${protocolsParam}&disableEstimate=true&allowPartialFill=false`;
}

async function exchangeTokens(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      'auth-key':
        'jx7tWgwbCF9NmYhy93fwjfhgdeNE0Mjp8ShAmEiDVriWTcphJslDAkkQ9AaV',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Error performing 1inch swap request ${url}: ${await response.text()}`,
    );
  }

  return (await response.json()) as Promise<any>;
}

async function swapOneInchTokens(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  recipient: string,
  slippage: string,
  chainId: number,
  oneInchVersion: 'v4.0' | 'v5.0',
  protocols: string[] = [],
): Promise<any> {
  const url = formatOneInchSwapUrl(
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
    recipient,
    chainId,
    oneInchVersion,
    protocols,
  );

  console.log(`url ${url}`);

  return exchangeTokens(url);
}
const ETHEREUM_MAINNET_DEFAULT_PROTOCOLS = [
  'UNISWAP_V1',
  'UNISWAP_V2',
  'SUSHI',
  'MOONISWAP',
  // 'BALANCER',
  'COMPOUND',
  'CURVE',
  'CURVE_V2_SPELL_2_ASSET',
  'CURVE_V2_SGT_2_ASSET',
  'CURVE_V2_THRESHOLDNETWORK_2_ASSET',
  'CHAI',
  'OASIS',
  'KYBER',
  'AAVE',
  'IEARN',
  'BANCOR',
  'SWERVE',
  'BLACKHOLESWAP',
  'DODO',
  'DODO_V2',
  'VALUELIQUID',
  'SHELL',
  'DEFISWAP',
  'SAKESWAP',
  'LUASWAP',
  'MINISWAP',
  'MSTABLE',
  'PMM2',
  'SYNTHETIX',
  'AAVE_V2',
  'ST_ETH',
  'ONE_INCH_LP',
  'ONE_INCH_LP_1_1',
  'LINKSWAP',
  'S_FINANCE',
  'PSM',
  'POWERINDEX',
  'XSIGMA',
  'SMOOTHY_FINANCE',
  'SADDLE',
  'KYBER_DMM',
  // 'BALANCER_V2',
  'UNISWAP_V3',
  'SETH_WRAPPER',
  'CURVE_V2',
  'CURVE_V2_EURS_2_ASSET',
  'CURVE_V2_ETH_CRV',
  'CURVE_V2_ETH_CVX',
  'CONVERGENCE_X',
  /* Disbled becuase wrong token price */
  //'ONE_INCH_LIMIT_ORDER',
  //'ONE_INCH_LIMIT_ORDER_V2',
  //'ONE_INCH_LIMIT_ORDER_V3',
  'DFX_FINANCE',
  'FIXED_FEE_SWAP',
  'DXSWAP',
  'SHIBASWAP',
  'UNIFI',
  'PSM_PAX',
  'WSTETH',
  'DEFI_PLAZA',
  'FIXED_FEE_SWAP_V3',
  'SYNTHETIX_WRAPPER',
  'SYNAPSE',
  'CURVE_V2_YFI_2_ASSET',
  'CURVE_V2_ETH_PAL',
  'POOLTOGETHER',
  'ETH_BANCOR_V3',
  'ELASTICSWAP',
  // 'BALANCER_V2_WRAPPER',
  'FRAXSWAP',
  'RADIOSHACK',
  'KYBERSWAP_ELASTIC',
  'CURVE_V2_TWO_CRYPTO',
  'STABLE_PLAZA',
  'ZEROX_LIMIT_ORDER',
  'CURVE_3CRV',
  'KYBER_DMM_STATIC',
  'ANGLE',
  'ROCKET_POOL',
  'ETHEREUM_ELK',
  'ETHEREUM_PANCAKESWAP_V2',
  'SYNTHETIX_ATOMIC_SIP288',
  'PSM_GUSD',
  'INTEGRAL',
  'MAINNET_SOLIDLY',
  'NOMISWAP_STABLE',
  'CURVE_V2_TWOCRYPTO_META',
  'MAVERICK_V1',
  'VERSE',
  'DFX_FINANCE_V2',
  'ZK_BOB',
  'PANCAKESWAP_V3',
  'NOMISWAPEPCS',
  'XFAI',
  'CURVE_V2_LLAMMA',
  'CURVE_V2_TRICRYPTO_NG',
  'PMM8_2',
  'SUSHISWAP_V3',
  'SFRX_ETH',
  'SDAI',
  'ETHEREUM_WOMBATSWAP',
  'PMM12',
  'CARBON',
  'COMPOUND_V3',
  'DODO_V3',
  'SMARDEX',
  'TRADERJOE_V2_1',
  'PMM15',
  'SOLIDLY_V3',
  'RAFT_PSM',
  'PMM17',
];

export function getOneInchCall(
  swapAddress: string,
  networkId: number,
  oneInchVersion: 'v4.0' | 'v5.0' = 'v4.0',
  debug?: true,
) {
  return async (
    from: string,
    to: string,
    amount: BigNumber,
    slippage: BigNumber,
    protocols: string[] = [],
  ): Promise<SwapData> => {
    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippage.times('100').toString(), // 1inch expects slippage in percentage format
      networkId,
      oneInchVersion,
      ETHEREUM_MAINNET_DEFAULT_PROTOCOLS,
    );

    if (debug) {
      console.info('1inch');
      console.info('from', from);
      console.info('to', to);
      console.info('fromTokenAmount', response.fromTokenAmount.toString());
      console.info('toTokenAmount', response.toTokenAmount.toString());
      console.info('slippage', slippage.times('100').toString());
      console.info('minToTokenAmount', response.toTokenAmount.toString());
      console.info('exchangeCalldata', response.tx.data);
      console.info('protocols', protocols);
    }

    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: new BigNumber(response.toTokenAmount)
        .times(new BigNumber(1).minus(slippage))
        .integerValue(BigNumber.ROUND_DOWN),
      toTokenAmount: new BigNumber(response.toTokenAmount),
      fromTokenAmount: new BigNumber(response.fromTokenAmount),
      exchangeCalldata: response.tx.data,
    };
  };
}
