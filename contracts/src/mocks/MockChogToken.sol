// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet only. Stands in for $CHOG (18 decimals). Anyone may mint.
contract MockChogToken is ERC20 {
    constructor() ERC20("CHOG (testnet mock)", "CHOG") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}