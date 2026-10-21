// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @notice Testnet only. Stands in for Chog Genesis (1969 tokens, ids 1..1969). Anyone may mint any id once.
contract MockChogGenesis is ERC721 {
    constructor() ERC721("Chog Genesis (testnet mock)", "CHOG") {}

    function mint(address to, uint256 id) external {
        require(id >= 1 && id <= 1969, "id");
        _mint(to, id);
    }
}