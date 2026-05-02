// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { LPLensReports } from "../src/LPLensReports.sol";
import { LPLensAgent } from "../src/LPLensAgent.sol";

/// @notice Deploys LPLensReports + LPLensAgent on the target chain (0G
/// Newton testnet by default; pass --rpc-url to swap). After deploy,
/// copy the printed addresses into the project root .env as
/// LPLENS_REPORTS_CONTRACT and LPLENS_AGENT_CONTRACT.
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("WALLET_DEPLOYER_PK");
        bytes32 codeImage = vm.envOr("LPLENS_CODE_IMAGE_HASH", bytes32(0));
        string memory metadataUri = vm.envOr(
            "LPLENS_METADATA_URI",
            string("og://lplens-agent-v0.11.0")
        );
        // Royalty config — treasury defaults to deployer; fee defaults
        // to 20 % (2_000 bps). Override via env at deploy time.
        address treasury = vm.envOr(
            "LPLENS_PROTOCOL_TREASURY",
            vm.addr(deployerKey)
        );
        uint16 feeBps = uint16(
            vm.envOr("LPLENS_PROTOCOL_FEE_BPS", uint256(2000))
        );

        vm.startBroadcast(deployerKey);

        LPLensReports reports = new LPLensReports();
        console2.log("LPLensReports deployed at", address(reports));

        LPLensAgent inft = new LPLensAgent(treasury, feeBps);
        console2.log("LPLensAgent deployed at", address(inft));
        console2.log("LPLensAgent treasury:", treasury);
        console2.log("LPLensAgent feeBps:", feeBps);

        // Optional: mint the agent iNFT to the deployer in the same tx.
        if (codeImage != bytes32(0)) {
            uint256 tokenId = inft.mint(codeImage, metadataUri);
            console2.log("LPLensAgent minted, tokenId:", tokenId);
        }

        vm.stopBroadcast();
    }
}
