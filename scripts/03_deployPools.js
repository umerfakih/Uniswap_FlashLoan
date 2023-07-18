// Token addresses
const TETHER_ADDRESS= require("../contractAddress/Tether-address.json").address
const USDC_ADDRESS= require("../contractAddress/UsdCoin-address.json").address

// Uniswap contract address
const WETH_ADDRESS= require("../contractAddress/WETH-address.json").address
const FACTORY_ADDRESS= require("../contractAddress/factory-address.json").address
const SWAP_ROUTER_ADDRESS= require("../contractAddress/SwapRouter-address.json").address
const NFT_DESCRIPTOR_ADDRESS= require("../contractAddress/NFTDescriptor-address.json").address
const POSITION_DESCRIPTOR_ADDRESS= require("../contractAddress/NonfungibleTokenPositionDescriptor-address.json").address
const POSITION_MANAGER_ADDRESS= require("../contractAddress/NonfungiblePositionManager-address.json").address

const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

const { Contract, BigNumber } = require("ethers")
const bn = require('bignumber.js')
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })

const provider = waffle.provider;

function encodePriceSqrt(reserve1, reserve0) {
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  )
}

const nonfungiblePositionManager = new Contract(
  POSITION_MANAGER_ADDRESS,
  artifacts.NonfungiblePositionManager.abi,
  provider
)
const factory = new Contract(
  FACTORY_ADDRESS,
  artifacts.UniswapV3Factory.abi,
  provider
)

async function deployPool(token0, token1, fee, price) {
  const [owner] = await ethers.getSigners();
  await nonfungiblePositionManager.connect(owner).createAndInitializePoolIfNecessary(
    token0,
    token1,
    fee,
    price,
    { gasLimit: 5000000 }
  )
  const poolAddress = await factory.connect(owner).getPool(
    token0,
    token1,
    fee,
  )
  return poolAddress
}


async function main() {
  const usdtUsdc500 = await deployPool(TETHER_ADDRESS, USDC_ADDRESS, 500, encodePriceSqrt(1, 1))
  const usdtUsdc3000 = await deployPool(TETHER_ADDRESS, USDC_ADDRESS, 3000, encodePriceSqrt(1, 2))
  const usdtUsdc10000 = await deployPool(TETHER_ADDRESS, USDC_ADDRESS, 10000, encodePriceSqrt(2, 1))

  console.log('USDT_USDC_500=', `'${usdtUsdc500}'`)
  console.log('USDT_USDC_3000=', `'${usdtUsdc3000}'`)
  console.log('USDT_USDC_10000=', `'${usdtUsdc10000}'`)

  saveAddress({ address: usdtUsdc500 }, "USDT_USDC_500")
  saveAddress({ address: usdtUsdc3000 }, "USDT_USDC_3000")
  saveAddress({ address: usdtUsdc10000 }, "USDT_USDC_10000")
}

function saveAddress(contract, name) {
  const fs = require("fs");
  const addressDir = __dirname + "/../contractAddress";

  if (!fs.existsSync(addressDir)) {
    fs.mkdirSync(addressDir);
  }

  fs.writeFileSync(
    addressDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );
}

/*
npx hardhat run --network localhost scripts/03_deployPools.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });