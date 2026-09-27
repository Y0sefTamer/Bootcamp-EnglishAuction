# Bootcamp English Auction Contract 🔨

A foundational English Auction smart contract project built as part of a Web3 Solidity Bootcamp. This repository demonstrates how to write, test, and deploy a decentralized open-ascending auction where participants bid on an asset (e.g., an NFT), and the highest bidder wins when the time expires.

## 🌟 Features

* **Open Bidding System:** Implements the classic English auction model involving a Seller and multiple Bidders.
* **Secure Fund Management:** The contract securely holds the current highest bid while safely tracking the balances of outbid participants.
* **Pull-over-Push Refunds:** Outbid participants can safely withdraw their locked ETH at any time using a withdrawal pattern, protecting against reentrancy attacks.
* **Time-Bound Execution:** The auction runs for a strictly defined duration. No bids are accepted once the deadline passes.
* **Custom Events:** Emits explicit events such as `Start`, `Bid`, `Withdraw`, and `End` to easily track auction activities on-chain.

## 🛠️ Tech Stack

* **Smart Contracts:** Solidity `^0.8.20`
* **Framework:** Foundry

## 🏛️ How It Works

1. **Deployment & Start:** The **Seller** deploys the contract, setting the asset being auctioned (like an NFT address and ID), the starting price, and the total duration of the auction.
2. **Bidding:** **Bidders** participate by calling the `bid()` function and sending ETH. Each new bid must be strictly higher than the current highest bid.
3. **Refunds:** When a bidder is outbid, their previous bid amount is added to a withdrawal mapping. They can call the `withdraw()` function at any time to claim their refunded ETH.
4. **Resolution:** Once the auction time expires, anyone can call the `end()` function. The contract then transfers the highest bid (ETH) to the **Seller** and the auctioned asset to the **Highest Bidder**. If no bids were placed, the asset is simply returned to the Seller.