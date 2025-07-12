import React from 'react';
import { useWallet } from '../../hooks/useWallet';
import { shortenAddress } from '../../utils/format';

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          {shortenAddress(address)}
        </div>
        <button
          onClick={disconnect}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        ${isConnecting 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }
      `}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}