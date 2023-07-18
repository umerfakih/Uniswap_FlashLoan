// pool
const USDT_USDC_500= require("../contractAddress/USDT_USDC_500-address.json").address
const USDT_USDC_3000= require("../contractAddress/USDT_USDC_3000-address.json").address
const USDT_USDC_10000= require("../contractAddress/USDT_USDC_10000-address.json").address

const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json")
const { Contract, BigNumber } = require("ethers")

async function getPoolData(poolContract) {
  const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
    poolContract.tickSpacing(),
    poolContract.fee(),
    poolContract.liquidity(),
    poolContract.slot0(),
  ])

  const sqrtPriceX96 = slot0[0]
  const numerator = BigNumber.from(sqrtPriceX96).pow(2)
  const denominator = BigNumber.from(2).pow(192)

  const priceRatio = numerator/denominator
  return {
    tickSpacing: tickSpacing,
    fee: fee,
    liquidity: liquidity.toString(),
    sqrtPriceX96: sqrtPriceX96.toString(),
    priceRatio: priceRatio.toString(),
    tick: slot0[1],
  }
}


async function main() {
  const provider = waffle.provider;

  const poolContract500 = new Contract(USDT_USDC_500, UniswapV3Pool.abi, provider)
  const poolData500 = await getPoolData(poolContract500)
  console.log('poolData500', poolData500)

  const poolContract3000 = new Contract(USDT_USDC_3000, UniswapV3Pool.abi, provider)
  const poolData3000 = await getPoolData(poolContract3000)
  console.log('poolData3000', poolData3000)

  const poolContract10000 = new Contract(USDT_USDC_10000, UniswapV3Pool.abi, provider)
  const poolData10000 = await getPoolData(poolContract10000)
  console.log('poolData10000', poolData10000)
}

/*
npx hardhat run --network localhost scripts/05_checkLiquidity.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });