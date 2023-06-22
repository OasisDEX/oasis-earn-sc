import { loadContractNames } from '@deploy-configurations/constants'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.MAINNET)

export const config: SystemConfig = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: 'ServiceRegistry',
        deploy: true,
        address: '0xD8De88D48D70ACc4B6F8713C1666fB6aaFf5e909',
        history: ['0x9b4Ae7b164d195df9C4Da5d08Be88b2848b2EaDA'],
        constructorArgs: [0],
      },
      OperationExecutor: {
        name: 'OperationExecutor',
        deploy: true,
        address: '0xa898315E79b71B9f3Be7c2Bb356164Db4EfC7a36',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_EXECUTOR,
        history: ['0xc1cd3654ab3b37e0bc26bafb5ae4c096892d0b0c'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      OperationStorage: {
        name: 'OperationStorage',
        deploy: true,
        address: '0x7DB99085c31358B2A7D9FDC70315C314d6AA75bC',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_STORAGE,
        history: ['0x66081bcDb3760f1Bf765B4D9800d0a059BBec73F'],
        constructorArgs: ['address:ServiceRegistry', 'address:OperationExecutor'],
      },
      OperationsRegistry: {
        name: 'OperationsRegistry',
        deploy: true,
        address: '0x18Bb661B1c83278bE90e5AB66A3cFf6E83da3A69',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATIONS_REGISTRY,
        history: ['0x01871C3cCfeDE29d2b998E7D1BF0eEEBD26d9c49'],
        constructorArgs: [],
      },
      DSProxyFactory: {
        name: 'DSProxyFactory',
        deploy: true,
        address: '0x27eF13fF788aB5BF82AF8C2Ba38A2070b0432f2F',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_FACTORY,
        history: ['0xA26e15C895EFc0616177B7c1e7270A4C7D51C997'],
        constructorArgs: [],
      },
      DSProxyRegistry: {
        name: 'DSProxyRegistry',
        deploy: true,
        address: '0x79E77a49bb328188F337e67493d6198E16868B09',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_REGISTRY,
        history: ['0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4'],
        constructorArgs: ['address:DSProxyFactory'],
      },
      DSGuardFactory: {
        name: 'DSGuardFactory',
        deploy: true,
        address: '0xe38d007f8DbE1cFAe148e5b942Dd209B93DE0952',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_GUARD_FACTORY,
        history: ['0x5a15566417e6C1c9546523066500bDDBc53F88C7'],
        constructorArgs: [],
      },
      AccountGuard: {
        name: 'AccountGuard',
        deploy: true,
        address: '0x27f1Cf4e972A2387b76EB5e16D12d15444904d05',
        history: ['0xCe91349d2A4577BBd0fC91Fe6019600e047f2847'],
        constructorArgs: [],
      },
      AccountFactory: {
        name: 'AccountFactory',
        deploy: true,
        address: '0xD088ab89bE13358C3fCEB1B416cE14c54B315177',
        history: ['0xF7B75183A2829843dB06266c114297dfbFaeE2b6'],
        constructorArgs: ['address:AccountGuard'],
      },
      ChainLogView: {
        name: 'ChainLogView',
        deploy: true,
        address: '0xDcce995E57Cd23668443c9bf540a8B7Ecb0be6db',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.CHAINLOG_VIEWER,
        history: ['0x4B323Eb2ece7fc1D81F1819c26A7cBD29975f75f'],
        constructorArgs: ['0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F'],
      },
      Swap: {
        name: 'uSwap',
        deploy: true,
        address: '0x06a25ee7e0e969935136D4b37003905DB195B6F3',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP,
        history: [
          '0xb6DaDafBfDCad836A701A1f95445e31cb52BFe78',
          '0x7626A3079bfF965A50131c078aF79bCaD42E41dE',
          '0xa1d02ed364C84a76d6f5b224301ffd5b853Ed66E',
          '0x6B89e123949228B9eb7B04cD7da0172DF8215EcB',
          '0xfdB5B97966430d1E6e0167F24000dd625C136778',
          '0x06a25ee7e0e969935136D4b37003905DB195B6F3',
        ],
        constructorArgs: [
          '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
          '0xC7b548AD9Cf38721810246C079b2d8083aba8909',
          20,
          'address:ServiceRegistry',
        ],
      },
    },
    actions: {
      PositionCreated: {
        name: 'PositionCreated',
        deploy: true,
        address: '0xf2987fa1aA41b4d8A1F491c1320E74975864bF16',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.POSITION_CREATED,
        history: [
          '0xA0Cb87300aB07D00468704cD8f016F8dE47D8E0A',
          '0xd65Ec56774f9ef62A0aA8ec8ad1be71cdf37987C',
          '0x9f3f24a4d0a769b10DeBCa6eF01943D09A0334f2',
          '0x58060B2298e3398B09952B3b1BDbC9aC5e52cb76',
          '0x73323610267006B06a0D0573970D115a218736f9',
          '0xc60CDD9Cf65e56eAB9ea7E71E5EA90DAEbfda130',
          '0xf2987fa1aA41b4d8A1F491c1320E74975864bF16',
        ],
        constructorArgs: [],
      },
      SwapAction: {
        name: 'SwapAction',
        deploy: true,
        address: '0x81D149d74C3E78F03614e8b5946913C546fd62E4',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP_ACTION,
        history: [
          '0x7E7EB65A93441a2D2Bf0941216b4c1116B554d85',
          '0x81ea27E7D4fCE6F3C8d5Ff1c72b2E1976Db48e92',
          '0x5C12E60210839E9b785cb0718cdE21bfB53Ce475',
          '0xAd535D64c2aE0EdCAe77212C83793Dd698568214',
          '0xFC568380508C1b3A6fD1F609D3CFF2353865a842',
          '0x9B89924C474d1f69e7183Ca0F35327EE06e07a19',
          '0x81D149d74C3E78F03614e8b5946913C546fd62E4',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      TakeFlashloan: {
        name: 'TakeFlashloan',
        deploy: true,
        address: '0xe3CdcA2a8910C36C5d17aD5a28723417F0F37Cd3',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN,
        history: [
          '0x0eD12441616ca97F5729Fff519F5e8d13d8De15F',
          '0x10a24e649712f2C05fC9c4bc26CaeDFe4500a26A',
          '0xD1E232BfECf35c244e4f455993A79fd9973846Ec',
          '0x5B30D04A9A4874986DBf1627f71909bDB2DBa8c7',
          '0x08A176b44Bd8F95bbAD15B22Df0b4d9aB674649E',
          '0x2af724C4B346D3d7a5eD02182c42955818892eBd',
          '0xe3CdcA2a8910C36C5d17aD5a28723417F0F37Cd3',
        ],
        constructorArgs: [
          'address:ServiceRegistry',
          '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          '0x5a15566417e6C1c9546523066500bDDBc53F88C7',
        ],
      },
      SetApproval: {
        name: 'SetApproval',
        deploy: true,
        address: '0xc0529CA699D61EEbCdcda39B97DB33058c4fd081',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SET_APPROVAL,
        history: [
          '0xcEA79d9132d6446f0B59F194b22DB2a93dB4146c',
          '0x6DaC0ec21148fcD13B1B4e38CBAd56092333bc08',
          '0x9cCE0b020Bc37ECB7a970c163738312B57DC887B',
          '0x4D066b3B3A166447dAb9a9a73746b4C0EE179ba2',
          '0x4C014D733bdDb2783521f4436270acd133B4b362',
          '0xb47782652F792CB70eEFCb582a8b4A7A0027017d',
          '0xc0529CA699D61EEbCdcda39B97DB33058c4fd081',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      PullToken: {
        name: 'PullToken',
        deploy: true,
        address: '0x7452A15B37584EF83f74FD53434972c42E62C8b1',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.PULL_TOKEN,
        history: [
          '0x0bE3B9c118eD4eF2002Fd58d0d8cc8f7c76e168C',
          '0xd8Ff47e977c8cf97A491Ab3B086ea3E12b01bfb1',
          '0xCC7334afAafE0465EdC73113534Ce5A02e0b835C',
          '0x9fF78de3bD970F626ccaa931b86752ac35235b21',
          '0x0c35D9D756F68555089330A845B7a627b7af1F3E',
          '0x0Da6205ECC640fE2dD29541dE9e80890436B5A1e',
          '0x7452A15B37584EF83f74FD53434972c42E62C8b1',
        ],
        constructorArgs: [],
      },
      SendToken: {
        name: 'SendToken',
        deploy: true,
        address: '0x77BE575bd66D680174740bFFAFF01890e4f12cAf',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SEND_TOKEN,
        history: [
          '0xAa4C55A8dd5b0e923056676D544FC20bb5D5e3A3',
          '0x14443362A4dF62d1487bC7C74d8523DDb71306c6',
          '0x81d8c374B88A3Fe77303b4eB55E3b8c15f4D5c19',
          '0x59F0e0c40734Ed7eAEd388745F3fcF9C3065725D',
          '0x484885ba69dCB6F25674FF979F75D0033C4E126f',
          '0xA3B1A6e78aC46E5089D7ae97c9A9e43c5ACFA99C',
          '0x77BE575bd66D680174740bFFAFF01890e4f12cAf',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      WrapEth: {
        name: 'WrapEth',
        deploy: true,
        address: '0x3b2Da11feAf83A55875456C1e3aa0bb10d5d89c5',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WRAP_ETH,
        history: [
          '0xafdD2e556Cef33C5C0033beB76E09b7Bd8d14Dec',
          '0x9fc98b41549f8a06C4260C06F60B654609cA7f85',
          '0x3c7bB7E881b0E21DCc139BDa790DEB965711eA04',
          '0xdc38d89FD009217DC2AfCCba983c6a53F4730525',
          '0xA2A368BaBbbdC3b1cD950c69FCa9094282A3B870',
          '0xb450eCcd462af76fd670091B726deEcc86ccA9Cb',
          '0x3b2Da11feAf83A55875456C1e3aa0bb10d5d89c5',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      UnwrapEth: {
        name: 'UnwrapEth',
        deploy: true,
        address: '0xb8C1acA85e9CE49bA2AaB838B0210722C1eaF51e',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNWRAP_ETH,
        history: [
          '0xAC0B1652388Ea425884e6b60e2eD30155f43D50b',
          '0x37d1d74d0a384743fD4f3a30b6f2EDcE744c91a2',
          '0xd316A5EC8391Daa7d90f02bb963Dd645456eA432',
          '0x96898Dd22e72A5B102902F67E2eD8a7302BBde74',
          '0x3f9C79ADED832Cf1e20A8B086a29F7e72964149E',
          '0xA74f89f49670d9C3D758939Bdb45bB2587A4b6AA',
          '0xb8C1acA85e9CE49bA2AaB838B0210722C1eaF51e',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      ReturnFunds: {
        name: 'ReturnFunds',
        deploy: true,
        address: '0x0D6490E9E95A2CFE34346BE41B8e078E995afE32',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS,
        history: [
          '0x645325494A37d35cf6baFc82C3e6bcE4473F2685',
          '0x9A48c2A25da6dA49722ed1F0E109897722C77A35',
          '0xDD7457A72064D6D89dF7b205BAe4F96774745424',
          '0x95a76f49ADD812055E7489dd6e0eD63A0d2A06af',
          '0xD395Bce0Db47784DB7b708D1eEB3dca6E65e7B77',
          '0xAeC3cA2D48de8F6b5d408E31EdC9f539389f9329',
          '0x0D6490E9E95A2CFE34346BE41B8e078E995afE32',
        ],
        constructorArgs: [],
      },
      AaveBorrow: {
        name: 'AaveBorrow',
        deploy: true,
        address: '0x5DCC84bE21aAC48abBd3DE5A1876A61269C51718',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.BORROW,
        history: [
          '0x6166B1587be6B954e660A71e4B083A5e0a5bF1b6',
          '0xf69FA67ECDf0B928bEe9Cd0383DB52Cd2e743fbB',
          '0x7b5072c8bFFe7a28fA0e02bc697776c28389b78A',
          '0xfaf7ae42126B8aBb849118b88297a82D104CbCc0',
          '0x29a6a41111b628aDA06E427afdB0Eb8c6f6838a4',
          '0xe2B665b1AE5472947a7d8B55935f757cafF4dC78',
          '0x5DCC84bE21aAC48abBd3DE5A1876A61269C51718',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveWithdraw: {
        name: 'AaveWithdraw',
        deploy: true,
        address: '0x8b20C422adbd764B268a708377BB69B03cf91b7c',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.WITHDRAW,
        history: [
          '0xECf6CaB5cD20F5f889e95A1A40d46607aa0F41Cf',
          '0xa8C2e11aebdDf663284ad57a57e044199c5eD30a',
          '0xA6443A24bA5d6f9996E5EF0ca5ffA282Ca389252',
          '0x853Ce220fFaB32b57Ee03200473EFd23dB324842',
          '0x1644A899995813314f5c0d44276C5D863d45a49d',
          '0x55a9f50EAA192cDb277b42A25Ef8FFb0e0F87607',
          '0x8b20C422adbd764B268a708377BB69B03cf91b7c',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveDeposit: {
        name: 'AaveDeposit',
        deploy: true,
        address: '0xddB2B3894Ce052Af6aa7B60B7CB4473BC2cc26EB',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.DEPOSIT,
        history: [
          '0xFAf9D0B7B92e8B281CaF10b42970179B45CA6412',
          '0x859c71DFf1168ec537a496bBfc517EF40fb03828',
          '0xAD85aae8A818Dd84176a28c193F1F9b11c67679d',
          '0x1BCb41e8c83a5c410246622abe97cb2056Cf3Ce8',
          '0xCfeD82a38fFC32c7F728F5d16ebfA92416B08E7d',
          '0xC7DBcB2fe46Ef88A1650Af96F01e48142e27a446',
          '0xddB2B3894Ce052Af6aa7B60B7CB4473BC2cc26EB',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AavePayback: {
        name: 'AavePayback',
        deploy: true,
        address: '0xDd3fCB5C4E7f0fEfa9520dc6Ed18D996A3dED7C0',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.PAYBACK,
        history: [
          '0xeB54C366512c4d59A222A251ea7316568859E08C',
          '0x5011d41D73F1Ae7D9Cb6dE5b9B50693C0eCfEa0d',
          '0x0A2C4f5d56162DF049D3911BBC288bB986F9715A',
          '0x252b405eb3e7b7D71eEEC76969f627D1A8Ff6cd2',
          '0xBA78e1E257b24766603eF66505c1C04fa4129015',
          '0x9F0c494294bf5a1834db0a7ad06d24764e90E312',
          '0xDd3fCB5C4E7f0fEfa9520dc6Ed18D996A3dED7C0',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Borrow: {
        name: 'AaveV3Borrow',
        deploy: true,
        address: '0xEAF045a19bFfDA1F088bB09D0774c274E2B4B929',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.BORROW,
        history: [
          '0x18ca8bE41D32727383bC0F98705f7662ed0B7E28',
          '0xc45A04bc17941900Df0cc08E93A3CA56A411B1Ac',
          '0x609E6094e7Ec869284f9EF6C34d7e0BDc30eC3CD',
          '0x0475C2939e1D0b3BA577764F48b4814eFec3932e',
          '0xbae51d20366b1D16127334ac909272E84903CD97',
          '0xD9ed7A6B3C2273287816772Cef8d50f476e94B76',
          '0xEAF045a19bFfDA1F088bB09D0774c274E2B4B929',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Withdraw: {
        name: 'AaveV3Withdraw',
        deploy: true,
        address: '0xB8064036fe0DC39C49aD7962284b2001E37490eA',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.WITHDRAW,
        history: [
          '0x414958801DC53E840501f507D7A0FEBE55806200',
          '0xE4375b9777a3DcDdBBaE922Db1039015970c24c7',
          '0xB58C6Dd084825bfaB7f13e4736458e51754a66f8',
          '0x2aB0BE2feFCcD54e4f5af1B070082bcE912a5bEB',
          '0xE539345f745ba7CfA32DB0342c03453Ebb124a23',
          '0x3f70EB7Ba4b8b19f8F77538E856BE0d66BDf8277',
          '0xB8064036fe0DC39C49aD7962284b2001E37490eA',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Deposit: {
        name: 'AaveV3Deposit',
        deploy: true,
        address: '0xeaCc65458b627D8473a0b04De531C44be6ff3847',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.DEPOSIT,
        history: [
          '0x852c56859840487DcED2aF501fC06f7462C4f2a8',
          '0x0B0e8D4b59199d33c6FCa15022420bD3a0dbab11',
          '0x54926b9e27BaFbe7d0A40eba729DE4aB1E069318',
          '0xecf69446B8C33bDb7477a4b1d19bACA1B51A2f2F',
          '0x3F3ae41571fcE03A8CD33A8d45ca32bA1c2a059A',
          '0x09ac5FE5d8420953046035d193207bB834f14543',
          '0xeaCc65458b627D8473a0b04De531C44be6ff3847',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Payback: {
        name: 'AaveV3Payback',
        deploy: true,
        address: '0x11e5cfd9BDa4E847602F04a9e619148a745A1D2d',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.PAYBACK,
        history: [
          '0xdB736d13CE851Ee81ac2109DF37EBAb8Ce525C42',
          '0x10Dd12f656FAa9162444B0377e8e8CE9Bc944Ce7',
          '0x745702eE29ba359ACB15942860A2eF1837b4Afa2',
          '0xf87eD9c776375bbe50d06603520606b9015c81eC',
          '0xFb15657D8286DA156196559E2CF68931E4620ef1',
          '0x4e942F84092796E89b1B0E4f946d5F7d461903Ab',
          '0x11e5cfd9BDa4E847602F04a9e619148a745A1D2d',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3SetEMode: {
        name: 'AaveV3SetEMode',
        deploy: true,
        address: '0x497FaE16975F1CC25f3399f294F566fB6833d60B',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.SET_EMODE,
        history: [
          '0xd4DB3799DEe98Fe752d952Ba6F84Bb99Af829920',
          '0x99B31f423D1963a7F07eAE4AfBA7652587816391',
          '0x3572bdcE311C5Dda9514766Ea6E5c3D699bfE45C',
          '0x2F88BCc4A28c06ea8Ca79FBcaBe9d8C85e72c984',
          '0x8332E00e1E82631a86cDD0349F79c7BA37aDea69',
          '0x4EEfCb53D8f2CC67611626e9034126BE56968718',
          '0x497FaE16975F1CC25f3399f294F566fB6833d60B',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AjnaDepositBorrow: {
        name: 'AjnaDepositBorrow',
        deploy: true,
        address: '0x92819270316ee747A2534BFE6f8D352C9E449182',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.DEPOSIT_BORROW,
        history: [
          '0xE724a3Aadc44A5350Fb0e002Be4765A5990Db474',
          '0x00C583EF1cae9fA955B58f0C86a5DC8195a816a2',
          '0x8e6cbe512961F31d233c1117fbE2192b5a9a219c',
          '0x0a2dBc0e3DFcdC2B95738244CB1fc61A73757584',
          '0xeEE0790359d154915806856d59f4B4d4Bc27A61F',
          '0x92819270316ee747A2534BFE6f8D352C9E449182',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AjnaRepayWithdraw: {
        name: 'AjnaRepayWithdraw',
        deploy: true,
        address: '0xff3D51d6Fdb5e0809E08BD9c3FBfb9fe71Bd2eF7',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.REPAY_WITHDRAW,
        history: [
          '0xEb84CC72e291822E2633C91Ac3221E3C3c6d0EC0',
          '0x16C0E833a3fd052799F0d9Df48982AF3E20d2a9A',
          '0xc320C39D0c59E6f4F0237109807f2ac5525Da600',
          '0xF48663CE0879C77602AE126C0601669AB9Ffd373',
          '0x0F7e0c7aE197f62221e65dAEe2B31546f569C9E6',
          '0xff3D51d6Fdb5e0809E08BD9c3FBfb9fe71Bd2eF7',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
    },
  },
  common: {
    GnosisSafe: {
      name: 'GnosisSafe',
      address: '0x0000000000000000000000000000000000000000',
    },
    UniswapRouterV3: {
      name: 'UniswapRouterV3',
      address: '0xe592427a0aece92de3edee1f18e0157c05861564',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNISWAP_ROUTER,
    },
    BalancerVault: {
      name: 'BalancerVault',
      address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.BALANCER_VAULT,
    },
    OneInchAggregator: {
      name: 'OneInchAggregator',
      address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ONE_INCH_AGGREGATOR,
    },
    AuthorizedCaller: {
      name: 'AuthorizedCaller',
      address: '0x85f9b7408afE6CEb5E46223451f5d4b832B522dc',
    },
    FeeRecipient: {
      name: 'FeeRecipient',
      address: '0xC7b548AD9Cf38721810246C079b2d8083aba8909',
    },
    MerkleRedeemer: {
      name: 'MerkleRedeemer',
      address: '0xd9fabf81Ed15ea71FBAd0C1f77529a4755a38054',
    },
    DssCharter: { name: 'DssCharter', address: '0x0000123' },
    DssProxyActions: {
      name: 'DssProxyActions',
      address: '0x82ecD135Dce65Fbc6DbdD0e4237E0AF93FFD5038',
    },
    DssProxyActionsCharter: { name: 'DssProxyActionsCharter', address: '0x0000' },
    DssMultiplyProxyActions: {
      name: 'DssMultiplyProxyActions',
      address: '0x2a49eae5cca3f050ebec729cf90cc910fadaf7a2',
    },
    DssCropper: {
      name: 'DssCropper',
      address: '0x8377CD01a5834a6EaD3b7efb482f678f2092b77e',
    },
    DssProxyActionsCropjoin: {
      name: 'DssProxyActionsCropjoin',
      address: '0xa2f69F8B9B341CFE9BfBb3aaB5fe116C89C95bAF',
    },
    DssProxyActionsDsr: {
      name: 'DssProxyActionsDsr',
      address: '0x07ee93aEEa0a36FfF2A9B95dd22Bd6049EE54f26',
    },
    Otc: {
      name: 'Otc',
      address: '0x794e6e91555438aFc3ccF1c5076A74F42133d08D',
    },
    OtcSupportMethods: {
      name: 'OtcSupportMethods',
      address: '0x9b3f075b12513afe56ca2ed838613b7395f57839',
    },
    ServiceRegistry: {
      name: 'ServiceRegistry',
      address: '0x9b4Ae7b164d195df9C4Da5d08Be88b2848b2EaDA',
    },
    GuniProxyActions: {
      name: 'GuniProxyActions',
      address: '0xed3a954c0adfc8e3f85d92729c051ff320648e30',
    },
    GuniResolver: {
      name: 'GuniResolver',
      address: '0x0317650Af6f184344D7368AC8bB0bEbA5EDB214a',
    },
    GuniRouter: {
      name: 'GuniRouter',
      address: '0x14E6D67F824C3a7b4329d3228807f8654294e4bd',
    },
    CdpRegistry: {
      name: 'CdpRegistry',
      address: '0xBe0274664Ca7A68d6b5dF826FB3CcB7c620bADF3',
    },
    DefaultExchange: {
      name: 'DefaultExchange',
      address: '0xb5eB8cB6cED6b6f8E13bcD502fb489Db4a726C7B',
    },
    NoFeesExchange: {
      name: 'NoFeesExchange',
      address: '0x99e4484dac819aa74b347208752306615213d324',
    },
    LowerFeesExchange: {
      name: 'LowerFeesExchange',
      address: '0xf22f17b1d2354b4f4f52e4d164e4eb5e1f0a6ba6',
    },
    LidoCrvLiquidityFarmingReward: {
      name: 'LidoCrvLiquidityFarmingReward',
      address: '0x99ac10631f69c753ddb595d074422a0922d9056b',
    },
    ChainlinkPriceOracle_USDCUSD: {
      name: 'ChainlinkPriceOracle_USDCUSD',
      address: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
    },
    ChainlinkPriceOracle_ETHUSD: {
      name: 'ChainlinkPriceOracle_ETHUSD',
      address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    },
    AAVE: {
      name: 'AAVE',
      address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    },
    ADAI: {
      name: 'ADAI',
      address: '0x028171bCA77440897B824Ca71D1c56caC55b68A3',
    },
    BAL: {
      name: 'BAL',
      address: '0xba100000625a3754423978a60c9317c58a424e3D',
    },
    BAT: {
      name: 'BAT',
      address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
    },
    CBETH: {
      name: 'CBETH',
      address: '0xbe9895146f7af43049ca1c1ae358b0541ea49704',
    },
    COMP: {
      name: 'COMP',
      address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    },
    CRVV1ETHSTETH: {
      name: 'CRVV1ETHSTETH',
      address: '0x06325440D014e39736583c165C2963BA99fAf14E',
    },
    DAI: {
      name: 'DAI',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DAI,
    },
    ETH: {
      name: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    },
    GNO: {
      name: 'GNO',
      address: '0x6810e776880C02933D47DB1b9fc05908e5386b96',
    },
    GUNIV3DAIUSDC1: {
      name: 'GUNIV3DAIUSDC1',
      address: '0xAbDDAfB225e10B90D798bB8A886238Fb835e2053',
    },
    GUNIV3DAIUSDC2: {
      name: 'GUNIV3DAIUSDC2',
      address: '0x50379f632ca68D36E50cfBC8F78fe16bd1499d1e',
    },
    GUSD: {
      name: 'GUSD',
      address: '0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd',
    },
    KNC: {
      name: 'KNC',
      address: '0xdd974D5C2e2928deA5F71b9825b8b646686BD200',
    },
    LDO: {
      name: 'LDO',
      address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
    },
    LINK: {
      name: 'LINK',
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    },
    LRC: {
      name: 'LRC',
      address: '0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD',
    },
    MANA: {
      name: 'MANA',
      address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
    },
    MATIC: {
      name: 'MATIC',
      address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    },
    PAX: {
      name: 'PAX',
      address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
    },
    PAXUSD: {
      name: 'PAXUSD',
      address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
    },
    RENBTC: {
      name: 'RENBTC',
      address: '0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D',
    },
    RETH: {
      name: 'RETH',
      address: '0xae78736cd615f374d3085123a210448e74fc6393',
    },
    RWA001: {
      name: 'RWA001',
      address: '0x10b2aA5D77Aa6484886d8e244f0686aB319a270d',
    },
    RWA002: {
      name: 'RWA002',
      address: '0xAAA760c2027817169D7C8DB0DC61A2fb4c19AC23',
    },
    RWA003: {
      name: 'RWA003',
      address: '0x07F0A80aD7AeB7BfB7f139EA71B3C8f7E17156B9',
    },
    RWA004: {
      name: 'RWA004',
      address: '0x873F2101047A62F84456E3B2B13df2287925D3F9',
    },
    RWA005: {
      name: 'RWA005',
      address: '0x6DB236515E90fC831D146f5829407746EDdc5296',
    },
    RWA006: {
      name: 'RWA006',
      address: '0x4EE03cfBF6E784c462839f5954d60f7C2B60b113',
    },
    STETH: {
      name: 'STETH',
      address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.STETH,
    },
    TUSD: {
      name: 'TUSD',
      address: '0x0000000000085d4780B73119b644AE5ecd22b376',
    },
    UNI: {
      name: 'UNI',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    },
    UNIV2AAVEETH: {
      name: 'UNIV2AAVEETH',
      address: '0xDFC14d2Af169B0D36C4EFF567Ada9b2E0CAE044f',
    },
    UNIV2DAIETH: {
      name: 'UNIV2DAIETH',
      address: '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
    },
    UNIV2DAIUSDC: {
      name: 'UNIV2DAIUSDC',
      address: '0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5',
    },
    UNIV2DAIUSDT: {
      name: 'UNIV2DAIUSDT',
      address: '0xB20bd5D04BE54f870D5C0d3cA85d82b34B836405',
    },
    UNIV2ETHUSDT: {
      name: 'UNIV2ETHUSDT',
      address: '0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852',
    },
    UNIV2LINKETH: {
      name: 'UNIV2LINKETH',
      address: '0xa2107FA5B38d9bbd2C461D6EDf11B11A50F6b974',
    },
    UNIV2UNIETH: {
      name: 'UNIV2UNIETH',
      address: '0xd3d2E2692501A5c9Ca623199D38826e513033a17',
    },
    UNIV2USDCETH: {
      name: 'UNIV2USDCETH',
      address: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',
    },
    UNIV2WBTCDAI: {
      name: 'UNIV2WBTCDAI',
      address: '0x231B7589426Ffe1b75405526fC32aC09D44364c4',
    },
    UNIV2WBTCETH: {
      name: 'UNIV2WBTCETH',
      address: '0xBb2b8038a1640196FbE3e38816F3e67Cba72D940',
    },
    USDC: {
      name: 'USDC',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.USDC,
    },
    USDT: {
      name: 'USDT',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
    WBTC: {
      name: 'WBTC',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WBTC,
    },
    WETH: {
      name: 'WETH',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WETH,
    },
    WSTETH: {
      name: 'WSTETH',
      address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WSTETH,
    },
    YFI: {
      name: 'YFI',
      address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    },
    ZRX: {
      name: 'ZRX',
      address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
    },
  },
  aave: {
    v2: {
      PriceOracle: {
        name: 'PriceOracle',
        address: '0xa50ba011c48153de246e5192c8f9258a2ba79ca9',
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.LENDING_POOL,
      },
      ProtocolDataProvider: {
        name: 'ProtocolDataProvider',
        address: '0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d',
      },
      WETHGateway: {
        name: 'WETHGateway',
        address: '0xcc9a0B7c43DC2a5F023Bb9b738E45B0Ef6B06E04',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.WETH_GATEWAY,
      },
    },
    v3: {
      AaveOracle: {
        name: 'AaveOracle',
        address: '0x54586bE62E3c3580375aE3723C145253060Ca0C2',
      },
      Pool: {
        name: 'Pool',
        address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.AAVE_POOL,
      },
      AavePoolDataProvider: {
        name: 'AavePoolDataProvider',
        address: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3',
      },
      L2Encoder: {
        name: 'L2Encoder',
        address: '0x0000000000000000000000000000000000000000',
      },
    },
  },
  maker: {
    common: {
      FlashMintModule: {
        name: 'FlashMintModule',
        address: '0x60744434d6339a6B27d73d9Eda62b6F66a0a04FA',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.maker.FLASH_MINT_MODULE,
      },
      Chainlog: {
        name: 'Chainlog',
        address: '0x60744434d6339a6B27d73d9Eda62b6F66a0a04FA',
      },
      CdpManager: {
        name: 'CdpManager',
        address: '0x5ef30b9986345249bc32d8928B7ee64DE9435E39',
      },
      GetCdps: {
        name: 'GetCdps',
        address: '0x36a724Bd100c39f0Ea4D3A20F7097eE01A8Ff573',
      },
      Jug: {
        name: 'Jug',
        address: '0x19c0976f590D67707E62397C87829d896Dc0f1F1',
      },
      Pot: {
        name: 'Pot',
        address: '0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7',
      },
      End: {
        name: 'End',
        address: '0xBB856d1742fD182a90239D7AE85706C2FE4e5922',
      },
      Spot: {
        name: 'Spot',
        address: '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3',
      },
      Dog: {
        name: 'Dog',
        address: '0x135954d155898D42C90D2a57824C690e0c7BEf1B',
      },
      Vat: {
        name: 'Vat',
        address: '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B',
      },
      McdGov: {
        name: 'McdGov',
        address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      },
    },
    joins: {
      MCD_JOIN_DAI: {
        name: 'MCD_JOIN_DAI',
        address: '0x9759A6Ac90977b93B58547b4A71c78317f391A28',
      },
      MCD_JOIN_ETH_A: {
        name: 'MCD_JOIN_ETH_A',
        address: '0x2F0b23f53734252Bda2277357e97e1517d6B042A',
      },
      MCD_JOIN_ETH_B: {
        name: 'MCD_JOIN_ETH_B',
        address: '0x08638eF1A205bE6762A8b935F5da9b700Cf7322c',
      },
      MCD_JOIN_ETH_C: {
        name: 'MCD_JOIN_ETH_C',
        address: '0xF04a5cC80B1E94C69B48f5ee68a08CD2F09A7c3E',
      },
      MCD_JOIN_BAT_A: {
        name: 'MCD_JOIN_BAT_A',
        address: '0x3D0B1912B66114d4096F48A8CEe3A56C231772cA',
      },
      MCD_JOIN_USDC_A: {
        name: 'MCD_JOIN_USDC_A',
        address: '0xA191e578a6736167326d05c119CE0c90849E84B7',
      },
      MCD_JOIN_USDC_B: {
        name: 'MCD_JOIN_USDC_B',
        address: '0x2600004fd1585f7270756DDc88aD9cfA10dD0428',
      },
      MCD_JOIN_PSM_USDC_A: {
        name: 'MCD_JOIN_PSM_USDC_A',
        address: '0x0A59649758aa4d66E25f08Dd01271e891fe52199',
      },
      MCD_JOIN_WBTC_A: {
        name: 'MCD_JOIN_WBTC_A',
        address: '0xBF72Da2Bd84c5170618Fbe5914B0ECA9638d5eb5',
      },
      MCD_JOIN_WBTC_B: {
        name: 'MCD_JOIN_WBTC_B',
        address: '0xfA8c996e158B80D77FbD0082BB437556A65B96E0',
      },
      MCD_JOIN_WBTC_C: {
        name: 'MCD_JOIN_WBTC_C',
        address: '0x7f62f9592b823331E012D3c5DdF2A7714CfB9de2',
      },
      MCD_JOIN_TUSD_A: {
        name: 'MCD_JOIN_TUSD_A',
        address: '0x4454aF7C8bb9463203b66C816220D41ED7837f44',
      },
      MCD_JOIN_ZRX_A: {
        name: 'MCD_JOIN_ZRX_A',
        address: '0xc7e8Cd72BDEe38865b4F5615956eF47ce1a7e5D0',
      },
      MCD_JOIN_KNC_A: {
        name: 'MCD_JOIN_KNC_A',
        address: '0x475F1a89C1ED844A08E8f6C50A00228b5E59E4A9',
      },
      MCD_JOIN_MANA_A: {
        name: 'MCD_JOIN_MANA_A',
        address: '0xA6EA3b9C04b8a38Ff5e224E7c3D6937ca44C0ef9',
      },
      MCD_JOIN_USDT_A: {
        name: 'MCD_JOIN_USDT_A',
        address: '0x0Ac6A1D74E84C2dF9063bDDc31699FF2a2BB22A2',
      },
      MCD_JOIN_PAXUSD_A: {
        name: 'MCD_JOIN_PAXUSD_A',
        address: '0x7e62B7E279DFC78DEB656E34D6a435cC08a44666',
      },
      MCD_JOIN_PSM_PAX_A: {
        name: 'MCD_JOIN_PSM_PAX_A',
        address: '0x7bbd8cA5e413bCa521C2c80D8d1908616894Cf21',
      },
      MCD_JOIN_COMP_A: {
        name: 'MCD_JOIN_COMP_A',
        address: '0xBEa7cDfB4b49EC154Ae1c0D731E4DC773A3265aA',
      },
      MCD_JOIN_LRC_A: {
        name: 'MCD_JOIN_LRC_A',
        address: '0x6C186404A7A238D3d6027C0299D1822c1cf5d8f1',
      },
      MCD_JOIN_LINK_A: {
        name: 'MCD_JOIN_LINK_A',
        address: '0xdFccAf8fDbD2F4805C174f856a317765B49E4a50',
      },
      MCD_JOIN_BAL_A: {
        name: 'MCD_JOIN_BAL_A',
        address: '0x4a03Aa7fb3973d8f0221B466EefB53D0aC195f55',
      },
      MCD_JOIN_YFI_A: {
        name: 'MCD_JOIN_YFI_A',
        address: '0x3ff33d9162aD47660083D7DC4bC02Fb231c81677',
      },
      MCD_JOIN_GUSD_A: {
        name: 'MCD_JOIN_GUSD_A',
        address: '0xe29A14bcDeA40d83675aa43B72dF07f649738C8b',
      },
      MCD_JOIN_PSM_GUSD_A: {
        name: 'MCD_JOIN_PSM_GUSD_A',
        address: '0x79A0FA989fb7ADf1F8e80C93ee605Ebb94F7c6A5',
      },
      MCD_JOIN_UNI_A: {
        name: 'MCD_JOIN_UNI_A',
        address: '0x3BC3A58b4FC1CbE7e98bB4aB7c99535e8bA9b8F1',
      },
      MCD_JOIN_RENBTC_A: {
        name: 'MCD_JOIN_RENBTC_A',
        address: '0xFD5608515A47C37afbA68960c1916b79af9491D0',
      },
      MCD_JOIN_AAVE_A: {
        name: 'MCD_JOIN_AAVE_A',
        address: '0x24e459F61cEAa7b1cE70Dbaea938940A7c5aD46e',
      },
      MCD_JOIN_MATIC_A: {
        name: 'MCD_JOIN_MATIC_A',
        address: '0x885f16e177d45fC9e7C87e1DA9fd47A9cfcE8E13',
      },
      MCD_JOIN_WSTETH_A: {
        name: 'MCD_JOIN_WSTETH_A',
        address: '0x10CD5fbe1b404B7E19Ef964B63939907bdaf42E2',
      },
      MCD_JOIN_WSTETH_B: {
        name: 'MCD_JOIN_WSTETH_B',
        address: '0x248cCBf4864221fC0E840F29BB042ad5bFC89B5c',
      },
      MCD_JOIN_DIRECT_AAVEV2_DAI: {
        name: 'MCD_JOIN_DIRECT_AAVEV2_DAI',
        address: '0xa13C0c8eB109F5A13c6c90FC26AFb23bEB3Fb04a',
      },
      MCD_JOIN_UNIV2DAIETH_A: {
        name: 'MCD_JOIN_UNIV2DAIETH_A',
        address: '0x2502F65D77cA13f183850b5f9272270454094A08',
      },
      MCD_JOIN_UNIV2WBTCETH_A: {
        name: 'MCD_JOIN_UNIV2WBTCETH_A',
        address: '0xDc26C9b7a8fe4F5dF648E314eC3E6Dc3694e6Dd2',
      },
      MCD_JOIN_UNIV2USDCETH_A: {
        name: 'MCD_JOIN_UNIV2USDCETH_A',
        address: '0x03Ae53B33FeeAc1222C3f372f32D37Ba95f0F099',
      },
      MCD_JOIN_UNIV2DAIUSDC_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDC_A',
        address: '0xA81598667AC561986b70ae11bBE2dd5348ed4327',
      },
      MCD_JOIN_UNIV2ETHUSDT_A: {
        name: 'MCD_JOIN_UNIV2ETHUSDT_A',
        address: '0x4aAD139a88D2dd5e7410b408593208523a3a891d',
      },
      MCD_JOIN_UNIV2LINKETH_A: {
        name: 'MCD_JOIN_UNIV2LINKETH_A',
        address: '0xDae88bDe1FB38cF39B6A02b595930A3449e593A6',
      },
      MCD_JOIN_UNIV2UNIETH_A: {
        name: 'MCD_JOIN_UNIV2UNIETH_A',
        address: '0xf11a98339FE1CdE648e8D1463310CE3ccC3d7cC1',
      },
      MCD_JOIN_UNIV2WBTCDAI_A: {
        name: 'MCD_JOIN_UNIV2WBTCDAI_A',
        address: '0xD40798267795Cbf3aeEA8E9F8DCbdBA9b5281fcC',
      },
      MCD_JOIN_UNIV2AAVEETH_A: {
        name: 'MCD_JOIN_UNIV2AAVEETH_A',
        address: '0x42AFd448Df7d96291551f1eFE1A590101afB1DfF',
      },
      MCD_JOIN_UNIV2DAIUSDT_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDT_A',
        address: '0xAf034D882169328CAf43b823a4083dABC7EEE0F4',
      },
      MCD_JOIN_GUNIV3DAIUSDC1_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC1_A',
        address: '0xbFD445A97e7459b0eBb34cfbd3245750Dba4d7a4',
      },
      MCD_JOIN_GUNIV3DAIUSDC2_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC2_A',
        address: '0xA7e4dDde3cBcEf122851A7C8F7A55f23c0Daf335',
      },
      MCD_JOIN_CRVV1ETHSTETH_A: {
        name: 'MCD_JOIN_CRVV1ETHSTETH_A',
        address: '0x82D8bfDB61404C796385f251654F6d7e92092b5D',
      },
      MCD_JOIN_RWA001_A: {
        name: 'MCD_JOIN_RWA001_A',
        address: '0x476b81c12Dc71EDfad1F64B9E07CaA60F4b156E2',
      },
      MCD_JOIN_RWA002_A: {
        name: 'MCD_JOIN_RWA002_A',
        address: '0xe72C7e90bc26c11d45dBeE736F0acf57fC5B7152',
      },
      MCD_JOIN_RWA003_A: {
        name: 'MCD_JOIN_RWA003_A',
        address: '0x1Fe789BBac5b141bdD795A3Bc5E12Af29dDB4b86',
      },
      MCD_JOIN_RWA004_A: {
        name: 'MCD_JOIN_RWA004_A',
        address: '0xD50a8e9369140539D1c2D113c4dC1e659c6242eB',
      },
      MCD_JOIN_RWA005_A: {
        name: 'MCD_JOIN_RWA005_A',
        address: '0xA4fD373b93aD8e054970A3d6cd4Fd4C31D08192e',
      },
      MCD_JOIN_RWA006_A: {
        name: 'MCD_JOIN_RWA006_A',
        address: '0x5E11E34b6745FeBa9449Ae53c185413d6EdC66BE',
      },
      MCD_JOIN_RETH_A: {
        name: 'MCD_JOIN_RETH_A',
        address: '0xc6424e862f1462281b0a5fac078e4b63006bdebf',
      },
      MCD_JOIN_GNO_A: {
        name: 'MCD_JOIN_GNO_A',
        address: '0x7bD3f01e24E0f0838788bC8f573CEA43A80CaBB5',
      },
    },
    pips: {
      PIP_ETH: {
        name: 'PIP_ETH',
        address: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
      },
      PIP_BAT: {
        name: 'PIP_BAT',
        address: '0xB4eb54AF9Cc7882DF0121d26c5b97E802915ABe6',
      },
      PIP_USDC: {
        name: 'PIP_USDC',
        address: '0x77b68899b99b686F415d074278a9a16b336085A0',
      },
      PIP_WBTC: {
        name: 'PIP_WBTC',
        address: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
      },
      PIP_TUSD: {
        name: 'PIP_TUSD',
        address: '0xeE13831ca96d191B688A670D47173694ba98f1e5',
      },
      PIP_ZRX: {
        name: 'PIP_ZRX',
        address: '0x7382c066801E7Acb2299aC8562847B9883f5CD3c',
      },
      PIP_KNC: {
        name: 'PIP_KNC',
        address: '0xf36B79BD4C0904A5F350F1e4f776B81208c13069',
      },
      PIP_MANA: {
        name: 'PIP_MANA',
        address: '0x8067259EA630601f319FccE477977E55C6078C13',
      },
      PIP_USDT: {
        name: 'PIP_USDT',
        address: '0x7a5918670B0C390aD25f7beE908c1ACc2d314A3C',
      },
      PIP_PAXUSD: {
        name: 'PIP_PAXUSD',
        address: '0x043B963E1B2214eC90046167Ea29C2c8bDD7c0eC',
      },
      PIP_PAX: {
        name: 'PIP_PAX',
        address: '0x043B963E1B2214eC90046167Ea29C2c8bDD7c0eC',
      },
      PIP_COMP: {
        name: 'PIP_COMP',
        address: '0xBED0879953E633135a48a157718Aa791AC0108E4',
      },
      PIP_LRC: {
        name: 'PIP_LRC',
        address: '0x9eb923339c24c40Bef2f4AF4961742AA7C23EF3a',
      },
      PIP_LINK: {
        name: 'PIP_LINK',
        address: '0x9B0C694C6939b5EA9584e9b61C7815E8d97D9cC7',
      },
      PIP_BAL: {
        name: 'PIP_BAL',
        address: '0x3ff860c0F28D69F392543A16A397D0dAe85D16dE',
      },
      PIP_YFI: {
        name: 'PIP_YFI',
        address: '0x5F122465bCf86F45922036970Be6DD7F58820214',
      },
      PIP_GUSD: {
        name: 'PIP_GUSD',
        address: '0xf45Ae69CcA1b9B043dAE2C83A5B65Bc605BEc5F5',
      },
      PIP_UNI: {
        name: 'PIP_UNI',
        address: '0xf363c7e351C96b910b92b45d34190650df4aE8e7',
      },
      PIP_RENBTC: {
        name: 'PIP_RENBTC',
        address: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
      },
      PIP_AAVE: {
        name: 'PIP_AAVE',
        address: '0x8Df8f06DC2dE0434db40dcBb32a82A104218754c',
      },
      PIP_MATIC: {
        name: 'PIP_MATIC',
        address: '0x8874964279302e6d4e523Fb1789981C39a1034Ba',
      },
      PIP_WSTETH: {
        name: 'PIP_WSTETH',
        address: '0xFe7a2aC0B945f12089aEEB6eCebf4F384D9f043F',
      },
      PIP_ADAI: {
        name: 'PIP_ADAI',
        address: '0x6A858592fC4cBdf432Fc9A1Bc8A0422B99330bdF',
      },
      PIP_UNIV2DAIETH: {
        name: 'PIP_UNIV2DAIETH',
        address: '0xFc8137E1a45BAF0030563EC4F0F851bd36a85b7D',
      },
      PIP_UNIV2WBTCETH: {
        name: 'PIP_UNIV2WBTCETH',
        address: '0x8400D2EDb8B97f780356Ef602b1BdBc082c2aD07',
      },
      PIP_UNIV2USDCETH: {
        name: 'PIP_UNIV2USDCETH',
        address: '0xf751f24DD9cfAd885984D1bA68860F558D21E52A',
      },
      PIP_UNIV2DAIUSDC: {
        name: 'PIP_UNIV2DAIUSDC',
        address: '0x25D03C2C928ADE19ff9f4FFECc07d991d0df054B',
      },
      PIP_UNIV2ETHUSDT: {
        name: 'PIP_UNIV2ETHUSDT',
        address: '0x5f6dD5B421B8d92c59dC6D907C9271b1DBFE3016',
      },
      PIP_UNIV2LINKETH: {
        name: 'PIP_UNIV2LINKETH',
        address: '0xd7d31e62AE5bfC3bfaa24Eda33e8c32D31a1746F',
      },
      PIP_UNIV2UNIETH: {
        name: 'PIP_UNIV2UNIETH',
        address: '0x8462A88f50122782Cc96108F476deDB12248f931',
      },
      PIP_UNIV2WBTCDAI: {
        name: 'PIP_UNIV2WBTCDAI',
        address: '0x5bB72127a196392cf4aC00Cf57aB278394d24e55',
      },
      PIP_UNIV2AAVEETH: {
        name: 'PIP_UNIV2AAVEETH',
        address: '0x32d8416e8538Ac36272c44b0cd962cD7E0198489',
      },
      PIP_UNIV2DAIUSDT: {
        name: 'PIP_UNIV2DAIUSDT',
        address: '0x9A1CD705dc7ac64B50777BcEcA3529E58B1292F1',
      },
      PIP_GUNIV3DAIUSDC1: {
        name: 'PIP_GUNIV3DAIUSDC1',
        address: '0x7F6d78CC0040c87943a0e0c140De3F77a273bd58',
      },
      PIP_GUNIV3DAIUSDC2: {
        name: 'PIP_GUNIV3DAIUSDC2',
        address: '0xcCBa43231aC6eceBd1278B90c3a44711a00F4e93',
      },
      PIP_CRVV1ETHSTETH: {
        name: 'PIP_CRVV1ETHSTETH',
        address: '0xEa508F82728927454bd3ce853171b0e2705880D4',
      },
      PIP_RWA001: {
        name: 'PIP_RWA001',
        address: '0x76A9f30B45F4ebFD60Ce8a1c6e963b1605f7cB6d',
      },
      PIP_RWA002: {
        name: 'PIP_RWA002',
        address: '0xd2473237E20Bd52F8E7cE0FD79403A6a82fbAEC8',
      },
      PIP_RWA003: {
        name: 'PIP_RWA003',
        address: '0xDeF7E88447F7D129420FC881B2a854ABB52B73B8',
      },
      PIP_RWA004: {
        name: 'PIP_RWA004',
        address: '0x5eEE1F3d14850332A75324514CcbD2DBC8Bbc566',
      },
      PIP_RWA005: {
        name: 'PIP_RWA005',
        address: '0x8E6039C558738eb136833aB50271ae065c700d2B',
      },
      PIP_RWA006: {
        name: 'PIP_RWA006',
        address: '0xB8AeCF04Fdf22Ef6C0c6b6536896e1F2870C41D3',
      },
      PIP_RETH: {
        name: 'PIP_RETH',
        address: '0xee7f0b350aa119b3d05dc733a4621a81972f7d47',
      },
      PIP_GNO: {
        name: 'PIP_GNO',
        address: '0xd800ca44fFABecd159c7889c3bf64a217361AEc8',
      },
      PIP_WETH: {
        name: 'PIP_WETH',
        address: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
      },
    },
  },
  automation: {
    AutomationBot: {
      name: 'AutomationBot',
      address: '0x6E87a7A0A03E51A741075fDf4D1FCce39a4Df01b',
    },
    AutomationBotV2: {
      name: 'AutomationBotV2',
      address: '0x8061c24823094E51e57A4a5cF8bEd3CCf09d316F',
    },
    AutomationBotAggregator: {
      name: 'AutomationBotAggregator',
      address: '0x5f1d184204775fBB351C4b2C61a2fD4aAbd3fB76',
    },
  },
  ajna: {
    AjnaPoolInfo: {
      name: 'AjnaPoolInfo',
      address: '0x658Bc3CebaA129e652c0baC2c1dfb866413d999D',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.AJNA_POOL_UTILS_INFO,
    },
    AjnaProxyActions: {
      name: 'AjnaProxyActions',
      address: '0x48C4d4B2e8340045f3Dc0a4e271f236e217f44Be',
    },
    AjnaPoolPairs_WBTCUSDC: {
      name: 'AjnaPoolPairs_WBTCUSDC',
      address: '0x0D74bEf3CA8FC936C6E1Ff21acc94fB85dC5d3b1',
    },
    AjnaPoolPairs_ETHUSDC: {
      name: 'AjnaPoolPairs_ETHUSDC',
      address: '0x9B260a1b450f425198a81b13C49c80113424dCC8',
    },
    AjnaPoolPairs_WSTETHDAI: { name: 'AjnaPoolPairs_WSTETHDAI', address: '' },
    AjnaPoolPairs_RETHDAI: { name: 'AjnaPoolPairs_RETHDAI', address: '' },
    AjnaPoolPairs_WBTCDAI: { name: 'AjnaPoolPairs_WBTCDAI', address: '' },
    AjnaPoolPairs_USDCETH: { name: 'AjnaPoolPairs_USDCETH', address: '' },
    AjnaPoolPairs_USDCWBTC: { name: 'AjnaPoolPairs_USDCWBTC', address: '' },
    AjnaPoolPairs_USDCDAI: { name: 'AjnaPoolPairs_USDCDAI', address: '' },
    AjnaRewardsManager: {
      name: 'AjnaRewardsManager',
      address: '0x71047d50310733fA46215e2b36eE1B9DA0B2B70A',
    },
    AjnaRewardsClaimer: { name: 'AjnaRewardsClaimer', address: '' },
    ERC20PoolFactory: {
      name: 'ERC20PoolFactory',
      address: '0xEE5842A5CeC7aD2A9c168122943Cbe43E201b6a9',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.ERC20_POOL_FACTORY,
    },
  },
}
