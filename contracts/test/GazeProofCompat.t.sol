// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ChogTwain} from "../src/ChogTwain.sol";

/// @dev Cross-checks the JavaScript tree builder (scripts/build-gaze.mjs) against the Solidity verifier.
///      Root and proof were produced by the script from a metadata snapshot; the agent regenerates this
///      file from its own data/gaze.json once the collection is rebuilt from IPFS.
contract GazeProofCompatTest is Test {
    function test_jsProofVerifiesOnChain() public {
        ChogTwain t = new ChogTwain(address(1), address(2), 0x7cb42ed24f612763f141f9b02c56a637e2cd3f7fcdcb23dea68dc50e7b1d63e4, 1, block.timestamp);
        bytes32[] memory p = new bytes32[](11);
        p[0] = 0x76e07ab708f87a8d74bd861e717da85fa2b506c4c5d7f3c4f27aec0f50998c05;
        p[1] = 0x602b6f8fefe376470a470186a4e96e330a91f195de02d702126e636a2682ee4e;
        p[2] = 0x76854900737a9172a0c4792a83fe611541ae597ebbf05fc20fe36bc405abb3f2;
        p[3] = 0x2dbbb8f7f006c04a31473ae2c0a057cb18eecfc48dd0e0ea25c2d229df41540a;
        p[4] = 0xd4c59ef3eabd8abf71e91dbf3c9c2c004068f55508535f25555f9a7ed6c78a6c;
        p[5] = 0x5fe069cc0ba47697a5f3f7ff87bc64ecaefd3d071774e01e583748b91227ba07;
        p[6] = 0xf03cd29d914162598b53edd934313fc308598b3b9644bf38fa602ceb4ca92ee3;
        p[7] = 0xd60891a859f3c4bb6a9c89dd0fb2950ea1304e94ec558180dd94eef87bff9349;
        p[8] = 0x80951d0ebe23b42939ee8c853c085036a85894608a6115bc6dc1d66b09bc7630;
        p[9] = 0x96e5468353c758d815b00980c006f1ab393227731a482e262f49c3c2b583b560;
        p[10] = 0x9b05070f2c120be26e5e8ad31f5d1711a870e15220b7d8795c991a5e320f1e91;
        t.proveGaze(846, 2, p);
        assertEq(t.gazeOf(846), 2);
        vm.expectRevert(ChogTwain.BadProof.selector);
        t.proveGaze(847, 2, p);
    }
}
