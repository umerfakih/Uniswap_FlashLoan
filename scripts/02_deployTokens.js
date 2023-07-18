async function main() {
    const [owner, signer2] = await ethers.getSigners();
  
    Tether = await ethers.getContractFactory('Tether', owner);
    tether = await Tether.deploy();
  
    Usdc = await ethers.getContractFactory('UsdCoin', owner);
    usdc = await Usdc.deploy();
  
    await tether.connect(owner).mint(
      owner.address,
      ethers.utils.parseEther('100000')
    )
    await usdc.connect(owner).mint(
      owner.address,
      ethers.utils.parseEther('100000')
    )
  
    console.log('TETHER_ADDRESS=', `'${tether.address}'`)
    console.log('USDC_ADDRESS=', `'${usdc.address}'`)
    saveAddress(tether, 'Tether')
    saveAddress(usdc, 'UsdCoin')
    
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
  npx hardhat run --network localhost scripts/02_deployTokens.js
  */
  
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });