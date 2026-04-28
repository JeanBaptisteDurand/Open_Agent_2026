// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { LPLensAgent } from "../src/LPLensAgent.sol";

contract LPLensAgentTest is Test {
    LPLensAgent internal inft;
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    bytes32 internal codeImage = bytes32(uint256(0xC0DE));
    string internal metadataUri = "og://lplens-agent-v0.11.0";

    event AgentMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 codeImageHash,
        string metadataUri
    );

    function setUp() public {
        inft = new LPLensAgent();
    }

    function test_mint_assignsTokenId_andOwner() public {
        vm.expectEmit(true, true, false, true);
        emit AgentMinted(1, alice, codeImage, metadataUri);
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        assertEq(tokenId, 1);
        assertEq(inft.agentOf(alice), 1);
        (
            address owner,
            bytes32 memRoot,
            bytes32 storedImage,
            ,
            ,
            uint64 reputation,
            string memory uri
        ) = inft.agents(1);
        assertEq(owner, alice);
        assertEq(memRoot, bytes32(0));
        assertEq(storedImage, codeImage);
        assertEq(reputation, 0);
        assertEq(uri, metadataUri);
    }

    function test_mint_revertsOnSecondMintBySameOwner() public {
        vm.startPrank(alice);
        inft.mint(codeImage, metadataUri);
        vm.expectRevert(LPLensAgent.AlreadyMinted.selector);
        inft.mint(codeImage, metadataUri);
        vm.stopPrank();
    }

    function test_updateMemoryRoot_onlyByOwner() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);

        vm.prank(bob);
        vm.expectRevert(LPLensAgent.NotOwner.selector);
        inft.updateMemoryRoot(tokenId, bytes32(uint256(0x42)));

        vm.prank(alice);
        inft.updateMemoryRoot(tokenId, bytes32(uint256(0x42)));
        assertEq(inft.memoryRootOf(tokenId), bytes32(uint256(0x42)));
    }

    function test_recordDiagnose_incrementsReputation() public {
        vm.startPrank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);
        inft.recordDiagnose(tokenId);
        inft.recordDiagnose(tokenId);
        inft.recordDiagnose(tokenId);
        vm.stopPrank();
        (, , , , , uint64 reputation, ) = inft.agents(tokenId);
        assertEq(reputation, 3);
    }

    function test_transferAgent_movesOwnership() public {
        vm.prank(alice);
        uint256 tokenId = inft.mint(codeImage, metadataUri);

        vm.prank(alice);
        inft.transferAgent(tokenId, bob);
        (address owner, , , , , , ) = inft.agents(tokenId);
        assertEq(owner, bob);
        assertEq(inft.agentOf(alice), 0);
        assertEq(inft.agentOf(bob), tokenId);
    }
}
