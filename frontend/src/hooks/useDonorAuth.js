import { useState } from "react";

export default function useDonorAuth() {
  const [donorToken, setDonorToken] = useState(() => localStorage.getItem("donor_token"));
  const [donorEmail, setDonorEmail] = useState(() => localStorage.getItem("donor_email"));
  const [donorName, setDonorName] = useState(() => localStorage.getItem("donor_name"));
  const [donorWallet, setDonorWallet] = useState(() => localStorage.getItem("donor_wallet"));

  const loginDonor = ({ token, email, name, wallet_address }) => {
    localStorage.setItem("donor_token", token);
    localStorage.setItem("donor_email", email);
    localStorage.setItem("donor_name", name);
    if (wallet_address) {
      localStorage.setItem("donor_wallet", wallet_address);
    } else {
      localStorage.removeItem("donor_wallet");
    }
    setDonorToken(token);
    setDonorEmail(email);
    setDonorName(name);
    setDonorWallet(wallet_address || null);
  };

  const logoutDonor = () => {
    localStorage.removeItem("donor_token");
    localStorage.removeItem("donor_email");
    localStorage.removeItem("donor_name");
    localStorage.removeItem("donor_wallet");
    setDonorToken(null);
    setDonorEmail(null);
    setDonorName(null);
    setDonorWallet(null);
  };

  const updateWalletAddress = (wallet) => {
    localStorage.setItem("donor_wallet", wallet);
    setDonorWallet(wallet);
  };

  return {
    donorToken,
    donorEmail,
    donorName,
    donorWallet,
    isDonorAuthenticated: !!donorToken,
    loginDonor,
    logoutDonor,
    updateWalletAddress,
  };
}
