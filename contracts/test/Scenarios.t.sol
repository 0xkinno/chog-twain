// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {ChogTwain} from "../src/ChogTwain.sol";
import {MockChogGenesis, MockCHOG, GazeTree} from "./ChogTwain.t.sol";

/// @dev Parity: runs fixtures/scenarios/*.json against the contract. The same files run in Vitest against
///      packages/rules/src/engine.ts (packages/rules/test/scenarios.test.ts). Same results or CI fails.
contract ScenariosTest is Test {
    uint256 constant PRICE = 100e18;
    uint8[8] G = [1, 2, 1, 2, 2, 3, 2, 1];

    function _run(string memory path) internal {
        MockChogGenesis chog = new MockChogGenesis();
        MockCHOG token = new MockCHOG();
        GazeTree tree = new GazeTree(G);
        vm.warp(1_790_000_000);
        ChogTwain twain = new ChogTwain(address(chog), address(token), tree.root(), PRICE, block.timestamp);
        address holder = makeAddr("holder");
        for (uint256 id = 1; id <= 8; id++) chog.mint(id == 3 ? holder : address(0xC0FFEE), id);
        string[5] memory names = ["lena", "arjun", "fan", "holder", "stranger"];
        for (uint256 i; i < 5; i++) {
            address a = makeAddr(names[i]);
            token.mint(a, 10_000e18);
            vm.prank(a);
            token.approve(address(twain), type(uint256).max);
        }

        string memory json = vm.readFile(path);
        uint256 count = vm.parseJsonUint(json, ".count");
        for (uint256 i; i < count; i++) {
            string memory p = string.concat(".steps[", vm.toString(i), "].");
            string memory op = vm.parseJsonString(json, string.concat(p, "op"));
            address who = _who(vm.parseJsonString(json, string.concat(p, "who")));
            uint256 walkId = vm.parseJsonUint(json, string.concat(p, "walkId"));
            uint256 cg = vm.parseJsonUint(json, string.concat(p, "chog"));
            string memory err = vm.parseJsonString(json, string.concat(p, "err"));
            bytes memory data;
            bool isDays;
            if (_eq(op, "open")) {
                data = abi.encodeCall(
                    ChogTwain.open,
                    (
                        cg,
                        cg == 0 ? 0 : G[cg - 1],
                        cg == 0 ? new bytes32[](0) : tree.proof(cg),
                        uint8(vm.parseJsonUint(json, string.concat(p, "distance"))),
                        uint128(vm.parseJsonUint(json, string.concat(p, "pledge")) * 1e18),
                        _who(vm.parseJsonString(json, string.concat(p, "invitee")))
                    )
                );
            } else if (_eq(op, "join")) {
                data = abi.encodeCall(ChogTwain.join, (walkId, cg, G[cg - 1], tree.proof(cg)));
            } else if (_eq(op, "showUp")) {
                data = abi.encodeCall(ChogTwain.showUp, (walkId, bytes28(0)));
            } else if (_eq(op, "poke")) {
                data = abi.encodeCall(ChogTwain.poke, (walkId));
            } else if (_eq(op, "leave")) {
                data = abi.encodeCall(ChogTwain.leave, (walkId));
            } else if (_eq(op, "light")) {
                data = abi.encodeCall(ChogTwain.light, (walkId));
            } else if (_eq(op, "cheer")) {
                data = abi.encodeCall(ChogTwain.cheer, (walkId));
            } else if (_eq(op, "cancel")) {
                data = abi.encodeCall(ChogTwain.cancel, (walkId));
            } else if (_eq(op, "claim")) {
                data = abi.encodeCall(ChogTwain.claim, ());
            } else if (_eq(op, "days")) {
                isDays = true;
                vm.warp(block.timestamp + vm.parseJsonUint(json, string.concat(p, "n")) * 1 days);
            } else {
                revert(string.concat("unknown op ", op));
            }
            if (isDays) continue;
            vm.prank(who);
            (bool ok, bytes memory ret) = address(twain).call(data);
            if (bytes(err).length == 0) {
                assertTrue(ok, string.concat(path, " step ", vm.toString(i), " (", op, ") should succeed"));
            } else {
                assertFalse(ok, string.concat(path, " step ", vm.toString(i), " should revert with ", err));
                bytes4 want = bytes4(keccak256(bytes(string.concat(err, "()"))));
                bytes4 got;
                assembly {
                    got := mload(add(ret, 32))
                }
                assertEq(got, want, string.concat(path, " step ", vm.toString(i), " wrong error, wanted ", err));
            }
        }
        _expect(json, path, twain, token);
    }

    function _expect(string memory json, string memory path, ChogTwain twain, MockCHOG token) internal {
        ChogTwain.Walk memory w = twain.walk(1);
        assertEq(w.status, uint8(vm.parseJsonUint(json, ".expect.status")), string.concat(path, " status"));
        assertEq(w.gap, uint8(vm.parseJsonUint(json, ".expect.gap")), string.concat(path, " gap"));
        assertEq(w.steps, uint16(vm.parseJsonUint(json, ".expect.steps")), string.concat(path, " steps"));
        assertEq(w.lanterns, uint8(vm.parseJsonUint(json, ".expect.lanterns")), string.concat(path, " lanterns"));
        assertEq(w.lanternsUsed, uint8(vm.parseJsonUint(json, ".expect.lanternsUsed")), string.concat(path, " lanternsUsed"));
        assertEq(w.missStreak, uint8(vm.parseJsonUint(json, ".expect.missStreak")), string.concat(path, " missStreak"));
        assertEq(w.forfeitA, uint128(vm.parseJsonUint(json, ".expect.forfeitA") * 1e18), string.concat(path, " forfeitA"));
        assertEq(w.forfeitB, uint128(vm.parseJsonUint(json, ".expect.forfeitB") * 1e18), string.concat(path, " forfeitB"));
        assertEq(twain.claimable(makeAddr("lena")), vm.parseJsonUint(json, ".expect.claimLena") * 1e18, string.concat(path, " claimLena"));
        assertEq(twain.claimable(makeAddr("arjun")), vm.parseJsonUint(json, ".expect.claimArjun") * 1e18, string.concat(path, " claimArjun"));
        assertEq(token.balanceOf(twain.BURN()), vm.parseJsonUint(json, ".expect.burned") * 1e18, string.concat(path, " burned"));
        assertEq(uint256(twain.meetings()), vm.parseJsonUint(json, ".expect.meetings"), string.concat(path, " meetings"));
        assertEq(twain.POSTCARD().total(), vm.parseJsonUint(json, ".expect.postcards"), string.concat(path, " postcards"));
    }

    function test_allScenarios() public {
        Vm.DirEntry[] memory files = vm.readDir("../fixtures/scenarios");
        assertGt(files.length, 0, "no scenarios found");
        for (uint256 i; i < files.length; i++) {
            if (!_endsWith(files[i].path, ".json")) continue;
            _run(files[i].path);
        }
    }

    function _who(string memory n) internal returns (address) {
        if (bytes(n).length == 0) return address(0);
        return makeAddr(n);
    }

    function _eq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    function _endsWith(string memory s, string memory suffix) internal pure returns (bool) {
        bytes memory a = bytes(s);
        bytes memory b = bytes(suffix);
        if (a.length < b.length) return false;
        for (uint256 i; i < b.length; i++) if (a[a.length - b.length + i] != b[i]) return false;
        return true;
    }
}
