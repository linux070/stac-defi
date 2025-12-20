// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

// ... rest of the file stays the same

/**
 * @title SwapFactory
 * @notice Factory contract for creating token pairs
 * @dev Creates and manages liquidity pool pairs
 */
contract SwapFactory is Ownable {
    // ============ State Variables ============
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    address public feeTo; // Address that receives protocol fees
    address public feeToSetter; // Address that can set feeTo

    // ============ Events ============
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint256 pairCount
    );

    // ============ Constructor ============
    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    // ============ External Functions ============

    /**
     * @notice Creates a pair for two tokens
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair Address of the created pair
     */
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "Identical addresses");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Zero address");
        require(getPair[token0][token1] == address(0), "Pair exists");

        bytes memory bytecode = type(SwapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        ISwapPair(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // Populate mapping in the reverse direction
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    /**
     * @notice Returns the total number of pairs
     * @return Total pair count
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    // ============ Admin Functions ============

    /**
     * @notice Sets the fee recipient address
     * @param _feeTo New fee recipient
     */
    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "Not authorized");
        feeTo = _feeTo;
    }

    /**
     * @notice Sets the fee setter address
     * @param _feeToSetter New fee setter
     */
    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "Not authorized");
        feeToSetter = _feeToSetter;
    }
}

// ============ Interfaces ============

interface ISwapPair {
    function initialize(address token0, address token1) external;
}

// Minimal pair contract - full implementation would be in SwapPair.sol
contract SwapPair {
    // This is a placeholder - full implementation would include:
    // - Reserves management
    // - Mint/burn functions
    // - Swap function
    // - Sync function
    function initialize(address, address) external {}
}
