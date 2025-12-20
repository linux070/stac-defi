// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SwapRouter
 * @notice Secure token swap router with reentrancy protection, slippage protection, and comprehensive security features
 * @dev Designed for USDC/EURC swaps on Arc Testnet and Sepolia
 */
contract SwapRouter is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    uint256 public constant MAX_FEE_BPS = 1000; // 10% maximum fee
    uint256 public constant MIN_DEADLINE_OFFSET = 300; // 5 minutes minimum
    uint256 public constant MAX_DEADLINE_OFFSET = 3600; // 1 hour maximum

    // ============ State Variables ============
    address public immutable factory;
    uint256 public swapFeeBps; // Fee in basis points (30 = 0.3%)
    address public feeRecipient;

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

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // ============ Errors ============
    error InsufficientOutputAmount(uint256 expected, uint256 actual);
    error Expired(uint256 deadline, uint256 timestamp);
    error InvalidPath();
    error InvalidAmount();
    error InsufficientLiquidity();
    error IdenticalAddresses();
    error ZeroAddress();
    error InvalidDeadline();

    // ============ Constructor ============
    constructor(
        address _factory,
        address _feeRecipient,
        uint256 _swapFeeBps
    ) {
        require(_factory != address(0), "Invalid factory");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_swapFeeBps <= MAX_FEE_BPS, "Fee too high");

        factory = _factory;
        feeRecipient = _feeRecipient;
        swapFeeBps = _swapFeeBps;
    }

    // ============ Modifiers ============
    modifier ensure(uint256 deadline) {
        if (block.timestamp > deadline) revert Expired(deadline, block.timestamp);
        _;
    }

    modifier validPath(address[] calldata path) {
        if (path.length < 2) revert InvalidPath();
        if (path[0] == path[path.length - 1]) revert IdenticalAddresses();
        _;
    }

    // ============ External Functions ============

    /**
     * @notice Swaps an exact amount of input tokens for as many output tokens as possible
     * @param amountIn Exact amount of input tokens to send
     * @param amountOutMin Minimum amount of output tokens to receive
     * @param path Array of token addresses (must be at least 2)
     * @param to Address to receive output tokens
     * @param deadline Unix timestamp after which the transaction will revert
     * @return amounts Array of input/output amounts for each step in the path
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        nonReentrant
        whenNotPaused
        ensure(deadline)
        validPath(path)
        returns (uint256[] memory amounts)
    {
        if (amountIn == 0) revert InvalidAmount();
        if (to == address(0)) revert ZeroAddress();
        if (deadline < block.timestamp + MIN_DEADLINE_OFFSET || deadline > block.timestamp + MAX_DEADLINE_OFFSET) {
            revert InvalidDeadline();
        }

        amounts = getAmountsOut(amountIn, path);
        if (amounts[amounts.length - 1] < amountOutMin) {
            revert InsufficientOutputAmount(amountOutMin, amounts[amounts.length - 1]);
        }

        // Transfer input tokens from user
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);

        // Execute swap through path
        _swap(amounts, path, to);

        emit Swap(
            msg.sender,
            path[0],
            path[path.length - 1],
            amountIn,
            amounts[amounts.length - 1],
            to,
            block.timestamp
        );
    }

    /**
     * @notice Swaps tokens for an exact amount of output tokens
     * @param amountOut Exact amount of output tokens to receive
     * @param amountInMax Maximum amount of input tokens to send
     * @param path Array of token addresses
     * @param to Address to receive output tokens
     * @param deadline Unix timestamp after which the transaction will revert
     * @return amounts Array of input/output amounts for each step
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    )
        external
        nonReentrant
        whenNotPaused
        ensure(deadline)
        validPath(path)
        returns (uint256[] memory amounts)
    {
        if (amountOut == 0) revert InvalidAmount();
        if (to == address(0)) revert ZeroAddress();
        if (deadline < block.timestamp + MIN_DEADLINE_OFFSET || deadline > block.timestamp + MAX_DEADLINE_OFFSET) {
            revert InvalidDeadline();
        }

        amounts = getAmountsIn(amountOut, path);
        if (amounts[0] > amountInMax) {
            revert InsufficientOutputAmount(amountInMax, amounts[0]);
        }

        // Transfer input tokens from user
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amounts[0]);

        // Execute swap through path
        _swap(amounts, path, to);

        emit Swap(
            msg.sender,
            path[0],
            path[path.length - 1],
            amounts[0],
            amountOut,
            to,
            block.timestamp
        );
    }

    // ============ View Functions ============

    /**
     * @notice Returns the amounts out for a given amount in
     * @param amountIn Amount of input tokens
     * @param path Array of token addresses
     * @return amounts Array of amounts for each step in the path
     */
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        public
        view
        returns (uint256[] memory amounts)
    {
        if (path.length < 2) revert InvalidPath();
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i; i < path.length - 1; ) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i], path[i + 1]);
            if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Returns the amounts in for a given amount out
     * @param amountOut Amount of output tokens
     * @param path Array of token addresses
     * @return amounts Array of amounts for each step in the path
     */
    function getAmountsIn(uint256 amountOut, address[] calldata path)
        public
        view
        returns (uint256[] memory amounts)
    {
        if (path.length < 2) revert InvalidPath();
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;

        for (uint256 i = path.length - 1; i > 0; ) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i - 1], path[i]);
            if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
            unchecked {
                --i;
            }
        }
    }

    /**
     * @notice Given an input amount, returns the maximum output amount
     * @param amountIn Input amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountOut Output amount
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public view returns (uint256 amountOut) {
        if (amountIn == 0) revert InvalidAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();

        uint256 amountInWithFee = amountIn * (10000 - swapFeeBps);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @notice Given an output amount, returns the required input amount
     * @param amountOut Output amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return amountIn Input amount
     */
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) public view returns (uint256 amountIn) {
        if (amountOut == 0) revert InvalidAmount();
        if (reserveIn == 0 || reserveOut == 0) revert InsufficientLiquidity();

        uint256 numerator = reserveIn * amountOut * 10000;
        uint256 denominator = (reserveOut - amountOut) * (10000 - swapFeeBps);
        amountIn = (numerator / denominator) + 1; // Add 1 to round up
    }

    /**
     * @notice Returns the reserves for a token pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return reserveA Reserve of token A
     * @return reserveB Reserve of token B
     */
    function getReserves(address tokenA, address tokenB)
        public
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        // This would call the Factory to get the pair address and then query reserves
        // For now, returning placeholder - implement based on your Factory contract
        address pair = ISwapFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            return (0, 0);
        }
        (reserveA, reserveB) = ISwapPair(pair).getReserves();
    }

    // ============ Internal Functions ============

    /**
     * @notice Internal function to execute swaps along the path
     * @param amounts Array of amounts for each step
     * @param path Array of token addresses
     * @param to Address to receive final output
     */
    function _swap(
        uint256[] memory amounts,
        address[] calldata path,
        address to
    ) internal {
        for (uint256 i; i < path.length - 1; ) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0, ) = sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address to_ = i < path.length - 2 ? getPairAddress(output, path[i + 2]) : to;
            ISwapPair(getPairAddress(input, output)).swap(amount0Out, amount1Out, to_, new bytes(0));
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Sorts two tokens and returns them in order
     */
    function sortTokens(address tokenA, address tokenB)
        internal
        pure
        returns (address token0, address token1)
    {
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    }

    /**
     * @notice Gets the pair address for two tokens
     */
    function getPairAddress(address tokenA, address tokenB)
        internal
        view
        returns (address)
    {
        return ISwapFactory(factory).getPair(tokenA, tokenB);
    }

    // ============ Admin Functions ============

    /**
     * @notice Updates the swap fee (only owner)
     * @param _swapFeeBps New fee in basis points
     */
    function setSwapFee(uint256 _swapFeeBps) external onlyOwner {
        require(_swapFeeBps <= MAX_FEE_BPS, "Fee too high");
        uint256 oldFee = swapFeeBps;
        swapFeeBps = _swapFeeBps;
        emit FeeUpdated(oldFee, _swapFeeBps);
    }

    /**
     * @notice Updates the fee recipient (only owner)
     * @param _feeRecipient New fee recipient address
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        address oldRecipient = feeRecipient;
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(oldRecipient, _feeRecipient);
    }

    /**
     * @notice Pauses the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency function to recover stuck tokens (only owner)
     * @param token Token address to recover
     * @param amount Amount to recover
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}

// ============ Interfaces ============

interface ISwapFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface ISwapPair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1);
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external;
}
