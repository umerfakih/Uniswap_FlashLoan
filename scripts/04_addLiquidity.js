// Uniswap contract addresses
const WETH_ADDRESS= require("../contractAddress/WETH-address.json").address
const FACTORY_ADDRESS= require("../contractAddress/factory-address.json").address
const SWAP_ROUTER_ADDRESS= require("../contractAddress/SwapRouter-address.json").address
const NFT_DESCRIPTOR_ADDRESS= require("../contractAddress/NFTDescriptor-address.json").address
const POSITION_DESCRIPTOR_ADDRESS= require("../contractAddress/NonfungibleTokenPositionDescriptor-address.json").address
const POSITION_MANAGER_ADDRESS= require("../contractAddress/NonfungiblePositionManager-address.json").address

// Pool addresses
const USDT_USDC_500= require("../contractAddress/USDT_USDC_500-address.json").address
const USDT_USDC_3000= require("../contractAddress/USDT_USDC_3000-address.json").address
const USDT_USDC_10000= require("../contractAddress/USDT_USDC_10000-address.json").address

// Token addresses
const TETHER_ADDRESS= require("../contractAddress/Tether-address.json").address
const USDC_ADDRESS= require("../contractAddress/UsdCoin-address.json").address

const artifacts = {
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  Usdt: require("../artifacts/contracts/Tether.sol/Tether.json"),
  Usdc: require("../artifacts/contracts/UsdCoin.sol/UsdCoin.json"),
  UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};

const { Contract } = require("ethers")
const { Token } = require('@uniswap/sdk-core')
const { Pool, Position, nearestUsableTick } = require('@uniswap/v3-sdk')

async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ])

  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  }
}

LIQUIDITY = ethers.utils.parseEther('100')
DEADLINE = Math.floor(Date.now() / 1000) + (60 * 10)
POOL_ADDRESSES = [USDT_USDC_500, USDT_USDC_3000, USDT_USDC_10000] // ,


async function main() {
  const [owner, signer2] = await ethers.getSigners();
  const provider = waffle.provider;

  const nonfungiblePositionManager = new Contract(
    POSITION_MANAGER_ADDRESS,
    artifacts.NonfungiblePositionManager.abi,
    provider
  )
  const usdtContract = new Contract(TETHER_ADDRESS,artifacts.Usdt.abi,provider)
  const usdcContract = new Contract(USDC_ADDRESS,artifacts.Usdc.abi,provider)

  await usdtContract.connect(owner).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther('9999999'))
  await usdcContract.connect(owner).approve(POSITION_MANAGER_ADDRESS, ethers.utils.parseEther('9999999'))

  const UsdtToken = new Token(31337, TETHER_ADDRESS, 18, 'USDT', 'Tether')
  const UsdcToken = new Token(31337, USDC_ADDRESS, 18, 'USDC', 'UsdCoin')

  const poolContract1 = new Contract(USDT_USDC_500, artifacts.UniswapV3Pool.abi, provider)
  const poolContract2 = new Contract(USDT_USDC_3000, artifacts.UniswapV3Pool.abi, provider)
  const poolContract3 = new Contract(USDT_USDC_10000, artifacts.UniswapV3Pool.abi, provider)

  const poolData = {}
  poolData[USDT_USDC_500] = await getPoolData(poolContract1)
  poolData[USDT_USDC_3000] = await getPoolData(poolContract2)
  poolData[USDT_USDC_10000] = await getPoolData(poolContract3)

  // appears I cannot interact with contracts in the async map
  const mintParams = {}
  POOL_ADDRESSES.map(async poolAddress => {
    pd = poolData[poolAddress]

    const poolObj = new Pool(
      UsdtToken,
      UsdcToken,
      pd.fee,
      pd.sqrtPriceX96.toString(),
      pd.liquidity.toString(),
      pd.tick
    )

    const tickLower = nearestUsableTick(pd.tick, pd.tickSpacing) - pd.tickSpacing * 100
    const tickUpper = nearestUsableTick(pd.tick, pd.tickSpacing) + pd.tickSpacing * 100

    const positionObj = new Position({
      pool: poolObj,
      liquidity: LIQUIDITY,
      tickLower: tickLower,
      tickUpper: tickUpper,
    })

    const { amount0: amount0Desired, amount1: amount1Desired} = positionObj.mintAmounts
    const params = {
      token0: TETHER_ADDRESS,
      token1: USDC_ADDRESS,
      fee: pd.fee,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amount0Desired.toString(),
      amount1Desired: amount1Desired.toString(),
      amount0Min: 0,
      amount1Min: 0,
      recipient: signer2.address,
      deadline: DEADLINE
    }

    mintParams[poolAddress] = params
  })

  const tx1 = await nonfungiblePositionManager.connect(owner).mint(mintParams[USDT_USDC_500], { gasLimit: '1000000' })
  await tx1.wait()

  const tx2 = await nonfungiblePositionManager.connect(owner).mint(mintParams[USDT_USDC_3000], { gasLimit: '1000000' })
  await tx2.wait()

  const tx3 = await nonfungiblePositionManager.connect(owner).mint(mintParams[USDT_USDC_10000], { gasLimit: '1000000' })
  await tx3.wait()
  console.log('done')
}

/*
npx hardhat run --network localhost scripts/04_addLiquidity.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });