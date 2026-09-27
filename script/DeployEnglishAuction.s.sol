// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {EnglishAuction} from "../src/EnglishAuction.sol";
import {console} from "forge-std/console.sol";

contract DeployEnglishAuction is Script {
    uint256 constant STARTING_BID = 0.01 ether;
    uint256 constant NFT_ID = 0;
    address constant NFT_ADDRESS = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
    function run() external returns (EnglishAuction) {
        vm.startBroadcast();
        EnglishAuction englishAuction = new EnglishAuction(NFT_ADDRESS, NFT_ID, STARTING_BID);
        vm.stopBroadcast();
        return englishAuction;
    }
}