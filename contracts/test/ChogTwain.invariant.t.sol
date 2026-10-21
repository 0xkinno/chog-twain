// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {ChogTwain} from "../src/ChogTwain.sol";
import {MockChogGenesis, MockCHOG, GazeTree} from "./ChogTwain.t.sol";

/// @dev Six actors hammer the contract with every action in random order. The invariants below must hold
///      after every call: I6 (no Chog in two active walks), I9 ($CHOG conservation), gap bounds,
///      steps never decrease, and every Met walk has steps >= distance.
contract Handler is Test {
    ChogTwain public twain;
    MockChogGenesis public chog;
    MockCHOG public token;
    GazeTree public tree;
    address[6] public actors;
    uint8[8] public gazes;
    uint256 public constant TOKENS = 8;
    uint256 public constant PRICE = 100e18;
    mapping(uint256 => uint16) public maxSteps; // ghost: highest steps ever seen per walk
    uint256 public calls;

    constructor(ChogTwain t, MockChogGenesis c, MockCHOG k, GazeTree g, uint8[8] memory gz) {
        twain = t;
        chog = c;
        token = k;
        tree = g;
        gazes = gz;
        for (uint256 i; i < 6; i++) {
            actors[i] = address(uint160(0xA000 + i));
            k.mint(actors[i], 1_000_000e18);
            vm.prank(actors[i]);
            k.approve(address(t), type(uint256).max);
        }
    }

    function _actor(uint256 s) internal view returns (address) {
        return actors[s % 6];
    }

    function open(uint256 who, uint256 id, uint256 dist, uint256 pledgeSeed) external {
        calls++;
        id = (id % TOKENS) + 1;
        uint8 d = [uint8(7), 14, 30][dist % 3];
        uint128 pledge = pledgeSeed % 3 == 0 ? 0 : uint128((pledgeSeed % 1000) * 1e18);
        vm.prank(_actor(who));
        try twain.open(id, gazes[id - 1], tree.proof(id), d, pledge, address(0)) {} catch {}
    }

    function join(uint256 who, uint256 walkId, uint256 id) external {
        calls++;
        id = (id % TOKENS) + 1;
        if (twain.walkCount() == 0) return;
        walkId = (walkId % twain.walkCount()) + 1;
        vm.prank(_actor(who));
        try twain.join(walkId, id, gazes[id - 1], tree.proof(id)) {} catch {}
        _record(walkId);
    }

    function showUp(uint256 who, uint256 walkId) external {
        calls++;
        if (twain.walkCount() == 0) return;
        walkId = (walkId % twain.walkCount()) + 1;
        vm.prank(_actor(who));
        try twain.showUp(walkId, bytes28(0)) {} catch {}
        _record(walkId);
    }

    function warpDays(uint256 n) external {
        calls++;
        vm.warp(block.timestamp + ((n % 4) + 0) * 1 days + 1 hours);
    }

    function light(uint256 who, uint256 walkId) external {
        calls++;
        if (twain.walkCount() == 0) return;
        walkId = (walkId % twain.walkCount()) + 1;
        vm.prank(_actor(who));
        try twain.light(walkId) {} catch {}
        _record(walkId);
    }

    function leave(uint256 who, uint256 walkId) external {
        calls++;
        if (twain.walkCount() == 0) return;
        walkId = (walkId % twain.walkCount()) + 1;
        vm.prank(_actor(who));
        try twain.leave(walkId) {} catch {}
        _record(walkId);
    }

    function poke(uint256 walkId) external {
        calls++;
        if (twain.walkCount() == 0) return;
        walkId = (walkId % twain.walkCount()) + 1;
        try twain.poke(walkId) {} catch {}
        _record(walkId);
    }

    function cancel(uint256 who, uint256 walkId) external {
        calls++;
        if (twain.walkCount() == 0) return;
        walkId = (walkId % twain.walkCount()) + 1;
        vm.prank(_actor(who));
        try twain.cancel(walkId) {} catch {}
    }

    function claim(uint256 who) external {
        calls++;
        vm.prank(_actor(who));
        try twain.claim() {} catch {}
    }

    function transferChog(uint256 from, uint256 id, uint256 to) external {
        calls++;
        id = (id % TOKENS) + 1;
        address owner = chog.ownerOf(id);
        vm.prank(owner);
        chog.transferFrom(owner, _actor(to + from), id);
    }

    function _record(uint256 walkId) internal {
        uint16 s = twain.walk(walkId).steps;
        if (s > maxSteps[walkId]) maxSteps[walkId] = s;
    }

    function actorList() external view returns (address[6] memory) {
        return actors;
    }
}

contract ChogTwainInvariantTest is StdInvariant, Test {
    MockChogGenesis chog;
    MockCHOG token;
    GazeTree tree;
    ChogTwain twain;
    Handler handler;
    uint8[8] G = [1, 2, 1, 2, 2, 3, 2, 1];

    function setUp() public {
        vm.warp(1_790_000_000);
        chog = new MockChogGenesis();
        token = new MockCHOG();
        tree = new GazeTree(G);
        twain = new ChogTwain(address(chog), address(token), tree.root(), 100e18, block.timestamp);
        for (uint256 id = 1; id <= 8; id++) chog.mint(address(uint160(0xA000 + (id % 6))), id);
        handler = new Handler(twain, chog, token, tree, G);
        targetContract(address(handler));
    }

    /// I6: a Chog is in at most one active walk, and that walk really holds it.
    function invariant_noChogInTwoActiveWalks() public view {
        uint256 active;
        for (uint256 id = 1; id <= 8; id++) {
            uint32 w = twain.activeWalkOf(id);
            if (w == 0) continue;
            ChogTwain.Walk memory x = twain.walk(w);
            assertTrue(x.status == twain.OPEN() || x.status == twain.WALKING(), "active lock on an ended walk");
            assertTrue(x.chogA == id || x.chogB == id, "lock points at a walk that does not hold the Chog");
            active++;
        }
        uint256 held;
        for (uint256 w = 1; w <= twain.walkCount(); w++) {
            ChogTwain.Walk memory x = twain.walk(w);
            if (x.status == twain.OPEN()) held += 1;
            else if (x.status == twain.WALKING()) held += 2;
        }
        assertEq(active, held, "every active walk holds exactly its Chogs");
    }

    /// I9: every $CHOG in the contract is either an active pledge or a claimable balance.
    function invariant_chogConserved() public view {
        address[6] memory a = handler.actorList();
        uint256 owed;
        for (uint256 i; i < 6; i++) owed += twain.claimable(a[i]);
        assertEq(token.balanceOf(address(twain)), twain.pledgesHeld() + owed);
    }

    function invariant_gapAndStepsAreSane() public view {
        for (uint256 w = 1; w <= twain.walkCount(); w++) {
            ChogTwain.Walk memory x = twain.walk(w);
            assertLe(x.gap, x.distance, "gap within [0, distance]");
            assertGe(x.steps, handler.maxSteps(w), "steps never decrease");
            if (x.status == twain.MET()) {
                assertEq(x.gap, 0);
                assertGe(x.steps, x.distance, "a meeting needs at least distance steps");
            }
        }
    }

    function invariant_postcardsMatchMeetings() public view {
        assertEq(twain.POSTCARD().total(), uint256(twain.meetings()) * 2);
    }
}
