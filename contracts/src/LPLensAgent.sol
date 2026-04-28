// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LPLensAgent
/// @notice ERC-7857-style intelligent NFT for the LPLens agent itself.
///         A single iNFT mint represents the agent's on-chain identity.
///         The agent updates its `memoryRoot` (rootHash of its persistent
///         memory DAG on 0G Storage) and its `reputation` (running counter
///         of diagnoses successfully published) over its lifetime. Owners
///         of the iNFT can transfer it to delegate operation of the agent.
///
///         This is a minimal reference impl — not the full ERC-7857
///         standard. The fields modeled are the load-bearing ones for the
///         OpenAgents demo: identity, memory pointer, reputation counter.
contract LPLensAgent {
    string public constant NAME = "LPLens Agent";
    string public constant SYMBOL = "LPLENS";

    struct Agent {
        address owner;
        bytes32 memoryRoot;       // rootHash on 0G Storage
        bytes32 codeImageHash;    // docker image hash for the TEE enclave
        uint64 mintedAt;
        uint64 lastUpdatedAt;
        uint64 reputation;        // diagnoses anchored count
        string metadataUri;       // ipfs:// or og://...
    }

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256) public agentOf;
    uint256 public nextTokenId = 1;

    event AgentMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 codeImageHash,
        string metadataUri
    );
    event MemoryRootUpdated(uint256 indexed tokenId, bytes32 oldRoot, bytes32 newRoot);
    event ReputationIncremented(uint256 indexed tokenId, uint64 newReputation);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    error NotOwner();
    error AlreadyMinted();
    error UnknownToken();

    function mint(
        bytes32 codeImageHash,
        string calldata metadataUri
    ) external returns (uint256 tokenId) {
        if (agentOf[msg.sender] != 0) revert AlreadyMinted();
        tokenId = nextTokenId++;
        agents[tokenId] = Agent({
            owner: msg.sender,
            memoryRoot: bytes32(0),
            codeImageHash: codeImageHash,
            mintedAt: uint64(block.timestamp),
            lastUpdatedAt: uint64(block.timestamp),
            reputation: 0,
            metadataUri: metadataUri
        });
        agentOf[msg.sender] = tokenId;
        emit AgentMinted(tokenId, msg.sender, codeImageHash, metadataUri);
        emit Transfer(address(0), msg.sender, tokenId);
    }

    function updateMemoryRoot(uint256 tokenId, bytes32 newRoot) external {
        Agent storage a = agents[tokenId];
        if (a.owner == address(0)) revert UnknownToken();
        if (a.owner != msg.sender) revert NotOwner();
        bytes32 oldRoot = a.memoryRoot;
        a.memoryRoot = newRoot;
        a.lastUpdatedAt = uint64(block.timestamp);
        emit MemoryRootUpdated(tokenId, oldRoot, newRoot);
    }

    function recordDiagnose(uint256 tokenId) external {
        Agent storage a = agents[tokenId];
        if (a.owner == address(0)) revert UnknownToken();
        if (a.owner != msg.sender) revert NotOwner();
        unchecked { a.reputation += 1; }
        a.lastUpdatedAt = uint64(block.timestamp);
        emit ReputationIncremented(tokenId, a.reputation);
    }

    function transferAgent(uint256 tokenId, address to) external {
        Agent storage a = agents[tokenId];
        if (a.owner == address(0)) revert UnknownToken();
        if (a.owner != msg.sender) revert NotOwner();
        address prev = a.owner;
        agentOf[prev] = 0;
        a.owner = to;
        agentOf[to] = tokenId;
        emit Transfer(prev, to, tokenId);
    }

    function memoryRootOf(uint256 tokenId) external view returns (bytes32) {
        return agents[tokenId].memoryRoot;
    }
}
