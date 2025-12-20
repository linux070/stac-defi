// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ISwapRouter
 * @notice Interface for the Swap Router contract
 */
interface ISwapRouter {
    // ============ Events ============
    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address to,
        uint256 timestamp
    );

    // ============ Functions ============

    /**
     * @notice Swaps an exact amount of input tokens for as many output tokens as possible
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /**
     * @notice Swaps tokens for an exact amount of output tokens
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /**
     * @notice Returns the amounts out for a given amount in
     */
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);

    /**
     * @notice Returns the amounts in for a given amount out
     */
    function getAmountsIn(uint256 amountOut, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);

    /**
     * @notice Returns the factory address
     */
    function factory() external view returns (address);

    /**
     * @notice Returns the swap fee in basis points
     */
    function swapFeeBps() external view returns (uint256);
}
