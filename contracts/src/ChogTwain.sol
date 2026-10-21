// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {TwainPostcard} from "./TwainPostcard.sol";

interface IChogGenesis {
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IERC20Min {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title ChogTwain
/// @notice Two people each pick a Chog Genesis character. The two Chogs start apart, looking at each
///         other. On every UTC day both people show up, the Chogs take one step closer. A day either
///         one misses, they drift one step apart. When the gap closes, they meet: the meeting is
///         written onto both Chogs forever and both people receive a postcard printed on-chain.
/// @dev    Primary guarantee: "A meeting cannot be bought or rushed. It takes N real days on which both
///         people showed up." Nobody needs to own a Chog. Chog Genesis is read, never written: the
///         contract never asks for an NFT approval and never holds an NFT.
///         Days are resolved lazily: the first action of a new day closes the previous day.
contract ChogTwain {
    // ---------------------------------------------------------------- constants

    IChogGenesis public immutable CHOG;
    IERC20Min public immutable CHOG_TOKEN;
    TwainPostcard public immutable POSTCARD;
    /// @notice OpenZeppelin StandardMerkleTree root over ["uint256 tokenId", "uint8 gaze"],
    ///         gaze 1 = Left, 2 = Right, 3 = Front, built from the collection's IPFS metadata.
    ///         The ten 1:1 Legendaries carry no Side trait; they look straight out of the frame.
    bytes32 public immutable GAZE_ROOT;
    uint256 public immutable LANTERN_PRICE;
    uint256 public immutable EPOCH;

    address public constant BURN = 0x000000000000000000000000000000000000dEaD;
    uint8 public constant LEFT = 1;
    uint8 public constant RIGHT = 2;
    uint8 public constant FRONT = 3;
    uint8 public constant MAX_LANTERNS = 3;
    uint8 public constant MISS_LIMIT = 3; // three unkept days in a row and the two drift apart for good
    uint16 public constant INVITE_DAYS = 3;
    uint16 public constant MAX_CHOG_ID = 1969;

    uint8 public constant OPEN = 1; // waiting for a friend
    uint8 public constant WALKING = 2;
    uint8 public constant MET = 3;
    uint8 public constant APART = 4;
    uint8 public constant CANCELLED = 5;

    // ---------------------------------------------------------------- storage

    /// @dev Slot 1 holds every field a daily show-up touches (about 200 bits). Walkers and money follow in
    ///      consecutive slots of the same struct (Monad prices storage per 128-slot page, MIP-8).
    struct Walk {
        uint16 chogA; // the Chog picked by the person who opened the walk
        uint16 chogB; // the Chog picked by the friend who joined
        uint8 status;
        uint8 distance; // 7, 14 or 30 steps
        uint8 gap; // steps still between them; 0 = met
        uint16 steps; // together-days walked (never decreases; can exceed distance after drifts)
        uint8 lanterns; // stored lanterns (max 3)
        uint8 lanternsUsed;
        uint8 missStreak; // consecutive unkept days
        uint8 missesA; // days A was absent
        uint8 missesB;
        bool aIn; // A showed up on curDay
        bool bIn;
        bool stepped; // the step for curDay already happened
        bool sealA; // A held chogA when the walk began
        bool sealB;
        uint16 openedDay;
        uint16 startDay;
        uint16 curDay; // the day currently being collected
        uint16 endDay;
        address walkerA;
        address walkerB;
        address invitee; // optional: only this wallet may join (0 = anyone with the link)
        uint128 pledge; // $CHOG each side put in (0 = no pledge)
        uint128 forfeitA; // $CHOG A has forfeited to B through missed days
        uint128 forfeitB;
    }

    mapping(uint256 => uint8) public gazeOf; // tokenId => LEFT/RIGHT/FRONT, 0 = not proven yet
    mapping(uint256 => Walk) internal _walks;
    mapping(uint256 => uint32) public activeWalkOf; // tokenId => walk id holding it (0 = free)
    mapping(uint256 => bool) public homeOnly; // holder keeps this Chog for themselves
    mapping(uint256 => uint32[]) internal _friendBook; // tokenId => met walk ids
    mapping(address => uint32[]) internal _walksOf;
    mapping(address => uint256) public claimable; // settled $CHOG pledges waiting to be claimed
    mapping(uint256 => uint256) public cheers;
    /// @dev Latest note each person left with an "I'm here" (key = walkId * 2 + (isA ? 0 : 1)). Stored so a browser can
    ///      show notes from a view call; the full history is in the ShowedUp events (Monad public RPCs cap log ranges).
    struct Note {
        bytes28 text;
        uint32 day;
    }
    mapping(uint256 => Note) public noteOf;
    mapping(uint256 => uint256) public stepsOnDay; // heartbeat: together-steps per day

    // Open walks, listable in one call. Monad public RPCs return logs only 100 blocks per call.
    uint32[] internal _open;
    mapping(uint256 => uint256) internal _openIndex; // walk id => index + 1

    uint32 public walkCount;
    uint32 public meetings;
    uint64 public totalSteps;
    uint64 public totalShowUps;
    uint64 public lanternsLit;
    uint256 public pledgesHeld; // $CHOG in active pledges (accounting invariant with claimable)

    // ---------------------------------------------------------------- events

    event GazeProven(uint256 indexed tokenId, uint8 gaze);
    event HomeSet(uint256 indexed tokenId, bool homeOnly);
    event Opened(uint256 indexed walkId, uint256 indexed chogA, address indexed walkerA, uint8 distance, uint256 pledge, address invitee);
    event Joined(uint256 indexed walkId, uint256 indexed chogB, address indexed walkerB, uint16 day);
    event ShowedUp(uint256 indexed walkId, address indexed walker, uint16 day, bytes28 note);
    event Stepped(uint256 indexed walkId, uint8 gap, uint16 steps, uint16 day);
    event DayClosed(uint256 indexed walkId, uint16 day, bool aIn, bool bIn, bool lanternUsed, uint8 gap);
    event Drifted(uint256 indexed walkId, uint8 days_, uint8 gap);
    event Met(uint256 indexed walkId, uint256 indexed chogA, uint256 indexed chogB, uint16 day, uint256 postcardA, uint256 postcardB);
    event Apart(uint256 indexed walkId, uint16 day, address leaver);
    event Cancelled(uint256 indexed walkId);
    event LanternLit(uint256 indexed walkId, address indexed by, uint256 amount);
    event Cheered(uint256 indexed walkId, address indexed by);
    event Settled(uint256 indexed walkId, uint256 toA, uint256 toB);
    event Claimed(address indexed who, uint256 amount);

    // ---------------------------------------------------------------- errors

    error BadGaze();
    error BadProof();
    error GazeUnknown();
    error NotFacing();
    error BadChog();
    error ChogBusy();
    error HomeOnly();
    error NotHolder();
    error BadDistance();
    error NotOpen();
    error NotWalking();
    error InviteExpired();
    error NotInvited();
    error SelfWalk();
    error NotWalker();
    error AlreadyToday();
    error LanternsFull();
    error StillOpen();
    error TransferFailed();
    error NothingToClaim();

    constructor(address chog, address chogToken, bytes32 gazeRoot, uint256 lanternPrice, uint256 epoch) {
        CHOG = IChogGenesis(chog);
        CHOG_TOKEN = IERC20Min(chogToken);
        GAZE_ROOT = gazeRoot;
        LANTERN_PRICE = lanternPrice;
        EPOCH = epoch - (epoch % 1 days);
        POSTCARD = new TwainPostcard(address(this));
    }

    // ---------------------------------------------------------------- time

    /// @notice Day 1 is the deploy day (UTC), so 0 always means "never".
    function today() public view returns (uint16) {
        return uint16((block.timestamp - EPOCH) / 1 days + 1);
    }

    // ---------------------------------------------------------------- gaze

    function proveGaze(uint256 tokenId, uint8 gaze, bytes32[] calldata proof) public {
        if (gaze == 0 || gaze > FRONT) revert BadGaze();
        if (gazeOf[tokenId] != 0) return;
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(tokenId, gaze))));
        if (!MerkleProof.verifyCalldata(proof, GAZE_ROOT, leaf)) revert BadProof();
        gazeOf[tokenId] = gaze;
        emit GazeProven(tokenId, gaze);
    }

    /// @notice Two Chogs can walk toward each other only if they look at each other.
    ///         Left meets Right. A 1:1 looks straight out and can meet anyone.
    function canMeet(uint256 x, uint256 y) public view returns (bool) {
        uint8 gx = gazeOf[x];
        uint8 gy = gazeOf[y];
        if (gx == 0 || gy == 0) revert GazeUnknown();
        if (x == y) return false;
        if (gx == FRONT || gy == FRONT) return true;
        return gx != gy;
    }

    // ---------------------------------------------------------------- holders (optional extras)

    /// @notice The current holder of a Chog may keep it for themselves. Existing walks are unaffected.
    function setHome(uint256 tokenId, bool keep) external {
        if (CHOG.ownerOf(tokenId) != msg.sender) revert NotHolder();
        homeOnly[tokenId] = keep;
        emit HomeSet(tokenId, keep);
    }

    function _pickable(uint256 tokenId) internal view returns (bool withSeal) {
        if (tokenId == 0 || tokenId > MAX_CHOG_ID) revert BadChog();
        if (activeWalkOf[tokenId] != 0) revert ChogBusy();
        address holder = CHOG.ownerOf(tokenId);
        withSeal = holder == msg.sender;
        if (homeOnly[tokenId] && !withSeal) revert HomeOnly();
    }

    // ---------------------------------------------------------------- open, join, cancel

    function open(uint256 chog, uint8 gaze, bytes32[] calldata proof, uint8 distance, uint128 pledge, address invitee)
        external
        returns (uint256 walkId)
    {
        if (distance != 7 && distance != 14 && distance != 30) revert BadDistance();
        if (gazeOf[chog] == 0) proveGaze(chog, gaze, proof);
        bool withSeal = _pickable(chog);
        if (invitee == msg.sender) revert SelfWalk();

        walkId = ++walkCount;
        Walk storage w = _walks[walkId];
        w.chogA = uint16(chog);
        w.status = OPEN;
        w.distance = distance;
        w.gap = distance;
        w.sealA = withSeal;
        w.openedDay = today();
        w.walkerA = msg.sender;
        w.invitee = invitee;
        w.pledge = pledge;
        activeWalkOf[chog] = uint32(walkId);
        _walksOf[msg.sender].push(uint32(walkId));
        _open.push(uint32(walkId));
        _openIndex[walkId] = _open.length;
        if (pledge != 0) {
            pledgesHeld += pledge;
            if (!CHOG_TOKEN.transferFrom(msg.sender, address(this), pledge)) revert TransferFailed();
        }
        emit Opened(walkId, chog, msg.sender, distance, pledge, invitee);
    }

    /// @notice Joining counts as the friend showing up on day one.
    function join(uint256 walkId, uint256 chog, uint8 gaze, bytes32[] calldata proof) external {
        Walk storage w = _walks[walkId];
        if (w.status != OPEN) revert NotOpen();
        if (today() > w.openedDay + INVITE_DAYS) revert InviteExpired();
        if (msg.sender == w.walkerA) revert SelfWalk();
        if (w.invitee != address(0) && w.invitee != msg.sender) revert NotInvited();
        if (gazeOf[chog] == 0) proveGaze(chog, gaze, proof);
        if (!canMeet(w.chogA, chog)) revert NotFacing();
        bool withSeal = _pickable(chog);

        uint16 d = today();
        w.chogB = uint16(chog);
        w.status = WALKING;
        w.sealB = withSeal;
        w.walkerB = msg.sender;
        w.startDay = d;
        w.curDay = d;
        w.bIn = true;
        activeWalkOf[chog] = uint32(walkId);
        _walksOf[msg.sender].push(uint32(walkId));
        _removeOpen(walkId);
        unchecked {
            totalShowUps++;
        }
        if (w.pledge != 0) {
            pledgesHeld += w.pledge;
            if (!CHOG_TOKEN.transferFrom(msg.sender, address(this), w.pledge)) revert TransferFailed();
        }
        emit Joined(walkId, chog, msg.sender, d);
        emit ShowedUp(walkId, msg.sender, d, bytes28("joined"));
    }

    /// @notice The opener can cancel an open walk at any time; anyone can clear it once it expired.
    function cancel(uint256 walkId) external {
        Walk storage w = _walks[walkId];
        if (w.status != OPEN) revert NotOpen();
        bool expired = today() > w.openedDay + INVITE_DAYS;
        if (msg.sender != w.walkerA && !expired) revert StillOpen();
        w.status = CANCELLED;
        w.endDay = today();
        activeWalkOf[w.chogA] = 0;
        _removeOpen(walkId);
        if (w.pledge != 0) {
            pledgesHeld -= w.pledge;
            claimable[w.walkerA] += w.pledge;
        }
        emit Cancelled(walkId);
    }

    // ---------------------------------------------------------------- the daily promise

    function showUp(uint256 walkId, bytes28 note) external {
        Walk storage w = _walks[walkId];
        if (_rollEnded(walkId, w)) return; // three unkept days already parted them; recorded, not reverted
        bool isA = msg.sender == w.walkerA;
        if (!isA && msg.sender != w.walkerB) revert NotWalker();
        if (isA ? w.aIn : w.bIn) revert AlreadyToday();
        if (isA) w.aIn = true;
        else w.bIn = true;
        unchecked {
            totalShowUps++;
        }
        if (note != bytes28(0)) noteOf[walkId * 2 + (isA ? 0 : 1)] = Note(note, w.curDay);
        emit ShowedUp(walkId, msg.sender, w.curDay, note);
        if (w.aIn && w.bIn && !w.stepped) _step(walkId, w);
    }

    /// @notice Anyone can close past days for a walk (e.g. to release a Chog after three missed days).
    function poke(uint256 walkId) external {
        Walk storage w = _walks[walkId];
        if (w.status != WALKING) revert NotWalking();
        _roll(walkId, w);
    }

    /// @notice Walking away ends the walk now. The one who leaves forfeits their whole pledge to the friend.
    function leave(uint256 walkId) external {
        Walk storage w = _walks[walkId];
        bool isA = msg.sender == w.walkerA;
        if (!isA && msg.sender != w.walkerB) revert NotWalker();
        if (_rollEnded(walkId, w)) return;
        if (isA) w.forfeitA = w.pledge;
        else w.forfeitB = w.pledge;
        _end(walkId, w, APART);
        emit Apart(walkId, w.endDay, msg.sender);
    }

    /// @dev Rolls past days. Returns true if the walk ended during this roll. Reverts if it was not walking.
    function _rollEnded(uint256 walkId, Walk storage w) internal returns (bool) {
        if (w.status != WALKING) revert NotWalking();
        _roll(walkId, w);
        return w.status != WALKING;
    }

    function _step(uint256 walkId, Walk storage w) internal {
        w.stepped = true;
        w.missStreak = 0;
        w.gap -= 1;
        if (w.steps < type(uint16).max) w.steps += 1;
        unchecked {
            totalSteps++;
            stepsOnDay[w.curDay]++;
        }
        emit Stepped(walkId, w.gap, w.steps, w.curDay);
        if (w.gap == 0) _meet(walkId, w);
    }

    /// @dev Closes every day before today. The only past day that can hold show-ups is curDay; every
    ///      day after it had none. A lantern covers a closing day only when exactly one person came.
    function _roll(uint256 walkId, Walk storage w) internal {
        if (w.status != WALKING) return;
        uint16 d = today();
        if (w.curDay >= d) return;

        // 1. close curDay
        if (!w.stepped) {
            bool one = w.aIn != w.bIn;
            bool lit = one && w.lanterns > 0;
            if (lit) {
                w.lanterns -= 1;
                w.lanternsUsed += 1;
                w.missStreak = 0;
            } else {
                _miss(w, !w.aIn, !w.bIn, 1);
            }
            emit DayClosed(walkId, w.curDay, w.aIn, w.bIn, lit, w.gap);
        }
        // 2. days nobody came
        uint256 empty = d - w.curDay - 1;
        if (empty > 0) {
            uint8 n = empty > 255 ? 255 : uint8(empty);
            _miss(w, true, true, n);
            emit Drifted(walkId, n, w.gap);
        }
        w.curDay = d;
        w.aIn = false;
        w.bIn = false;
        w.stepped = false;
        if (w.missStreak >= MISS_LIMIT) {
            _end(walkId, w, APART);
            emit Apart(walkId, w.endDay, address(0));
        }
    }

    function _miss(Walk storage w, bool aMissed, bool bMissed, uint8 n) internal {
        uint256 g = uint256(w.gap) + n;
        w.gap = g > w.distance ? w.distance : uint8(g);
        uint256 s = uint256(w.missStreak) + n;
        w.missStreak = s > 255 ? 255 : uint8(s);
        uint128 perDay = w.pledge / w.distance;
        // A day only one person missed costs that person 1/distance of their pledge, paid to the friend.
        // A day both missed costs nobody: the forfeits would cancel out.
        if (aMissed && !bMissed) {
            w.missesA = _add8(w.missesA, n);
            w.forfeitA = _cap(w.forfeitA + perDay * n, w.pledge);
        } else if (bMissed && !aMissed) {
            w.missesB = _add8(w.missesB, n);
            w.forfeitB = _cap(w.forfeitB + perDay * n, w.pledge);
        } else {
            w.missesA = _add8(w.missesA, n);
            w.missesB = _add8(w.missesB, n);
        }
    }

    function _meet(uint256 walkId, Walk storage w) internal {
        unchecked {
            meetings++;
        }
        _friendBook[w.chogA].push(uint32(walkId));
        _friendBook[w.chogB].push(uint32(walkId));
        _end(walkId, w, MET);
        uint256 pa = POSTCARD.mint(w.walkerA, walkId, w.chogA, w.chogB, w.distance, w.endDay, w.sealA);
        uint256 pb = POSTCARD.mint(w.walkerB, walkId, w.chogB, w.chogA, w.distance, w.endDay, w.sealB);
        emit Met(walkId, w.chogA, w.chogB, w.endDay, pa, pb);
    }

    function _end(uint256 walkId, Walk storage w, uint8 status) internal {
        w.status = status;
        w.endDay = today();
        activeWalkOf[w.chogA] = 0;
        activeWalkOf[w.chogB] = 0;
        if (w.pledge != 0) {
            uint256 toA = uint256(w.pledge) - w.forfeitA + w.forfeitB;
            uint256 toB = uint256(w.pledge) - w.forfeitB + w.forfeitA;
            pledgesHeld -= uint256(w.pledge) * 2;
            claimable[w.walkerA] += toA;
            claimable[w.walkerB] += toB;
            emit Settled(walkId, toA, toB);
        }
    }

    function claim() external {
        uint256 amount = claimable[msg.sender];
        if (amount == 0) revert NothingToClaim();
        claimable[msg.sender] = 0;
        if (!CHOG_TOKEN.transfer(msg.sender, amount)) revert TransferFailed();
        emit Claimed(msg.sender, amount);
    }

    // ---------------------------------------------------------------- anyone can help

    /// @notice Anyone can burn $CHOG to light a lantern for a walking pair. A lantern keeps a day on
    ///         which only one of the two showed up: no drift, no forfeit. It never covers a day nobody came.
    function light(uint256 walkId) external {
        Walk storage w = _walks[walkId];
        if (_rollEnded(walkId, w)) revert NotWalking();
        if (w.lanterns >= MAX_LANTERNS) revert LanternsFull();
        w.lanterns += 1;
        unchecked {
            lanternsLit++;
        }
        if (!CHOG_TOKEN.transferFrom(msg.sender, BURN, LANTERN_PRICE)) revert TransferFailed();
        emit LanternLit(walkId, msg.sender, LANTERN_PRICE);
    }

    function cheer(uint256 walkId) external {
        uint8 s = _walks[walkId].status;
        if (s != WALKING && s != OPEN) revert NotWalking();
        unchecked {
            cheers[walkId]++;
        }
        emit Cheered(walkId, msg.sender);
    }

    // ---------------------------------------------------------------- views (storage-first)

    function walk(uint256 walkId) external view returns (Walk memory) {
        return _walks[walkId];
    }

    /// @notice The walk as it stands today, with past days closed, without writing anything.
    function preview(uint256 walkId) external view returns (Walk memory w, uint16 day) {
        w = _walks[walkId];
        day = today();
        if (w.status != WALKING || w.curDay >= day) return (w, day);
        if (!w.stepped) {
            if (w.aIn != w.bIn && w.lanterns > 0) {
                w.lanterns -= 1;
                w.lanternsUsed += 1;
                w.missStreak = 0;
            } else {
                _missMem(w, !w.aIn, !w.bIn, 1);
            }
        }
        uint256 empty = day - w.curDay - 1;
        if (empty > 0) _missMem(w, true, true, empty > 255 ? 255 : uint8(empty));
        w.curDay = day;
        w.aIn = false;
        w.bIn = false;
        w.stepped = false;
        if (w.missStreak >= MISS_LIMIT) w.status = APART;
    }

    function _missMem(Walk memory w, bool aMissed, bool bMissed, uint8 n) internal pure {
        uint256 g = uint256(w.gap) + n;
        w.gap = g > w.distance ? w.distance : uint8(g);
        uint256 s = uint256(w.missStreak) + n;
        w.missStreak = s > 255 ? 255 : uint8(s);
        uint128 perDay = w.pledge / w.distance;
        if (aMissed && !bMissed) {
            w.missesA = _add8(w.missesA, n);
            w.forfeitA = _cap(w.forfeitA + perDay * n, w.pledge);
        } else if (bMissed && !aMissed) {
            w.missesB = _add8(w.missesB, n);
            w.forfeitB = _cap(w.forfeitB + perDay * n, w.pledge);
        } else {
            w.missesA = _add8(w.missesA, n);
            w.missesB = _add8(w.missesB, n);
        }
    }

    function friendBook(uint256 tokenId) external view returns (uint32[] memory) {
        return _friendBook[tokenId];
    }

    function metCount(uint256 tokenId) external view returns (uint256) {
        return _friendBook[tokenId].length;
    }

    function walksOf(address who) external view returns (uint32[] memory) {
        return _walksOf[who];
    }

    function openWalks() external view returns (uint32[] memory) {
        return _open;
    }

    // ---------------------------------------------------------------- internal helpers

    function _removeOpen(uint256 walkId) internal {
        uint256 idx = _openIndex[walkId];
        if (idx == 0) return;
        uint32 last = _open[_open.length - 1];
        _open[idx - 1] = last;
        _openIndex[last] = idx;
        _open.pop();
        _openIndex[walkId] = 0;
    }

    function _add8(uint8 a, uint8 b) internal pure returns (uint8) {
        uint256 s = uint256(a) + b;
        return s > 255 ? 255 : uint8(s);
    }

    function _cap(uint128 v, uint128 max) internal pure returns (uint128) {
        return v > max ? max : v;
    }
}
