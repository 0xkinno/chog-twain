// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ChogTwain} from "../src/ChogTwain.sol";

/// @notice Deploys ChogTwain. Required env:
///   CHOG_GENESIS   Chog Genesis (mainnet 0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763; a mock on testnet)
///   CHOG_TOKEN     $CHOG (mainnet 0x350035555E10d9AfAF1566AaebfCeD5BA6C27777; a mock on testnet)
///   GAZE_ROOT      root from data/gaze-stats.json
///   LANTERN_PRICE  in wei of $CHOG (18 decimals)
/// forge script script/Deploy.s.sol --rpc-url monad --broadcast --private-key $DEPLOYER_KEY
contract Deploy is Script {
    function run() external returns (ChogTwain twain) {
        address chog = vm.envAddress("CHOG_GENESIS");
        address chogToken = vm.envAddress("CHOG_TOKEN");
        bytes32 root = vm.envBytes32("GAZE_ROOT");
        uint256 price = vm.envUint("LANTERN_PRICE");
        vm.startBroadcast();
        twain = new ChogTwain(chog, chogToken, root, price, block.timestamp);
        vm.stopBroadcast();
        console2.log("ChogTwain", address(twain));
        console2.log("EPOCH", twain.EPOCH());
        console2.log("TwainPostcard", address(twain.POSTCARD()));
    }
}
