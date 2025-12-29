// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract StacSwap {
    ISwapRouter public constant swapRouter = ISwapRouter(0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E); // Uniswap V3 Router on Sepolia

    // Official Circle Mintable Token Addresses on Sepolia
    // verify these at developers.circle.com as they can update
    address public constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; 
    address public constant EURC = 0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4;

    // Fee tier for stablecoin pairs is usually 0.05% (500) or 0.01% (100)
    // On testnet, we often use 1000 (0.1%) if that's where liquidity was added.
    uint24 public constant poolFee = 10000;
    event SwapExecuted(address indexed user, uint256 amountIn, uint256 amountOut);

    /**
     * @notice Swaps USDC for EURC
     * @param amountIn The amount of USDC to swap
     * @return amountOut The amount of EURC received
     */
    function swapUSDCForEURC(uint256 amountIn) external returns (uint256 amountOut) {
        // 1. Transfer USDC from user to this contract
        // User must have approved this contract to spend their USDC first!
        TransferHelper.safeTransferFrom(USDC, msg.sender, address(this), amountIn);

        // 2. Approve Uniswap Router to spend USDC held by this contract
        TransferHelper.safeApprove(USDC, address(swapRouter), amountIn);

        // 3. Define the swap parameters
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: USDC,
                tokenOut: EURC,
                fee: poolFee,
                recipient: msg.sender, // Send EURC directly back to user
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0, // In prod, calculate this via Oracle/Quoter to avoid slippage!
                sqrtPriceLimitX96: 0
            });

        // 4. Execute the swap
        amountOut = swapRouter.exactInputSingle(params);
        
        emit SwapExecuted(msg.sender, amountIn, amountOut);
    }
}