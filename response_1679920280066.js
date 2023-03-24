const js = {
  protocols: [
    {
      id: 'OPTIMISM_UNISWAP_V3',
      title: 'Uniswap V3',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/uniswap.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/uniswap_color.png',
    },
    {
      id: 'OPTIMISM_SYNTHETIX',
      title: 'Synthetix',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/synthetix.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/synthetix_color.png',
    },
    {
      id: 'OPTIMISM_SYNTHETIX_WRAPPER',
      title: 'Wrapped Synthetix',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/synthetix.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/synthetix_color.png',
    },
    {
      id: 'OPTIMISM_ONE_INCH_LIMIT_ORDER',
      title: '1inch Limit Order Protocol',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/1inch.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/1inch_color.png',
    },
    {
      id: 'OPTIMISM_ONE_INCH_LIMIT_ORDER_V2',
      title: '1inch Limit Order Protocol V2',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/1inch.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/1inch_color.png',
    },
    {
      id: 'OPTIMISM_ONE_INCH_LIMIT_ORDER_V3',
      title: '1inch Limit Order Protocol V3',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/1inch.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/1inch_color.png',
    },
    {
      id: 'OPTIMISM_CURVE',
      title: 'Curve',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/curve.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/curve_color.png',
    },
    {
      id: 'OPTIMISM_BALANCER_V2',
      title: 'Balancer V2',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/balancer.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/balancer_color.png',
    },
    {
      id: 'OPTIMISM_VELODROME',
      title: 'Velodrome',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/velodrome.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/velodrome_color.png',
    },
    {
      id: 'OPTIMISM_KYBERSWAP_ELASTIC',
      title: 'KyberSwap Elastic',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/kyber.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/kyber_color.png',
    },
    {
      id: 'OPTIMISM_CLIPPER_COVES',
      title: 'Clipper Coves',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/clipper.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/clipper_color.png',
    },
    {
      id: 'OPTIMISM_KYBER_DMM_STATIC',
      title: 'Kyber DMM Static',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/kyber.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/kyber_color.png',
    },
    {
      id: 'OPTIMISM_AAVE_V3',
      title: 'Aave V3',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/aave.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/aave_color.png',
    },
    {
      id: 'OPTIMISM_ELK',
      title: 'ELK',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/elk.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/elk_color.png',
    },
    {
      id: 'OPTIMISM_WOOFI_V2',
      title: 'WOOFi V2',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/woofi.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/woofi_color.png',
    },
    {
      id: 'OPTIMISM_TRIDENT',
      title: 'Trident',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/sushiswap.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/sushiswap_color.png',
    },
    {
      id: 'OPTIMISM_MUMMY_FINANCE',
      title: 'Mummy Finance',
      img: 'https://cdn.1inch.io/liquidity-sources-logo/mummy.png',
      img_color: 'https://cdn.1inch.io/liquidity-sources-logo/mummy_color.png',
    },
  ],
}

console.log(js.protocols.map(p => `'${p.id}'`).join(', '))
