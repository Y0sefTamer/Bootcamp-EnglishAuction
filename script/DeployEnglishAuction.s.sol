// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {EnglishAuction} from "../src/EnglishAuction.sol";
import {MockNFT} from "../src/MockNFT.sol";
import {console} from "forge-std/console.sol";

contract DeployEnglishAuction is Script {
    uint256 constant STARTING_BID = 0.01 ether;
    uint256 constant NFT_ID = 0;

    function run() external returns (EnglishAuction) {
        address deployer = msg.sender;

        vm.startBroadcast();

        MockNFT nft = new MockNFT();
        nft.mint(deployer, NFT_ID);

        EnglishAuction englishAuction = new EnglishAuction(address(nft), NFT_ID, STARTING_BID);
        nft.setApprovalForAll(address(englishAuction), true);

        vm.stopBroadcast();

        console.log("Deployer:  ", deployer);
        console.log("NFT:       ", address(nft));
        console.log("Auction:   ", address(englishAuction));
        console.log("Starting:  ", STARTING_BID);
        console.log("NFT ID:    ", NFT_ID);

        return englishAuction;
    }
}
