/**
 * @title Swap Contract Deployment Script
 * @notice Deploys SwapFactory and SwapRouter contracts
 * @dev Run with: npx hardhat run scripts/deploy.js --network <network>
 */

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // v6: getBalance works directly on the provider
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // --- Deploy SwapFactory ---
  console.log("\n1. Deploying SwapFactory...");
  const SwapFactory = await hre.ethers.getContractFactory("SwapFactory");
  const feeToSetter = deployer.address;
  
  // FIX: In v6, .deploy() returns the contract instance directly, not a transaction wrapper
  const factory = await SwapFactory.deploy(feeToSetter);
  console.log("Factory deployment initiated, waiting for confirmation...");
  
  // FIX: Use waitForDeployment() instead of deployTransaction.wait()
  await factory.waitForDeployment();
  
  // FIX: Use .target instead of .address
  const factoryAddress = factory.target;
  
  console.log("SwapFactory deployed to:", factoryAddress);
  
  // Note: 'factory' is already the contract instance, no need to .attach() again

  // --- Deploy SwapRouter ---
  console.log("\n2. Deploying SwapRouter...");
  const SwapRouter = await hre.ethers.getContractFactory("SwapRouter");
  const feeRecipient = deployer.address;
  const swapFeeBps = 30;
  
  const router = await SwapRouter.deploy(
    factoryAddress,
    feeRecipient,
    swapFeeBps
  );
  console.log("Router deployment initiated, waiting for confirmation...");
  
  // FIX: Use waitForDeployment()
  await router.waitForDeployment();
  const routerAddress = router.target;
  
  console.log("SwapRouter deployed to:", routerAddress);

  // --- Verify deployment ---
  console.log("\n3. Verifying deployment...");
  // specific getters might vary based on your solidity code, assuming these exist:
  const factoryAddressFromRouter = await router.factory();
  const routerFee = await router.swapFeeBps();
  const routerFeeRecipient = await router.feeRecipient();

  console.log("Factory address (from router):", factoryAddressFromRouter);
  console.log("Swap fee (bps):", routerFee.toString());
  console.log("Fee recipient:", routerFeeRecipient);

  // --- Save deployment addresses ---
  const network = await hre.ethers.provider.getNetwork();
  
  const deploymentInfo = {
    network: hre.network.name,
    chainId: network.chainId.toString(), // FIX: Convert BigInt to string to avoid JSON errors
    factory: factoryAddress,
    router: routerAddress,
    feeRecipient: feeRecipient,
    swapFeeBps: swapFeeBps,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n4. Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Instructions
  console.log("\n5. Next Steps:");
  console.log("- Update contract addresses in src/config/contracts.js");
  console.log("- Verify contracts on block explorer");
  console.log("- Create initial liquidity pools");
  console.log("- Test swap functionality");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });