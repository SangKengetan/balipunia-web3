const fs = require('fs');
const path = require('path');

const vaultArtifact = require('./artifacts/contracts/DonationVault.sol/DonationVault.json');
const votingArtifact = require('./artifacts/contracts/VotingV3.sol/VotingGovernance.json');

const backendVaultPath = '../backend/src/blockchain/abi/DonationVaultABI.json';
const backendVotingPath = '../backend/src/blockchain/abi/VotingABI.json';
const frontendVaultPath = '../frontend/src/services/blockchain/abi/DonationVaultABI.json';
const frontendVotingPath = '../frontend/src/services/blockchain/abi/VotingABI.json';

// Ensure frontend and backend abi directories exist if they didn't
fs.mkdirSync(path.dirname(backendVaultPath), { recursive: true });
fs.mkdirSync(path.dirname(frontendVaultPath), { recursive: true });

fs.writeFileSync(backendVaultPath, JSON.stringify(vaultArtifact.abi, null, 2));
fs.writeFileSync(frontendVaultPath, JSON.stringify(vaultArtifact.abi, null, 2));

fs.writeFileSync(backendVotingPath, JSON.stringify(votingArtifact.abi, null, 2));
fs.writeFileSync(frontendVotingPath, JSON.stringify(votingArtifact.abi, null, 2));

console.log("ABIs copied successfully!");
