import React from 'react';
import { useWallet } from '../hooks/useWallet';

const SUPPORTED_NETWORKS = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Polygon Mumbai',
};

export function WalletConnection() {
  const { 
    address, 
    chainId, 
    isConnecting, 
    error, 
    connect, 
    disconnect, 
    switchNetwork 
  } = useWallet();

  const isConnected = !!address;
  const networkName = chainId ? SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS] : 'Unknown';

  const handleNetworkSwitch = async (targetChainId: number) => {
    await switchNetwork(targetChainId);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Wallet Connection
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center">
          <button
            onClick={connect}
            disabled={isConnecting}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              isConnecting
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
          
          <p className="mt-4 text-sm text-gray-600">
            Don't have MetaMask?{' '}
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Install here
            </a>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">Connected</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-sm text-green-700 break-all">
              {address}
            </p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Network</h3>
            <p className="text-sm text-gray-600">
              {networkName} (Chain ID: {chainId})
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Switch Network</h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(SUPPORTED_NETWORKS).map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => handleNetworkSwitch(Number(id))}
                  disabled={chainId === Number(id)}
                  className={`py-2 px-3 text-sm rounded-md transition-colors ${
                    chainId === Number(id)
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {name} {chainId === Number(id) && '(Current)'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={disconnect}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Status</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Connection: {isConnected ? 'Connected' : 'Disconnected'}</li>
          <li>• Network: {networkName}</li>
          <li>• Auto-reconnect: {localStorage.getItem('walletConnected') ? 'Enabled' : 'Disabled'}</li>
        </ul>
      </div>
    </div>
  );
}