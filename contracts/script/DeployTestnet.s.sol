// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ChogTwain} from "../src/ChogTwain.sol";
import {ChogTwainLoose} from "../src/ablation/ChogTwainLoose.sol";
import {MockChogGenesis} from "../src/mocks/MockChogGenesis.sol";
import {MockChogToken} from "../src/mocks/MockChogToken.sol";

/// @notice Testnet (10143) deploy with a mock Chog collection and a mock $CHOG, plus the D8 ablation.
///   Required env: GAZE_ROOT (from data/gaze-stats.json), LANTERN_PRICE (wei).
/// forge script script/DeployTestnet.s.sol --rpc-url monad_testnet --broadcast --private-key $DEPLOYER_KEY
contract DeployTestnet is Script {
    function run() external {
        bytes32 root = vm.envBytes32("GAZE_ROOT");
        uint256 price = vm.envUint("LANTERN_PRICE");
        vm.startBroadcast();
        MockChogGenesis chog = new MockChogGenesis();
        MockChogToken token = new MockChogToken();
        ChogTwain twain = new ChogTwain(address(chog), address(token), root, price, block.timestamp);
        ChogTwainLoose loose = new ChogTwainLoose(block.timestamp);
        vm.stopBroadcast();
        console2.log("MockChogGenesis", address(chog));
        console2.log("MockChogToken", address(token));
        console2.log("ChogTwain", address(twain));
        console2.log("TwainPostcard", address(twain.POSTCARD()));
        console2.log("ChogTwainLoose", address(loose));
        console2.log("EPOCH", twain.EPOCH());
    }
}