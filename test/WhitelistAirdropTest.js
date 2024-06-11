const { assert } = require("console");

describe("WhitelistAirdrop contract", async function() {
    let whitelistAirdrop;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function() {
        const { expect } = await import("chai");
        const {hre} = await import("hardhat");
        [owner, addr1, addr2] = await ethers.getSigners();
        const twoWeeks = 2 * 7 * 24 * 60 * 60; // 2 weeks in seconds
        // Deploy the contract
        whitelistAirdrop = await ethers.deployContract("WhitelistAirdrop",[(await ethers.provider.getBlock('latest')).timestamp+twoWeeks]);
    });
    
    it('Deployment should be successful', async function () {
        const { expect } = await import("chai");
        expect(await whitelistAirdrop.owner()).to.equal(owner.address);
        expect(await whitelistAirdrop.name()).to.equal('Merkle Tree Whitelist');
        expect(await whitelistAirdrop.symbol()).to.equal('MTW');
    });
    it('Should allow owner to set the whitelist merkle root', async function () {
        const { expect } = await import("chai");

        // Set the whitelist merkle root
        const newMerkleRoot = "0x0123456789abcdef" + "0".repeat(48); 
        await whitelistAirdrop.setWhitelistMerkleRoot(newMerkleRoot);

        expect(await whitelistAirdrop._whitelistMerkleRoot()).to.equal(newMerkleRoot);
    });
    it('Should revert when non-owner tries to set the whitelist merkle root', async function () {
        const {expect,assert } = await import("chai");
        // import("@nomicfoundation/hardhat-chai-matchers");
        // Attempt to set the whitelist merkle root by a non-owner
        try {
            const newMerkleRoot = "0x0123456789abcdef" + "0".repeat(48);
            assert(await whitelistAirdrop.connect(addr1).setWhitelistMerkleRoot(newMerkleRoot));
        }
        catch (err) {
            assert(err);
        }
    });
    it('Should allow whitelisted users to claim NFTs', async function () {
        const { expect } = await import("chai");
        const { MerkleTree } = await import('merkletreejs');
        const { utils } = await import('ethers');
        const {keccak256} = await import('ethers');
        const {generateMerkleTree, generateProof} = await import("./generateMerkleRoot.js");

        const [owner, addr1, addr2] = await ethers.getSigners();
        console.log(addr1.address)
        
        // Define amount airdrop for testcase
        const amount = 1;

        const whitelist = {
            [addr1.address]: amount,
            "0xcff3bB7e0c0F963087cf568bCC3107Ecb8a3B536": 2
        };

        const [merkleRoot, merkleTree] = generateMerkleTree(whitelist);
        const [proof] = generateProof(addr1.address, amount, merkleTree);

        await whitelistAirdrop.setWhitelistMerkleRoot(merkleRoot);
    
        // Attempt to claim NFTs before the valid timestamp
        try {
            
            assert(await whitelistAirdrop.connect(addr1).whitelistSale([proof], amount));
        }
        catch (error) {
            assert(error);
        }

        const twoWeeks = 2 * 7 * 24 * 60 * 60; // 2 weeks in seconds
        await hre.ethers.provider.send("evm_increaseTime", [twoWeeks]);

        // Claim NFTs
        await whitelistAirdrop.connect(addr1).whitelistSale([proof], amount);
    
        // Verify that NFTs are minted to the user
        expect(await whitelistAirdrop.connect(addr1).hasClaimed(merkleRoot)).to.equal(true);
    });
    
});
