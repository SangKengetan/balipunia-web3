export default function ConnectWallet({ address, onConnect }) {
  return (
    <>
      {!address ? (
        <button
          onClick={onConnect}
          className="px-5 py-2 rounded-full bg-yellow-400 font-semibold"
        >
          Hubungkan
        </button>
      ) : (
        <span className="px-4 py-2 bg-white/80 rounded-full text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      )}
    </>
  );
}
