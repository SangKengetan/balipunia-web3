import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  getWithdrawDetail,
  setReadyForVoting,
  notifyProposeVoting,
} from "../../api/trustee.api";
import {
  proposeWithdraw,
  voteProposal, getProposal
} from "../../services/blockchain/voting";



export default function TrusteeWithdrawDetail() {
  const { id } = useParams();

  const [voting, setVoting] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null); // ready | propose | vote
  const [error, setError] = useState(null);

  // OPSI 1: READY hanya logika frontend
  const [ready, setReady] = useState(false);

  // UX voting
  const [hasVoted, setHasVoted] = useState(false);

  /* ===============================
     FETCH
  =============================== */
  const refresh = useCallback(async () => {
    const res = await getWithdrawDetail(id);
    setData(res.data ?? res);
  }, [id]);
  const fetchVoting = useCallback(async () => {
    if (!data?.governance_proposal_id) return;

    try {
      const proposal = await getProposal(
        data.governance_proposal_id
      );
      setVoting(proposal);
    } catch (err) {
      console.error("Gagal fetch voting:", err);
    }
  }, [data]);

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch {
        setError("Gagal memuat data withdraw");
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">Data tidak ditemukan</div>;

  /* ===============================
     ACTION HANDLERS
  =============================== */
  const handleReady = async () => {
    try {
      setLoadingAction("ready");
      setError(null);

      await setReadyForVoting(id); // validasi backend
      setReady(true);              // logika lokal
    } catch (err) {
      setError(err.response?.data?.message || "Gagal set ready");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePropose = async () => {
    try {
      setLoadingAction("propose");
      setError(null);

      // 1️⃣ MetaMask → Smart Contract
      const proposalId = await proposeWithdraw(
        data.onchain_campaign_id
      );

      // 2️⃣ Backend → simpan proposalId & ubah status
      await notifyProposeVoting(id, proposalId);

      // reset UX
      setReady(false);
      setHasVoted(false);

      await refresh();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Gagal propose voting"
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVote = async (support) => {
    try {
      setLoadingAction("vote");
      setError(null);

      await voteProposal(
        data.governance_proposal_id,
        support
      );

      setHasVoted(true); // UX guard

      alert(
        support
          ? "Vote APPROVE berhasil dikirim"
          : "Vote REJECT berhasil dikirim"
      );

      await refresh();
    } catch (err) {
      setError(
        err.message ||
        "Anda sudah melakukan vote atau transaksi gagal"
      );
    } finally {
      setLoadingAction(null);
    }
  };

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">
        Withdraw Detail (Trustee)
      </h1>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* INFO */}
      <div className="bg-gray-50 p-4 rounded space-y-1 text-sm">
        <p><strong>Campaign:</strong> {data.campaign_title}</p>
        <p>
          <strong>Status:</strong>{" "}
          <span className="px-2 py-1 rounded bg-gray-200">
            {data.status}
          </span>
        </p>
      </div>

      {/* SNAPSHOT */}
      <div className="bg-blue-50 p-4 rounded text-sm">
        <p className="font-medium mb-1">Saldo Snapshot</p>
        {renderAmountSnapshot(data.amount_snapshot)}
        <p className="text-xs text-gray-600 mt-2">
          Snapshot hanya untuk laporan & verifikasi.
        </p>
      </div>

      {/* IPFS */}
      <a
        href={`https://ipfs.io/ipfs/${data.ipfs_cid}`}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 underline text-sm"
      >
        Lihat Dokumen Pendukung (IPFS)
      </a>

      {/* ===============================
          ACTIONS
      =============================== */}
      <div className="space-y-3">
        {/* REQUESTED → READY */}
        {data.status === "REQUESTED" && !ready && (
          <button
            onClick={handleReady}
            disabled={loadingAction === "ready"}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded"
          >
            {loadingAction === "ready"
              ? "Memproses..."
              : "Set Ready for Voting"}
          </button>
        )}

        {/* REQUESTED + ready → PROPOSE */}
        {data.status === "REQUESTED" && ready && (
          <button
            onClick={handlePropose}
            disabled={loadingAction === "propose"}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loadingAction === "propose"
              ? "Menunggu MetaMask..."
              : "Propose Voting (MetaMask)"}
          </button>
        )}

        {/* VOTING → VOTE */}
        {data.status === "VOTING_IN_PROGRESS" &&
          data.governance_proposal_id && (
            <div className="bg-yellow-50 p-4 rounded space-y-4">

              {/* 🔹 VOTING INDICATOR */}
              {data.voting && (
                <div className="border rounded p-3 bg-white text-sm space-y-2">
                  <p className="font-medium">Status Voting</p>

                  <div className="flex justify-between">
                    <span>YES</span>
                    <span className="font-semibold text-green-600">
                      {data.voting.yesVotes}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>NO</span>
                    <span className="font-semibold text-red-600">
                      {data.voting.noVotes}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>{data.voting.votesCount} / 3</span>
                  </div>

                  {hasVoted && (
                    <div className="text-xs text-green-600">
                      ✔️ Anda sudah memberikan suara
                    </div>
                  )}
                </div>
              )}

              {/* 🔹 VOTE BUTTONS (HANYA JIKA BELUM VOTE) */}
              {!hasVoted && (
                <>
                  <p className="text-xs text-gray-700">
                    Voting bersifat final dan hanya dapat dilakukan satu kali.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(true)}
                      disabled={loadingAction === "vote"}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVote(false)}
                      disabled={loadingAction === "vote"}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded"
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
        )}


        {/* FINAL */}
        {(data.status === "EXECUTED" ||
          data.status === "REJECTED") && (
          <div className="text-sm text-gray-600">
            Proses withdraw telah selesai.
          </div>
        )}
      </div>
    </div>
  );
}

/* ===============================
   HELPERS
=============================== */
function renderAmountSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "string") {
    return <div>-</div>;
  }

  const usdt = snapshot.match(/USDT:\s*([\d.]+)/)?.[1] || "0";
  const usdc = snapshot.match(/USDC:\s*([\d.]+)/)?.[1] || "0";

  return (
    <div className="space-y-1">
      <div>USDT: {usdt}</div>
      <div>USDC: {usdc}</div>
    </div>
  );
}
