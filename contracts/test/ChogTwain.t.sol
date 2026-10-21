// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ChogTwain} from "../src/ChogTwain.sol";
import {TwainPostcard} from "../src/TwainPostcard.sol";

contract MockChogGenesis is ERC721 {
    constructor() ERC721("Chog Genesis (test)", "CHOG") {}

    function mint(address to, uint256 id) external {
        _mint(to, id);
    }
}

contract MockCHOG is ERC20 {
    constructor() ERC20("CHOG (test)", "CHOG") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @dev 8-leaf tree, OpenZeppelin leaf format and commutative hashing (StandardMerkleTree ["uint256","uint8"]).
contract GazeTree {
    bytes32[8] public leaves;
    bytes32 public root;

    function leaf(uint256 id, uint8 g) public pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(id, g))));
    }

    function _h(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encode(a, b)) : keccak256(abi.encode(b, a));
    }

    constructor(uint8[8] memory gazes) {
        for (uint256 i; i < 8; i++) leaves[i] = leaf(i + 1, gazes[i]);
        bytes32[4] memory l1;
        for (uint256 i; i < 4; i++) l1[i] = _h(leaves[2 * i], leaves[2 * i + 1]);
        root = _h(_h(l1[0], l1[1]), _h(l1[2], l1[3]));
    }

    function proof(uint256 id) external view returns (bytes32[] memory p) {
        uint256 i = id - 1;
        bytes32[4] memory l1;
        for (uint256 k; k < 4; k++) l1[k] = _h(leaves[2 * k], leaves[2 * k + 1]);
        bytes32[2] memory l2 = [_h(l1[0], l1[1]), _h(l1[2], l1[3])];
        p = new bytes32[](3);
        p[0] = leaves[i ^ 1];
        p[1] = l1[(i / 2) ^ 1];
        p[2] = l2[(i / 4) ^ 1];
    }
}

contract ChogTwainTest is Test {
    MockChogGenesis chog;
    MockCHOG token;
    GazeTree tree;
    ChogTwain twain;
    TwainPostcard postcard;

    // Chog ids 1..8: gazes L R L R R F R L
    uint8 constant L = 1;
    uint8 constant R = 2;
    uint8 constant F = 3;
    uint8[8] G = [L, R, L, R, R, F, R, L];
    uint256 constant PRICE = 100e18;
    uint128 constant PLEDGE = 700e18;

    address lena = makeAddr("lena"); // owns no Chog
    address arjun = makeAddr("arjun"); // owns no Chog
    address holder = makeAddr("holder"); // owns Chog 3
    address fan = makeAddr("fan");
    address stranger = makeAddr("stranger");

    function setUp() public {
        vm.warp(1_790_000_000);
        chog = new MockChogGenesis();
        token = new MockCHOG();
        tree = new GazeTree(G);
        twain = new ChogTwain(address(chog), address(token), tree.root(), PRICE, block.timestamp);
        postcard = twain.POSTCARD();
        for (uint256 id = 1; id <= 8; id++) chog.mint(id == 3 ? holder : address(0xC0FFEE), id);
        for (uint256 i; i < 4; i++) {
            address a = [lena, arjun, fan, holder][i];
            token.mint(a, 10_000e18);
            vm.prank(a);
            token.approve(address(twain), type(uint256).max);
        }
    }

    // ---------------------------------------------------------------- helpers

    function _open(address who, uint256 id, uint8 distance, uint128 pledge) internal returns (uint256 w) {
        bytes32[] memory p = tree.proof(id);
        vm.prank(who);
        w = twain.open(id, G[id - 1], p, distance, pledge, address(0));
    }

    function _join(address who, uint256 w, uint256 id) internal {
        bytes32[] memory p = tree.proof(id);
        vm.prank(who);
        twain.join(w, id, G[id - 1], p);
    }

    function _pair(uint8 distance, uint128 pledge) internal returns (uint256 w) {
        w = _open(lena, 1, distance, pledge); // Chog 1 looks left
        _join(arjun, w, 2); // Chog 2 looks right: they face each other
    }

    function _in(address who, uint256 w) internal {
        vm.prank(who);
        twain.showUp(w, bytes28(0));
    }

    function _day() internal {
        vm.warp(block.timestamp + 1 days);
    }

    // ---------------------------------------------------------------- the meeting

    function test_nobodyNeedsToOwnAChog() public {
        uint256 w = _pair(7, 0);
        assertEq(twain.walk(w).status, twain.WALKING());
        assertFalse(twain.walk(w).sealA);
        assertFalse(twain.walk(w).sealB);
    }

    function test_onlyChogsThatLookAtEachOtherCanMeet() public {
        uint256 w = _open(lena, 1, 7, 0); // Left
        bytes32[] memory p = tree.proof(3);
        vm.prank(arjun);
        vm.expectRevert(ChogTwain.NotFacing.selector); // 3 also looks left
        twain.join(w, 3, L, p);
        _join(arjun, w, 6); // a 1:1 looks straight out and can meet anyone
        assertEq(twain.walk(w).chogB, 6);
    }

    function test_sevenTogetherDaysMakeAMeeting() public {
        uint256 w = _pair(7, 0);
        _in(lena, w); // day 1 (arjun counted at join)
        assertEq(twain.walk(w).gap, 6);
        for (uint256 i = 1; i < 7; i++) {
            _day();
            _in(lena, w);
            _in(arjun, w);
        }
        ChogTwain.Walk memory x = twain.walk(w);
        assertEq(x.status, twain.MET());
        assertEq(x.steps, 7);
        assertEq(twain.metCount(1), 1);
        assertEq(twain.metCount(2), 1);
        assertEq(postcard.ownerOf(1), lena);
        assertEq(postcard.ownerOf(2), arjun);
        assertEq(twain.activeWalkOf(1), 0, "Chog is free again");
        assertTrue(postcard.locked(1));
    }

    function test_aMeetingCannotBeRushed() public {
        uint256 w = _pair(7, 0);
        _in(lena, w);
        vm.prank(lena);
        vm.expectRevert(ChogTwain.AlreadyToday.selector);
        twain.showUp(w, bytes28(0));
        assertEq(twain.walk(w).steps, 1, "one step per day, at most");
    }

    function test_aMissedDayDriftsThemApart() public {
        uint256 w = _pair(7, 0);
        _in(lena, w); // gap 6
        _day();
        _in(lena, w); // arjun misses day 2
        _day();
        _in(lena, w); // closes day 2: drift back to 7
        assertEq(twain.walk(w).gap, 7);
        assertEq(twain.walk(w).missesB, 1);
        assertEq(twain.walk(w).steps, 1, "steps already walked are never taken back");
    }

    function test_threeUnkeptDaysPartThemForGood() public {
        uint256 w = _pair(7, 0);
        _in(lena, w);
        _day();
        _day();
        _day();
        _day();
        _in(lena, w); // the roll closes days 2,3,4: three unkept days
        assertEq(twain.walk(w).status, twain.APART());
        assertEq(twain.activeWalkOf(1), 0);
        assertEq(twain.activeWalkOf(2), 0);
    }

    function test_strangerCannotShowUp() public {
        uint256 w = _pair(7, 0);
        vm.prank(stranger);
        vm.expectRevert(ChogTwain.NotWalker.selector);
        twain.showUp(w, bytes28(0));
    }

    function test_oneWalletCannotWalkWithItself() public {
        uint256 w = _open(lena, 1, 7, 0);
        bytes32[] memory p = tree.proof(2);
        vm.prank(lena);
        vm.expectRevert(ChogTwain.SelfWalk.selector);
        twain.join(w, 2, R, p);
    }

    function test_aChogWalksWithOnePairAtATime() public {
        _pair(7, 0);
        bytes32[] memory p = tree.proof(1);
        vm.prank(fan);
        vm.expectRevert(ChogTwain.ChogBusy.selector);
        twain.open(1, L, p, 7, 0, address(0));
    }

    function test_forgedGazeReverts() public {
        bytes32[] memory p = tree.proof(5);
        vm.expectRevert(ChogTwain.BadProof.selector);
        twain.proveGaze(5, L, p); // 5 looks right
    }

    function test_privateInvite() public {
        bytes32[] memory p = tree.proof(1);
        vm.prank(lena);
        uint256 w = twain.open(1, L, p, 7, 0, arjun);
        bytes32[] memory q = tree.proof(2);
        vm.prank(fan);
        vm.expectRevert(ChogTwain.NotInvited.selector);
        twain.join(w, 2, R, q);
        _join(arjun, w, 2);
    }

    function test_inviteExpiresAndAnyoneCanClearIt() public {
        uint256 w = _open(lena, 1, 7, PLEDGE);
        for (uint256 i; i < 4; i++) _day();
        bytes32[] memory q = tree.proof(2);
        vm.prank(arjun);
        vm.expectRevert(ChogTwain.InviteExpired.selector);
        twain.join(w, 2, R, q);
        vm.prank(stranger);
        twain.cancel(w);
        assertEq(twain.claimable(lena), PLEDGE);
        assertEq(twain.activeWalkOf(1), 0);
    }

    // ---------------------------------------------------------------- holders (optional)

    function test_holderSealAndHome() public {
        bytes32[] memory p = tree.proof(3);
        vm.prank(holder);
        uint256 w = twain.open(3, L, p, 7, 0, address(0));
        assertTrue(twain.walk(w).sealA);
        vm.prank(holder);
        twain.cancel(w);

        vm.prank(stranger);
        vm.expectRevert(ChogTwain.NotHolder.selector);
        twain.setHome(3, true);
        vm.prank(holder);
        twain.setHome(3, true);
        vm.prank(lena);
        vm.expectRevert(ChogTwain.HomeOnly.selector);
        twain.open(3, L, p, 7, 0, address(0));
    }

    function test_homeFollowsTheTokenAfterASale() public {
        vm.prank(holder);
        twain.setHome(3, true);
        vm.prank(holder);
        chog.transferFrom(holder, fan, 3);
        bytes32[] memory p = tree.proof(3);
        vm.prank(holder);
        vm.expectRevert(ChogTwain.HomeOnly.selector); // the seller lost the key with the token
        twain.open(3, L, p, 7, 0, address(0));
        vm.prank(fan);
        uint256 w = twain.open(3, L, p, 7, 0, address(0));
        assertTrue(twain.walk(w).sealA);
    }

    // ---------------------------------------------------------------- $CHOG

    function test_lanternKeepsADayOnlyOneCameTo() public {
        uint256 w = _pair(7, PLEDGE);
        _in(lena, w); // gap 6
        vm.prank(fan);
        twain.light(w);
        assertEq(token.balanceOf(twain.BURN()), PRICE);
        _day();
        _in(lena, w); // arjun misses day 2, lantern will keep it
        _day();
        _in(lena, w);
        ChogTwain.Walk memory x = twain.walk(w);
        assertEq(x.gap, 6, "no drift");
        assertEq(x.forfeitB, 0, "no forfeit");
        assertEq(x.lanternsUsed, 1);
    }

    function test_lanternNeverCoversADayNobodyCame() public {
        uint256 w = _pair(7, 0);
        _in(lena, w);
        vm.prank(fan);
        twain.light(w);
        _day();
        _day(); // day 2 nobody came
        _in(lena, w);
        ChogTwain.Walk memory x = twain.walk(w);
        assertEq(x.lanterns, 1, "the lantern is still there");
        assertEq(x.gap, 7);
    }

    function test_lanternsCapAtThree() public {
        uint256 w = _pair(7, 0);
        vm.startPrank(fan);
        twain.light(w);
        twain.light(w);
        twain.light(w);
        vm.expectRevert(ChogTwain.LanternsFull.selector);
        twain.light(w);
        vm.stopPrank();
    }

    function test_pledgeComesBackWhenTheyMeet() public {
        uint256 w = _pair(7, PLEDGE);
        _in(lena, w);
        for (uint256 i = 1; i < 7; i++) {
            _day();
            _in(lena, w);
            _in(arjun, w);
        }
        assertEq(twain.claimable(lena), PLEDGE);
        assertEq(twain.claimable(arjun), PLEDGE);
        uint256 before = token.balanceOf(lena);
        vm.prank(lena);
        twain.claim();
        assertEq(token.balanceOf(lena), before + PLEDGE);
        assertEq(twain.pledgesHeld(), 0);
    }

    function test_aMissedDayCostsTheOneWhoMissedIt() public {
        uint256 w = _pair(7, PLEDGE);
        _in(lena, w);
        _day();
        _in(lena, w); // arjun misses day 2
        _day();
        _in(lena, w);
        _in(arjun, w);
        assertEq(twain.walk(w).forfeitB, PLEDGE / 7);
        vm.prank(arjun);
        twain.leave(w); // walking away forfeits the whole pledge
        assertEq(twain.claimable(lena), PLEDGE * 2);
        assertEq(twain.claimable(arjun), 0);
    }

    function test_cheerIsFreeForAnyone() public {
        uint256 w = _pair(7, 0);
        vm.prank(stranger);
        twain.cheer(w);
        assertEq(twain.cheers(w), 1);
    }

    function test_previewMatchesWhatTheChainWillDo() public {
        uint256 w = _pair(7, PLEDGE);
        _in(lena, w);
        _day();
        _in(lena, w);
        _day();
        _day();
        (ChogTwain.Walk memory pv,) = twain.preview(w);
        vm.prank(stranger);
        twain.poke(w);
        ChogTwain.Walk memory real = twain.walk(w);
        assertEq(pv.gap, real.gap);
        assertEq(pv.missStreak, real.missStreak);
        assertEq(pv.forfeitB, real.forfeitB);
        assertEq(pv.status, real.status);
    }

    function test_postcardIsSoulbound() public {
        uint256 w = _pair(7, 0);
        _in(lena, w);
        for (uint256 i = 1; i < 7; i++) {
            _day();
            _in(lena, w);
            _in(arjun, w);
        }
        vm.prank(lena);
        vm.expectRevert(TwainPostcard.Soulbound.selector);
        postcard.transferFrom(lena, fan, 1);
        assertTrue(bytes(postcard.tokenURI(1)).length > 100);
    }

    // ---------------------------------------------------------------- Phase 2 additions

    function _meet7() internal returns (uint256 w) {
        w = _pair(7, 0);
        _in(lena, w);
        for (uint256 i = 1; i < 7; i++) {
            _day();
            _in(lena, w);
            _in(arjun, w);
        }
    }

    function test_noteIsStoredForBothWalkers() public {
        uint256 w = _pair(7, 0);
        vm.prank(lena);
        twain.showUp(w, bytes28("landed in Leipzig"));
        _day();
        vm.prank(arjun);
        twain.showUp(w, bytes28("first chai"));
        (bytes28 a, uint32 da) = twain.noteOf(w * 2);
        (bytes28 b, uint32 db) = twain.noteOf(w * 2 + 1);
        assertEq(a, bytes28("landed in Leipzig"));
        assertEq(da, 1);
        assertEq(b, bytes28("first chai"));
        assertEq(db, 2);
    }

    function test_cancelByOpener() public {
        uint256 w = _open(lena, 1, 7, PLEDGE);
        assertEq(twain.activeWalkOf(1), w);
        vm.prank(lena);
        twain.cancel(w);
        assertEq(twain.walk(w).status, twain.CANCELLED());
        assertEq(twain.activeWalkOf(1), 0);
        assertEq(twain.claimable(lena), PLEDGE);
        assertEq(twain.openWalks().length, 0);
    }

    function test_cancelByStrangerBeforeExpiryReverts() public {
        uint256 w = _open(lena, 1, 7, 0);
        vm.prank(stranger);
        vm.expectRevert(ChogTwain.StillOpen.selector);
        twain.cancel(w);
    }

    function test_joinAfterCancelReverts() public {
        uint256 w = _open(lena, 1, 7, 0);
        vm.prank(lena);
        twain.cancel(w);
        bytes32[] memory p = tree.proof(2);
        vm.prank(arjun);
        vm.expectRevert(ChogTwain.NotOpen.selector);
        twain.join(w, 2, R, p);
    }

    function test_claimTwiceReverts() public {
        uint256 w = _open(lena, 1, 7, PLEDGE);
        vm.prank(lena);
        twain.cancel(w);
        vm.prank(lena);
        twain.claim();
        vm.prank(lena);
        vm.expectRevert(ChogTwain.NothingToClaim.selector);
        twain.claim();
    }

    function test_leaveBeforeAnyMiss() public {
        uint256 w = _pair(7, PLEDGE);
        vm.prank(arjun);
        twain.leave(w);
        assertEq(twain.walk(w).status, twain.APART());
        assertEq(twain.claimable(lena), PLEDGE * 2, "the leaver forfeits the whole pledge");
        assertEq(twain.claimable(arjun), 0);
        assertEq(twain.activeWalkOf(1), 0);
        assertEq(twain.activeWalkOf(2), 0);
    }

    function test_bothMissNoForfeit() public {
        uint256 w = _pair(7, PLEDGE);
        _in(lena, w); // day 1 step, gap 6
        _day();
        _day(); // day 2 nobody came
        _in(lena, w); // closes day 2 as a miss for both
        ChogTwain.Walk memory x = twain.walk(w);
        assertEq(x.gap, 7);
        assertEq(x.forfeitA, 0);
        assertEq(x.forfeitB, 0);
        assertEq(x.missesA, 1);
        assertEq(x.missesB, 1);
    }

    function test_distance30() public {
        uint256 w = _pair(30, 0);
        _in(lena, w);
        for (uint256 i = 1; i < 30; i++) {
            _day();
            _in(lena, w);
            _in(arjun, w);
        }
        ChogTwain.Walk memory x = twain.walk(w);
        assertEq(x.status, twain.MET());
        assertEq(x.steps, 30);
        assertEq(x.distance, 30);
    }

    function test_badDistanceReverts() public {
        bytes32[] memory p = tree.proof(1);
        vm.prank(lena);
        vm.expectRevert(ChogTwain.BadDistance.selector);
        twain.open(1, L, p, 8, 0, address(0));
    }

    function test_metChogCanWalkAgain() public {
        _meet7();
        assertEq(twain.activeWalkOf(1), 0);
        uint256 w2 = _open(lena, 1, 14, 0);
        _join(fan, w2, 4);
        assertEq(twain.walk(w2).status, twain.WALKING());
        assertEq(twain.metCount(1), 1);
        assertEq(twain.friendBook(1)[0], 1);
    }

    function test_afterMeetingShowUpReverts() public {
        uint256 w = _meet7();
        vm.prank(lena);
        vm.expectRevert(ChogTwain.NotWalking.selector);
        twain.showUp(w, bytes28(0));
    }

    function test_postcardTokenURIDecodes() public {
        uint256 w = _meet7();
        string memory uri = postcard.tokenURI(1);
        string memory prefix = "data:application/json;base64,";
        bytes memory b = bytes(uri);
        assertEq(string(_slice(b, 0, bytes(prefix).length)), prefix);
        string memory json = string(_b64decode(_slice(b, bytes(prefix).length, b.length)));
        assertTrue(_contains(json, '"name":"Chog 1 met Chog 2"'));
        assertTrue(_contains(json, '"trait_type":"Walk","value":1}'));
        assertTrue(_contains(json, '"trait_type":"Distance","value":7}'));
        assertTrue(_contains(json, '"trait_type":"Keeper seal","value":"No"'));
        assertTrue(_contains(json, "data:image/svg+xml;base64,"));
        assertEq(w, 1);
        // the second postcard is the friend's view of the same walk
        string memory json2 = string(_b64decode(_slice(bytes(postcard.tokenURI(2)), bytes(prefix).length, bytes(postcard.tokenURI(2)).length)));
        assertTrue(_contains(json2, '"name":"Chog 2 met Chog 1"'));
    }

    /// @dev I14: Chog Genesis is only ever read. The only call on it in src/ is ownerOf.
    function test_noNftWrites() public view {
        string memory src = vm.readFile("src/ChogTwain.sol");
        assertEq(_count(src, "CHOG."), _count(src, "CHOG.ownerOf("), "only ownerOf is called on Chog Genesis");
        assertEq(_count(src, "interface IChogGenesis {\n    function ownerOf(uint256 tokenId) external view returns (address);\n}"), 1);
        assertEq(_count(src, "approve("), 0, "no NFT approvals");
        assertEq(_count(src, "safeTransferFrom"), 0, "no NFT custody");
    }

    // ---------------------------------------------------------------- string helpers

    function _slice(bytes memory b, uint256 from, uint256 to) internal pure returns (bytes memory r) {
        r = new bytes(to - from);
        for (uint256 i; i < r.length; i++) r[i] = b[from + i];
    }

    function _count(string memory hay, string memory needle) internal pure returns (uint256 n) {
        bytes memory h = bytes(hay);
        bytes memory nd = bytes(needle);
        if (nd.length == 0 || h.length < nd.length) return 0;
        for (uint256 i; i <= h.length - nd.length; i++) {
            bool ok = true;
            for (uint256 j; j < nd.length; j++) {
                if (h[i + j] != nd[j]) {
                    ok = false;
                    break;
                }
            }
            if (ok) n++;
        }
    }

    function _contains(string memory hay, string memory needle) internal pure returns (bool) {
        return _count(hay, needle) > 0;
    }

    function _b64decode(bytes memory d) internal pure returns (bytes memory out) {
        bytes memory tbl = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint8[256] memory idx;
        for (uint256 i; i < 64; i++) idx[uint8(tbl[i])] = uint8(i);
        uint256 pad;
        if (d.length > 0 && d[d.length - 1] == "=") pad++;
        if (d.length > 1 && d[d.length - 2] == "=") pad++;
        out = new bytes((d.length / 4) * 3 - pad);
        uint256 o;
        for (uint256 i; i < d.length; i += 4) {
            uint256 n = (uint256(idx[uint8(d[i])]) << 18) | (uint256(idx[uint8(d[i + 1])]) << 12)
                | (uint256(idx[uint8(d[i + 2])]) << 6) | uint256(idx[uint8(d[i + 3])]);
            if (o < out.length) out[o++] = bytes1(uint8(n >> 16));
            if (o < out.length) out[o++] = bytes1(uint8(n >> 8));
            if (o < out.length) out[o++] = bytes1(uint8(n));
        }
    }
    // ---------------------------------------------------------------- fuzz

    /// @dev Over any attendance and lantern pattern: steps never exceed together-days, the gap stays in
    ///      [0, distance], a meeting needs at least `distance` steps, and $CHOG is conserved.
    function testFuzz_meetingNeedsRealDays(uint64 aMask, uint64 bMask, uint64 lMask) public {
        uint256 w = _pair(14, PLEDGE);
        uint256 together = 1; // day 1 counted for arjun at join; lena's show-up below
        bool aDay1 = aMask & 1 == 1;
        if (aDay1) _in(lena, w);
        else together = 0;
        for (uint256 d = 1; d < 40; d++) {
            _day();
            ChogTwain.Walk memory x = twain.walk(w);
            if (x.status != twain.WALKING()) break;
            if ((lMask >> d) & 1 == 1 && x.lanterns < 3) {
                vm.prank(fan);
                try twain.light(w) {} catch {}
            }
            bool a = (aMask >> d) & 1 == 1;
            bool b = (bMask >> d) & 1 == 1;
            if (a) _in(lena, w);
            if (twain.walk(w).status != twain.WALKING()) break;
            if (b) _in(arjun, w);
            if (a && b) together++;
            x = twain.walk(w);
            assertLe(x.steps, together);
            assertLe(x.gap, x.distance);
            // Finding (fuzz): drifts reopen the gap, so a meeting takes AT LEAST `distance` steps.
            if (x.status == twain.MET()) assertGe(x.steps, x.distance);
        }
        uint256 held = twain.pledgesHeld();
        uint256 owed = twain.claimable(lena) + twain.claimable(arjun);
        assertEq(token.balanceOf(address(twain)), held + owed, "every $CHOG is accounted for");
    }
}
