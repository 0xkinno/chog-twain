// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title ChogTwainLoose (ablation, testnet only, never deployed to mainnet)
/// @notice Experiment D8. Same daily rules as ChogTwain for open, join and showUp (gaze is taken as given,
///         pledges and postcards are left out because they are not on the daily path), but every walk
///         field lives in its own mapping instead of one packed struct. Monad prices storage per 128-slot
///         page (MIP-8), so the packed layout should cost fewer cold page touches per `showUp`.
///         scripts/gas-table.mjs and test/Ablation.t.sol run the same 20 show-ups on both and publish
///         whatever comes out, including a result that does not favour our layout.
contract ChogTwainLoose {
    uint8 public constant OPEN = 1;
    uint8 public constant WALKING = 2;
    uint8 public constant MET = 3;
    uint8 public constant APART = 4;
    uint8 public constant MISS_LIMIT = 3;

    uint256 public immutable EPOCH;
    uint32 public walkCount;

    mapping(uint256 => uint16) public chogA;
    mapping(uint256 => uint16) public chogB;
    mapping(uint256 => uint8) public status;
    mapping(uint256 => uint8) public distance;
    mapping(uint256 => uint8) public gap;
    mapping(uint256 => uint16) public steps;
    mapping(uint256 => uint8) public missStreak;
    mapping(uint256 => bool) public aIn;
    mapping(uint256 => bool) public bIn;
    mapping(uint256 => bool) public stepped;
    mapping(uint256 => uint16) public curDay;
    mapping(uint256 => address) public walkerA;
    mapping(uint256 => address) public walkerB;
    mapping(uint256 => uint32) public activeWalkOf;
    mapping(uint256 => uint256) public stepsOnDay;
    uint64 public totalSteps;
    uint64 public totalShowUps;
    uint32 public meetings;

    error NotOpen();
    error NotWalking();
    error NotWalker();
    error AlreadyToday();
    error ChogBusy();
    error SelfWalk();
    error BadDistance();

    constructor(uint256 epoch) {
        EPOCH = epoch - (epoch % 1 days);
    }

    function today() public view returns (uint16) {
        return uint16((block.timestamp - EPOCH) / 1 days + 1);
    }

    function open(uint256 chog, uint8 dist) external returns (uint256 id) {
        if (dist != 7 && dist != 14 && dist != 30) revert BadDistance();
        if (activeWalkOf[chog] != 0) revert ChogBusy();
        id = ++walkCount;
        chogA[id] = uint16(chog);
        status[id] = OPEN;
        distance[id] = dist;
        gap[id] = dist;
        walkerA[id] = msg.sender;
        activeWalkOf[chog] = uint32(id);
    }

    function join(uint256 id, uint256 chog) external {
        if (status[id] != OPEN) revert NotOpen();
        if (msg.sender == walkerA[id]) revert SelfWalk();
        if (activeWalkOf[chog] != 0) revert ChogBusy();
        uint16 d = today();
        chogB[id] = uint16(chog);
        status[id] = WALKING;
        walkerB[id] = msg.sender;
        curDay[id] = d;
        bIn[id] = true;
        activeWalkOf[chog] = uint32(id);
        totalShowUps++;
    }

    function showUp(uint256 id, bytes28) external {
        if (status[id] != WALKING) revert NotWalking();
        _roll(id);
        if (status[id] != WALKING) return;
        bool isA = msg.sender == walkerA[id];
        if (!isA && msg.sender != walkerB[id]) revert NotWalker();
        if (isA ? aIn[id] : bIn[id]) revert AlreadyToday();
        if (isA) aIn[id] = true;
        else bIn[id] = true;
        totalShowUps++;
        if (aIn[id] && bIn[id] && !stepped[id]) _step(id);
    }

    function _step(uint256 id) internal {
        stepped[id] = true;
        missStreak[id] = 0;
        gap[id] -= 1;
        steps[id] += 1;
        totalSteps++;
        stepsOnDay[curDay[id]]++;
        if (gap[id] == 0) {
            meetings++;
            status[id] = MET;
            activeWalkOf[chogA[id]] = 0;
            activeWalkOf[chogB[id]] = 0;
        }
    }

    function _roll(uint256 id) internal {
        uint16 d = today();
        if (curDay[id] >= d) return;
        if (!stepped[id]) _miss(id, 1);
        uint256 empty = d - curDay[id] - 1;
        if (empty > 0) _miss(id, empty > 255 ? 255 : uint8(empty));
        curDay[id] = d;
        aIn[id] = false;
        bIn[id] = false;
        stepped[id] = false;
        if (missStreak[id] >= MISS_LIMIT) {
            status[id] = APART;
            activeWalkOf[chogA[id]] = 0;
            activeWalkOf[chogB[id]] = 0;
        }
    }

    function _miss(uint256 id, uint8 n) internal {
        uint256 g = uint256(gap[id]) + n;
        gap[id] = g > distance[id] ? distance[id] : uint8(g);
        uint256 s = uint256(missStreak[id]) + n;
        missStreak[id] = s > 255 ? 255 : uint8(s);
    }
}
