// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @notice Testnet only. Stands in for Chog Genesis (1969 tokens, ids 1..1969). Anyone may mint any id once.
contract MockChogGenesis is ERC721 {
    constructor() ERC721("Chog Genesis (testnet mock)", "CHOG") {}

    /// @dev Unminted ids in range report a fixed holder, so the local app can pick any of the 1,969 like on mainnet.
    function ownerOf(uint256 id) public view override returns (address) {
        address o = _ownerOf(id);
        if (o != address(0)) return o;
        require(id >= 1 && id <= 1969, "id");
        return address(0xC0FFEE);
    }

    function mint(address to, uint256 id) external {
        require(id >= 1 && id <= 1969, "id");
        _mint(to, id);
    }
}