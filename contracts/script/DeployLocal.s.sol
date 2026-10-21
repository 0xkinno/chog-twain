// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ChogTwain} from "../src/ChogTwain.sol";
import {MockChogGenesis} from "../src/mocks/MockChogGenesis.sol";
import {MockChogToken} from "../src/mocks/MockChogToken.sol";

/// @notice Local anvil only (chain 31337). Same contracts as mainnet with mocks for Chog Genesis and $CHOG, so the
///         whole app can be driven end to end in Playwright. Env: GAZE_ROOT, LANTERN_PRICE.
contract DeployLocal is Script {
    function run() external {
        bytes32 root = vm.envBytes32("GAZE_ROOT");
        uint256 price = vm.envUint("LANTERN_PRICE");
        vm.startBroadcast();
        MockChogGenesis chog = new MockChogGenesis();
        MockChogToken token = new MockChogToken();
        ChogTwain twain = new ChogTwain(address(chog), address(token), root, price, block.timestamp);
        // the ten anvil dev accounts get $CHOG; account 9 holds Chogs 1..24 (to try the optional holder extras)
        for (uint256 i; i < 10; i++) {
            token.mint(vm.addr(vm.envUint(string.concat("ANVIL_KEY_", vm.toString(i)))), 1_000_000e18);
        }
        address holder = vm.addr(vm.envUint("ANVIL_KEY_9"));
        for (uint256 id = 1; id <= 24; id++) chog.mint(holder, id);
        vm.stopBroadcast();
        console2.log("CHOG_GENESIS", address(chog));
        console2.log("CHOG_TOKEN", address(token));
        console2.log("TWAIN", address(twain));
        console2.log("POSTCARD", address(twain.POSTCARD()));
        console2.log("EPOCH", twain.EPOCH());
    }
}