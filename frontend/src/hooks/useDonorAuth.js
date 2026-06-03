import { useState } from "react";

export default function useDonorAuth() {
  const [donorToken, setDonorToken] = useState(() => localStorage.getItem("donor_token"));
  const [donorEmail, setDonorEmail] = useState(() => localStorage.getItem("donor_email"));
  const [donorName, setDonorName] = useState(() => localStorage.getItem("donor_name"));
  
  const [donorWallets, setDonorWallets] = useState(() => {
    const w = localStorage.getItem("donor_wallets");
    return w ? JSON.parse(w) : [];
  });

  const loginDonor = ({ token, email, name, wallets }) => {
    localStorage.setItem("donor_token", token);
    localStorage.setItem("donor_email", email);
    localStorage.setItem("donor_name", name);
    if (wallets && wallets.length > 0) {
      localStorage.setItem("donor_wallets", JSON.stringify(wallets));
    } else {
      localStorage.removeItem("donor_wallets");
    }
    
    setDonorToken(token);
    setDonorEmail(email);
    setDonorName(name);
    setDonorWallets(wallets || []);
  };

  const logoutDonor = () => {
    localStorage.removeItem("donor_token");
    localStorage.removeItem("donor_email");
    localStorage.removeItem("donor_name");
    localStorage.removeItem("donor_wallets");
    
    setDonorToken(null);
    setDonorEmail(null);
    setDonorName(null);
    setDonorWallets([]);
  };

  const addWalletAddress = (wallet) => {
    const updated = [...donorWallets, wallet];
    localStorage.setItem("donor_wallets", JSON.stringify(updated));
    setDonorWallets(updated);
  };
  
  const removeWalletAddress = (wallet) => {
    const updated = donorWallets.filter(w => w.toLowerCase() !== wallet.toLowerCase());
    localStorage.setItem("donor_wallets", JSON.stringify(updated));
    setDonorWallets(updated);
  };

  return {
    donorToken,
    donorEmail,
    donorName,
    donorWallets,
    isDonorAuthenticated: !!donorToken,
    loginDonor,
    logoutDonor,
    addWalletAddress,
    removeWalletAddress
  };
}
