import React from 'react';
import { WalletConnection } from './components/WalletConnection';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            MetaMask Connection Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A complete implementation of MetaMask wallet connection with error handling, 
            network switching, and persistent connection state.
          </p>
        </header>

        <main className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <WalletConnection />
          </div>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Features</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Connect to MetaMask wallet
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Auto-reconnect on page reload
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Handle account switching
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Network switching support
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Comprehensive error handling
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  TypeScript support
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Usage</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm text-gray-800 overflow-x-auto">
{`import { useWallet } from './hooks/useWallet';

function MyComponent() {
  const { address, connect, disconnect } = useWallet();
  
  return (
    <div>
      {address ? (
        <button onClick={disconnect}>
          Disconnect {address.slice(0, 6)}...
        </button>
      ) : (
        <button onClick={connect}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}`}
                </pre>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Security Notes</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Never store private keys in your application</li>
                <li>• Always validate user inputs</li>
                <li>• Use HTTPS in production</li>
                <li>• Handle all error cases gracefully</li>
                <li>• Validate network before transactions</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;