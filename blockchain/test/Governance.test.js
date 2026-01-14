const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Governance (Majority Voting 2/3)", function () {
  let owner, trustee1, trustee2, trustee3, nonTrustee;
  let governance, vault;

  beforeEach(async function () {
    [owner, trustee1, trustee2, trustee3, nonTrustee] =
      await ethers.getSigners();

    // Deploy Mock DonationVault (ethers v5 style)
    const Vault = await ethers.getContractFactory("MockDonationVault");
    vault = await Vault.deploy();
    await vault.deployed();

    // Deploy Governance
    const Governance = await ethers.getContractFactory("Governance");
    governance = await Governance.deploy(
      vault.address,
      [trustee1.address, trustee2.address, trustee3.address]
    );
    await governance.deployed();
  });

  it("Should allow trustee to propose withdraw", async function () {
    await expect(
      governance
        .connect(trustee1)
        .proposeWithdraw(1, owner.address)
    ).to.emit(governance, "WithdrawProposed");
  });

  it("Should reject non-trustee proposing", async function () {
    await expect(
      governance
        .connect(nonTrustee)
        .proposeWithdraw(1, owner.address)
    ).to.be.reverted;
  });

  it("Should allow each trustee to vote only once", async function () {
    await governance
      .connect(trustee1)
      .proposeWithdraw(1, owner.address);

    await governance.connect(trustee1).vote(1, true);

    await expect(
      governance.connect(trustee1).vote(1, true)
    ).to.be.reverted;
  });

  it("Should execute withdraw if majority approves (2 yes, 1 no)", async function () {
    await governance
      .connect(trustee1)
      .proposeWithdraw(1, owner.address);

    await governance.connect(trustee1).vote(1, true);
    await governance.connect(trustee2).vote(1, true);

    // vote ke-3 memicu finalize + withdraw
    await expect(
      governance.connect(trustee3).vote(1, false)
    ).to.emit(vault, "WithdrawCalled");

    const proposal = await governance.getProposal(1);

    expect(proposal.finalized).to.equal(true);
    expect(proposal.executed).to.equal(true);
  });

  it("Should NOT execute withdraw if rejected (2 no, 1 yes)", async function () {
    await governance
      .connect(trustee1)
      .proposeWithdraw(2, owner.address);

    await governance.connect(trustee1).vote(2, false);
    await governance.connect(trustee2).vote(2, false);
    await governance.connect(trustee3).vote(2, true);

    const proposal = await governance.getProposal(2);

    expect(proposal.finalized).to.equal(true);
    expect(proposal.executed).to.equal(false);
  });
});
