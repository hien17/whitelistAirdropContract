// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract WhitelistAirdrop is ERC721Enumerable, Ownable {

    using ECDSA for bytes32;

    bytes32 public _whitelistMerkleRoot;
    uint256 public _whitelistAirdropValidTimestamp;
    address public _owner;

    mapping (bytes32 => mapping (address => bool)) public isClaimed;
    constructor(uint256 validTimestamp) ERC721("Merkle Tree Whitelist", "MTW") {
        _owner = msg.sender;
        _whitelistAirdropValidTimestamp = validTimestamp;
    }

    /// @notice Function to claim NFT for user in whitelist
    /// @dev If merkle root is not created or this time is not after valid time of user has claimed before , it will be reverted
    /// proof can be get from fe or be use const hexProof = tree.getHexProof(leaf);
    /// @param proof The proof to verify if address is in the whitelist
    /// @param amount Amount NFTs for the user to claim
    function whitelistSale(bytes32[] memory proof, uint256 amount) external payable {
        require(block.timestamp >= _whitelistAirdropValidTimestamp, "Airdrop time has not started yet");
        require(!isClaimed[_whitelistMerkleRoot][msg.sender], "User has claimed before.");

        //  Merkle tree list related
        require(_whitelistMerkleRoot != "", "Free Claim merkle tree not set");
        require(
            MerkleProof.verify(
                proof,
                _whitelistMerkleRoot,
                keccak256(abi.encodePacked(msg.sender, amount))
            ),
            "Free Claim validation failed"
        );

        isClaimed[_whitelistMerkleRoot][msg.sender] = true;
    
        //  Start mining
        uint256 currentSupply = totalSupply();
        
        // Mining amount of nfts for the user
        for (uint256 i = 1; i <= amount; i++) {
            _safeMint(msg.sender, currentSupply + i);
        }
    } 

    /// @notice This function is used to set the merkle root
    /// @dev Only owner can set the merkle root
    /// @param newMerkleRoot The merkle root to be set
    function setWhitelistMerkleRoot(bytes32 newMerkleRoot) external onlyOwner {
        _whitelistMerkleRoot = newMerkleRoot;
    }

    /// @notice This function is used to set the timestamp that user in the whitelist can claim the NFT airdrop
    /// @dev Only owner can set the valid timestamp
    /// @param validTimestamp The valid timestamp of airdrop to be set
    function setWhitelistAirdropTime(uint256 validTimestamp) public onlyOwner {
        _whitelistAirdropValidTimestamp = validTimestamp;
    }

    function hasClaimed(bytes32 whitelistMerkleRoot) public view returns (bool){
        return isClaimed[whitelistMerkleRoot][msg.sender];
    }
}