/**
 * @title Uniswap V2 Interaction Script
 * @notice Helper script to interact with deployed Uniswap V2 contracts
 * @dev Run with: npx hardhat run scripts/interactUniswapV2.js --network arcTestnet

 */

const hre = require("hardhat");

const DEPLOYED_ADDRESSES = {
    factory: "0xcF2A034DC82d0cd345957F714548Ccc907f111B0",
    router: "0x27834E00671694cdF49cb1F3eE99f0c7587B39f5",
    weth: "0xc3180F43bAA0956e55a046DFdFA5Fa64A3E2eE82",
};
export const UNISWAP_V2_ADDRESSES = {
    FACTORY: '0xcF2A034DC82d0cd345957F714548Ccc907f111B0', // From deployment output
    ROUTER: '0x27834E00671694cdF49cb1F3eE99f0c7587B39f5',  // From deployment output
    WETH: '0xc3180F43bAA0956e55a046DFdFA5Fa64A3E2eE82',    // From deployment output
};

async function main() {
    const [signer] = await hre.ethers.getSigners();

    console.log("=".repeat(80));
    console.log("UNISWAP V2 INTERACTION SCRIPT");
    console.log("=".repeat(80));
    console.log("\nConnected account:", signer.address);

    // Check if addresses are updated
    if (UNISWAP_V2_ADDRESSES.FACTORY === "0x27834E00671694cdF49cb1F3eE99f0c7587B39f5") {
        console.log("\n⚠️  WARNING: Please update the DEPLOYED_ADDRESSES in this script!");
        console.log("Update the addresses at the top of scripts/interactUniswapV2.js\n");
        return;
    }

    // ============================================================================
    // Connect to deployed contracts
    // ============================================================================
    console.log("\n📡 Connecting to deployed contracts...");
    console.log("-".repeat(80));

    const factory = await hre.ethers.getContractAt(
        "@uniswap/v2-core/contracts/UniswapV2Factory.sol:UniswapV2Factory",
        UNISWAP_V2_ADDRESSES.FACTORY
    );

    const router = await hre.ethers.getContractAt(
        "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol:UniswapV2Router02",
        UNISWAP_V2_ADDRESSES.ROUTER
    );
    console.log("✅ Connected to Router:", UNISWAP_V2_ADDRESSES.ROUTER);
    const weth = await hre.ethers.getContractAt(
        "MockWETH",
        UNISWAP_V2_ADDRESSES.WETH
    );

    console.log("✅ Connected to Factory:", UNISWAP_V2_ADDRESSES.FACTORY);
    console.log("✅ Connected to Router:", UNISWAP_V2_ADDRESSES.ROUTER);
    console.log("✅ Connected to WETH:", UNISWAP_V2_ADDRESSES.WETH);

    // ============================================================================
    // Factory Information
    // ============================================================================
    console.log("\n📦 FACTORY INFORMATION");
    console.log("-".repeat(80));

    const feeToSetter = await factory.feeToSetter();
    const feeTo = await factory.feeTo();
    const allPairsLength = await factory.allPairsLength();

    console.log("Fee To Setter:", feeToSetter);
    console.log("Fee To:", feeTo);
    console.log("Total Pairs Created:", allPairsLength.toString());

    // List all pairs if any exist
    if (allPairsLength > 0) {
        console.log("\n📋 Created Pairs:");
        for (let i = 0; i < allPairsLength; i++) {
            const pairAddress = await factory.allPairs(i);
            console.log(`  Pair ${i}:`, pairAddress);

            // Get pair details
            const pair = await hre.ethers.getContractAt(
                "@uniswap/v2-core/contracts/UniswapV2Pair.sol:UniswapV2Pair",
                pairAddress
            );

            const token0 = await pair.token0();
            const token1 = await pair.token1();
            const reserves = await pair.getReserves();

            console.log(`    Token0: ${token0}`);
            console.log(`    Token1: ${token1}`);
            console.log(`    Reserve0: ${reserves[0].toString()}`);
            console.log(`    Reserve1: ${reserves[1].toString()}`);
        }
    }

    // ============================================================================
    // Router Information
    // ============================================================================
    console.log("\n🔀 ROUTER INFORMATION");
    console.log("-".repeat(80));

    const routerFactory = await router.factory();
    const routerWETH = await router.WETH();

    console.log("Router Factory:", routerFactory);
    console.log("Router WETH:", routerWETH);
    console.log("Factory Match:", routerFactory === DEPLOYED_ADDRESSES.factory ? "✅" : "❌");
    console.log("WETH Match:", routerWETH === DEPLOYED_ADDRESSES.weth ? "✅" : "❌");

    // ============================================================================
    // WETH Information
    // ============================================================================
    console.log("\n💎 WETH INFORMATION");
    console.log("-".repeat(80));

    const wethName = await weth.name();
    const wethSymbol = await weth.symbol();
    const wethDecimals = await weth.decimals();
    const wethTotalSupply = await weth.totalSupply();
    const wethBalance = await weth.balanceOf(signer.address);

    console.log("Name:", wethName);
    console.log("Symbol:", wethSymbol);
    console.log("Decimals:", wethDecimals);
    console.log("Total Supply:", hre.ethers.formatEther(wethTotalSupply), "WETH");
    console.log("Your Balance:", hre.ethers.formatEther(wethBalance), "WETH");

    // ============================================================================
    // Helper Functions
    // ============================================================================
    console.log("\n🛠️  HELPER FUNCTIONS");
    console.log("-".repeat(80));
    console.log("\nTo get a pair address for two tokens:");
    console.log("const pairAddress = await factory.getPair(token0Address, token1Address);");

    console.log("\nTo create a new pair:");
    console.log("const tx = await factory.createPair(token0Address, token1Address);");
    console.log("await tx.wait();");

    console.log("\nTo add liquidity:");
    console.log("// 1. Approve tokens");
    console.log("await token0.approve(routerAddress, amount0);");
    console.log("await token1.approve(routerAddress, amount1);");
    console.log("// 2. Add liquidity");
    console.log("await router.addLiquidity(");
    console.log("  token0Address, token1Address,");
    console.log("  amount0, amount1,");
    console.log("  minAmount0, minAmount1,");
    console.log("  toAddress, deadline");
    console.log(");");

    console.log("\n" + "=".repeat(80));
    console.log("✨ INTERACTION COMPLETE!");
    console.log("=".repeat(80) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:");
        console.error(error);
        process.exit(1);
    });
