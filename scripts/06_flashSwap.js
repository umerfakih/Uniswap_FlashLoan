const { Contract } = require("ethers")
const { ethers } = require("hardhat")

const weiToEth = (wei)=> ethers.utils.parseEther(wei.toString())

// Uniswap contract address
const WETH_ADDRESS= require("../contractAddress/WETH-address.json").address
const FACTORY_ADDRESS= require("../contractAddress/factory-address.json").address
const SWAP_ROUTER_ADDRESS= require("../contractAddress/SwapRouter-address.json").address
const NFT_DESCRIPTOR_ADDRESS= require("../contractAddress/NFTDescriptor-address.json").address
const POSITION_DESCRIPTOR_ADDRESS= require("../contractAddress/NonfungibleTokenPositionDescriptor-address.json").address
const POSITION_MANAGER_ADDRESS= require("../contractAddress/NonfungiblePositionManager-address.json").address

// Token addresses
const TETHER_ADDRESS= require("../contractAddress/Tether-address.json").address
const USDC_ADDRESS= require("../contractAddress/UsdCoin-address.json").address

const WETH9 = require("../WETH9.json")
const artifacts = {
  UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
  SwapRouter: require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json"),
  NFTDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json"),
  NonfungibleTokenPositionDescriptor: require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json"),
  NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
  Usdt: require("../artifacts/contracts/Tether.sol/Tether.json"),
  Usdc: require("../artifacts/contracts/UsdCoin.sol/UsdCoin.json"),
  WETH9,
};

const toEth = (wei) => ethers.utils.formatEther(wei)

async function main() {
  const provider = waffle.provider;
  const [owner, signer2] = await ethers.getSigners();

  Flash = await ethers.getContractFactory('PairFlash', signer2);
  flash = await Flash.deploy(SWAP_ROUTER_ADDRESS, FACTORY_ADDRESS, WETH_ADDRESS);
  console.log('flash', flash.address)

  const usdtContract = new Contract(TETHER_ADDRESS,artifacts.Usdt.abi,provider)
  const usdcContract = new Contract(USDC_ADDRESS,artifacts.Usdc.abi,provider)

  let usdtBalance = await usdtContract.connect(provider).balanceOf(signer2.address)
  let usdcBalance = await usdcContract.connect(provider).balanceOf(signer2.address)
  console.log('-------------------- BEFORE')
  console.log('usdtBalance', toEth(usdtBalance.toString()))
  console.log('usdcBalance', toEth(usdcBalance.toString()))
  console.log('--------------------')

  const tx = await flash.connect(signer2).initFlash(
    [
      TETHER_ADDRESS,
      USDC_ADDRESS,
      500,
      weiToEth(3),
      weiToEth(5),
      3000,
      10000
    ],
    { gasLimit: ethers.utils.hexlify(1000000) }
  );
  await tx.wait()

  usdtBalance = await usdtContract.connect(provider).balanceOf(signer2.address)
  usdcBalance = await usdcContract.connect(provider).balanceOf(signer2.address)
  console.log('-------------------- AFTER')
  console.log('usdtBalance', toEth(usdtBalance.toString()))
  console.log('usdcBalance', toEth(usdcBalance.toString()))
  console.log('--------------------')
}

/*
npx hardhat run --network localhost scripts/06_flashSwap.js
*/

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });