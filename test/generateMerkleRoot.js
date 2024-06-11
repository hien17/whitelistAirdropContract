const { MerkleTree } = require('merkletreejs');
const { utils } = require('ethers');

const hashNode = (account, amount) => {
    return Buffer.from(
        utils.solidityKeccak256(
            ["address", "uint256"],
            [account, amount]
        ).slice(2),
        "hex"
    );
};

const generateMerkleTree = (data) => {
    const leaves = Object.entries(data).map(([account, amount]) => hashNode(account, amount));
    const merkleTree = new MerkleTree(leaves, utils.keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getHexRoot();
    return [merkleRoot, merkleTree];
};

const generateProof = (address, amount, merkleTree) => {
    const leaf = hashNode(address, amount);
    return merkleTree.getHexProof(leaf);
};

module.exports = { generateMerkleTree, generateProof };
