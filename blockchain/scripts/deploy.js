async function main() {
  const USDT_BSC_TESTNET =
    "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684";

  const DonationVault = await ethers.getContractFactory("DonationVault");
  const vault = await DonationVault.deploy(USDT_BSC_TESTNET);

  await vault.deployed();

  console.log("DonationVault deployed to:", vault.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
