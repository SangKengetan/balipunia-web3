//services/blockchain/voting.js
import { ethers } from "ethers";
import { getProvider, getSigner } from "./provider";
import {
  VOTING_ADDRESS
} from "./constants";
import VotingABI from "./abi/VotingABI.json";

/** Read-only contract instance (tidak perlu MetaMask) */
function getReadOnlyVotingContract() {
  const provider = getProvider();
  return new ethers.Contract(VOTING_ADDRESS, VotingABI, provider);
}

export async function proposeWithdraw(campaignId) {
  const signer = await getSigner();

  const contract = new ethers.Contract(
    VOTING_ADDRESS,
    VotingABI,
    signer
  );

  try {
    const tx = await contract.requestWithdraw(campaignId);
    const receipt = await tx.wait();

    // ambil proposalId dari event
    const event = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "WithdrawRequested");

    if (!event) {
      throw new Error("WithdrawRequested event tidak ditemukan");
    }

    return event.args.proposalId.toString();
  } catch (err) {
    // Decode custom error dari Smart Contract
    const errorData = err?.data || err?.error?.data;
    if (errorData) {
      try {
        const decodedError = contract.interface.parseError(errorData);
        if (decodedError) {
          switch (decodedError.name) {
            case "ActiveProposalExists":
              // Proposal sudah ada, cari proposal aktif untuk campaign ini
              return await findExistingProposal(contract, campaignId);
            case "CampaignStillRunning":
              throw new Error("Periode kampanye belum berakhir. Pencairan dana hanya bisa diajukan setelah deadline kampanye terlewati.");
            case "CampaignAlreadyWithdrawn":
              throw new Error("Dana kampanye ini sudah pernah dicairkan sebelumnya.");
            case "CampaignNotOwnedByAdmin":
              throw new Error("Anda bukan pemilik kampanye ini di blockchain.");
            case "TrusteesNotSet":
              throw new Error("Trustee belum didaftarkan. Silakan daftarkan 3 Trustee terlebih dahulu di halaman pengaturan.");
            case "NotAdminPura":
              throw new Error("Wallet Anda tidak terdaftar sebagai Admin Pura di blockchain.");
            default:
              throw new Error(`Blockchain Error: ${decodedError.name}`);
          }
        }
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.startsWith("Blockchain Error")) {
          // Ini error user-friendly yang sudah kita throw di atas
          throw parseErr;
        }
      }
    }
    // Error tidak dikenali, lempar ulang
    throw err;
  }
}

/**
 * Cari proposal yang sudah ada (PENDING) untuk campaignId tertentu.
 * Digunakan ketika ActiveProposalExists terjadi.
 */
async function findExistingProposal(contract, campaignId) {
  const totalProposals = await contract.proposalCount();
  const count = Number(totalProposals);

  // Cari dari proposal terbaru ke terlama
  for (let i = count; i >= 1; i--) {
    try {
      const p = await contract.getProposal(i);
      // p.campaignId, p.status (0 = PENDING)
      if (p.campaignId.toString() === campaignId.toString() && Number(p.status) === 0) {
        console.log(`Ditemukan proposal aktif #${i} untuk campaign ${campaignId}`);
        return i.toString();
      }
    } catch {
      continue;
    }
  }

  throw new Error("Proposal aktif ditemukan di blockchain tetapi gagal diidentifikasi. Silakan hubungi administrator.");
}

/**
 * Trustee vote on proposal
 * @param {string|number} proposalId
 * @param {boolean} support  true = approve, false = reject
 */
export async function voteProposal(proposalId, support) {
  const signer = await getSigner();

  const contract = new ethers.Contract(
    VOTING_ADDRESS,
    VotingABI,
    signer
  );

  try {
    const tx = await contract.vote(proposalId, support);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      proposalId: proposalId.toString(),
      support,
    };
  } catch (err) {
    const errorData = err?.data || err?.error?.data;
    if (errorData) {
      try {
        const decodedError = contract.interface.parseError(errorData);
        if (decodedError) {
          switch (decodedError.name) {
            case "ProposalAlreadyFinalized":
              throw new Error("Voting sudah selesai — proposal telah di-finalize oleh suara mayoritas Trustee.");
            case "AlreadyVoted":
              throw new Error("Anda sudah memberikan suara pada proposal ini.");
            case "NotTrustee":
              throw new Error("Wallet Anda tidak terdaftar sebagai Trustee untuk Admin Pura ini.");
            case "InvalidProposal":
              throw new Error("Proposal tidak ditemukan di blockchain.");
            default:
              throw new Error(`Blockchain Error: ${decodedError.name}`);
          }
        }
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.startsWith("Blockchain Error")) {
          throw parseErr;
        }
      }
    }
    throw err;
  }
}

export async function getProposal(proposalId) {
  // Gunakan read-only contract (tidak perlu MetaMask/Signer)
  const contract = getReadOnlyVotingContract();
  const [
    campaignId,
    adminPura,
    yesVotes,
    noVotes,
    votesCount,
    status,
    executed,
  ] = await contract.getProposal(proposalId);

  const statusMap = { 0: "PENDING", 1: "APPROVED", 2: "REJECTED" };

  return {
    proposalId: proposalId.toString(),
    campaignId: campaignId.toString(),
    adminPura,
    yesVotes: Number(yesVotes),
    noVotes: Number(noVotes),
    votesCount: Number(votesCount),
    status: statusMap[Number(status)] ?? "UNKNOWN",
    executed: Boolean(executed),
  };
}