// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title TwainPostcard
/// @notice A soulbound postcard printed when two Chogs meet. One goes to each of the two people.
///         It cannot be sold or moved (ERC-5192 locked), so a meeting can never be bought.
///         The artwork is drawn fully on-chain as SVG; the real Chog art is shown by the app.
contract TwainPostcard is ERC721 {
    using Strings for uint256;

    struct Card {
        uint32 walkId;
        uint16 myChog;
        uint16 theirChog;
        uint8 distance;
        uint16 day;
        bool withSeal; // the walker held their Chog when the walk began
    }

    address public immutable TWAIN;
    uint256 public total;
    mapping(uint256 => Card) public cards;

    /// @dev ERC-5192
    event Locked(uint256 tokenId);

    error OnlyTwain();
    error Soulbound();

    constructor(address twain) ERC721("Chog Twain Postcard", "TWAIN") {
        TWAIN = twain;
    }

    function mint(address to, uint256 walkId, uint16 myChog, uint16 theirChog, uint8 distance, uint16 day, bool withSeal)
        external
        returns (uint256 id)
    {
        if (msg.sender != TWAIN) revert OnlyTwain();
        id = ++total;
        cards[id] = Card(uint32(walkId), myChog, theirChog, distance, day, withSeal);
        _mint(to, id);
        emit Locked(id);
    }

    /// @notice ERC-5192: every postcard is locked forever.
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function supportsInterface(bytes4 id) public view override returns (bool) {
        return id == 0xb45a3c0e || super.supportsInterface(id); // ERC-5192
    }

    /// @dev Mints and burns pass; every transfer between wallets reverts.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address from) {
        from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Card memory c = cards[tokenId];
        string memory svg = _svg(c);
        bytes memory json = abi.encodePacked(
            '{"name":"Chog ', uint256(c.myChog).toString(), " met Chog ", uint256(c.theirChog).toString(),
            '","description":"Two Chogs met after ', uint256(c.distance).toString(),
            ' days of both people showing up. Printed by Chog Twain on Monad.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)),
            '","attributes":[{"trait_type":"Walk","value":', uint256(c.walkId).toString(),
            '},{"trait_type":"Distance","value":', uint256(c.distance).toString(),
            '},{"trait_type":"Day","value":', uint256(c.day).toString(),
            '},{"trait_type":"Keeper seal","value":"', c.withSeal ? "Yes" : "No", '"}]}'
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function _svg(Card memory c) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">',
                '<rect width="600" height="400" rx="24" fill="#fbf9ff"/>',
                '<rect x="16" y="16" width="568" height="368" rx="16" fill="none" stroke="#6c4ab6" stroke-width="3" stroke-dasharray="10 8"/>',
                '<text x="300" y="120" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="30" fill="#23164d">They met.</text>',
                '<text x="300" y="200" text-anchor="middle" font-family="Verdana,sans-serif" font-weight="bold" font-size="40" fill="#6c4ab6">#',
                uint256(c.myChog).toString(), "  &#8644;  #", uint256(c.theirChog).toString(), "</text>",
                '<text x="300" y="260" text-anchor="middle" font-family="monospace" font-size="18" fill="#4b3d7a">',
                uint256(c.distance).toString(), " DAYS  /  WALK ", uint256(c.walkId).toString(), "  /  DAY ", uint256(c.day).toString(),
                "</text>",
                '<circle cx="500" cy="320" r="44" fill="none" stroke="#ff7aa8" stroke-width="3"/>',
                '<text x="500" y="326" text-anchor="middle" font-family="monospace" font-size="14" fill="#ff7aa8">CHOG TWAIN</text>',
                "</svg>"
            )
        );
    }
}
