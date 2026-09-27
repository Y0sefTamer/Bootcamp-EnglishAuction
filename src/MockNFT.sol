// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4);
}

contract MockNFT {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    string public constant name = "English Auction NFT";
    string public constant symbol = "EANFT";

    address public immutable owner;

    mapping(uint256 tokenId => address holder) private _owners;
    mapping(address owner => uint256 balance) private _balances;
    mapping(uint256 tokenId => address approved) private _tokenApprovals;
    mapping(address owner => mapping(address operator => bool approved)) private _operatorApprovals;

    error NotAuthorized();
    error NotOwner();
    error WrongFrom();
    error AlreadyMinted();
    error InvalidReceiver();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function balanceOf(address account) external view returns (uint256) {
        if (account == address(0)) revert ZeroAddress();
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address holder = _owners[tokenId];
        if (holder == address(0)) revert NotOwner();
        return holder;
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address account, address operator) external view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (_owners[tokenId] != address(0)) revert AlreadyMinted();
        _owners[tokenId] = to;
        _balances[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function approve(address to, uint256 tokenId) external {
        address holder = ownerOf(tokenId);
        if (msg.sender != holder && !_operatorApprovals[holder][msg.sender]) revert NotAuthorized();
        _tokenApprovals[tokenId] = to;
        emit Approval(holder, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        if (operator == msg.sender) revert NotAuthorized();
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transfer(address to, uint256 tokenId) external returns (bool) {
        return transferFrom(msg.sender, to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public returns (bool) {
        if (to == address(0)) revert ZeroAddress();
        address holder = ownerOf(tokenId);
        if (holder != from) revert WrongFrom();
        if (msg.sender != holder && !_operatorApprovals[holder][msg.sender] && _tokenApprovals[tokenId] != msg.sender) {
            revert NotAuthorized();
        }

        delete _tokenApprovals[tokenId];
        _owners[tokenId] = to;
        _balances[from] -= 1;
        _balances[to] += 1;
        emit Transfer(from, to, tokenId);
        return true;
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external returns (bool) {
        transferFrom(from, to, tokenId);

        if (to.code.length > 0) {
            bytes4 retval = IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, "");
            if (retval != IERC721Receiver.onERC721Received.selector) revert InvalidReceiver();
        }
        return true;
    }
}
