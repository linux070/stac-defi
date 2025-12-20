// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Pair.sol";
import "./interfaces/IFactory.sol";

/**
 * @title Factory
 * @notice Factory contract for creating liquidity pair contracts
 */
contract Factory is IFactory, Ownable {
    mapping(address => mapping(address => address)) public override getPair;
    address[] public override allPairs;
    
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    /**
     * @notice Create a new liquidity pair
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair Address of the created pair
     */
    function createPair(address tokenA, address tokenB)
        external
        override
        returns (address pair)
    {
        require(tokenA != tokenB, "Factory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "Factory: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "Factory: PAIR_EXISTS");

        bytes memory bytecode = type(Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IPair(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    /**
     * @notice Get total number of pairs
     * @return Total pairs count
     */
    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }
}
