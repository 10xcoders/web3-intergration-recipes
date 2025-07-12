# MetaMask Connection - React Implementation

A production-ready React hook and component for MetaMask wallet connections with TypeScript support.

## Features

- ✅ Complete wallet connection flow
- ✅ Custom React hook (`useWallet`)
- ✅ Auto-reconnection on page reload
- ✅ Network switching capabilities
- ✅ Account change detection
- ✅ Comprehensive error handling
- ✅ TypeScript support
- ✅ Mobile compatibility

## Quick Start

### Installation

```bash
npm install ethers @metamask/sdk
```

### Basic Usage

```tsx
import React from 'react';
import { useWallet } from './hooks/useWallet';

function WalletButton() {
  const { address, connect, disconnect, isConnecting } = useWallet();

  if (address) {
    return (
      <button onClick={disconnect}>
        Disconnect {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button onClick={connect} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
    </button>
  );
}
```

## Hook API

### useWallet()

Returns an object with wallet state and methods:

```typescript
interface WalletHook {
  // State
  address: string | null;           // Connected wallet address
  provider: BrowserProvider | null; // ethers.js provider
  signer: JsonRpcSigner | null;     // ethers.js signer
  chainId: number | null;           // Current network chain ID
  isConnecting: boolean;            // Connection loading state
  error: string | null;             // Error message

  // Methods
  connect: () => Promise<void>;                    // Connect wallet
  disconnect: () => void;                         // Disconnect wallet
  switchNetwork: (chainId: number) => Promise<void>; // Switch network
}
```

### Connection States

```tsx
function ConnectionStatus() {
  const { address, chainId, error, isConnecting } = useWallet();

  if (isConnecting) return <div>Connecting to wallet...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!address) return <div>Wallet not connected</div>;
  
  return (
    <div>
      <p>Connected: {address}</p>
      <p>Network: Chain ID {chainId}</p>
    </div>
  );
}
```

## Network Management

### Switch Networks

```tsx
function NetworkSwitcher() {
  const { switchNetwork, chainId } = useWallet();

  const networks = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    137: 'Polygon Mainnet'
  };

  return (
    <div>
      <p>Current: {networks[chainId] || 'Unknown'}</p>
      {Object.entries(networks).map(([id, name]) => (
        <button
          key={id}
          onClick={() => switchNetwork(Number(id))}
          disabled={chainId === Number(id)}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
```

## Error Handling

The hook provides comprehensive error handling:

```tsx
function ErrorDisplay() {
  const { error } = useWallet();

  if (!error) return null;

  const getErrorAction = (error: string) => {
    if (error.includes('MetaMask not detected')) {
      return (
        <a href="https://metamask.io/download/" target="_blank">
          Install MetaMask
        </a>
      );
    }
    if (error.includes('rejected by user')) {
      return <span>Please approve the connection request</span>;
    }
    return <span>Please try again</span>;
  };

  return (
    <div className="error">
      <p>{error}</p>
      {getErrorAction(error)}
    </div>
  );
}
```

## Advanced Usage

### Context Provider

For app-wide wallet state, wrap your app in a context provider:

```tsx
// WalletContext.tsx
import React, { createContext, useContext } from 'react';
import { useWallet } from './hooks/useWallet';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const wallet = useWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
}
```

### Transaction Helper

```tsx
function TransactionExample() {
  const { signer, address } = useWallet();

  const sendTransaction = async () => {
    if (!signer || !address) return;

    try {
      const tx = await signer.sendTransaction({
        to: "0x...",
        value: ethers.parseEther("0.01")
      });
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <button onClick={sendTransaction} disabled={!signer}>
      Send Transaction
    </button>
  );
}
```

## Testing

### Unit Tests

```typescript
// useWallet.test.ts
import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../hooks/useWallet';

// Mock window.ethereum
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
});

describe('useWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect wallet successfully', async () => {
    mockEthereum.request.mockResolvedValue(['0x123...']);
    
    const { result } = renderHook(() => useWallet());
    
    await act(async () => {
      await result.current.connect();
    });
    
    expect(result.current.address).toBe('0x123...');
  });

  it('should handle connection errors', async () => {
    mockEthereum.request.mockRejectedValue({ code: 4001 });
    
    const { result } = renderHook(() => useWallet());
    
    await act(async () => {
      await result.current.connect();
    });
    
    expect(result.current.error).toBe('Connection rejected by user');
  });
});
```

## Troubleshooting

### Common Issues

1. **MetaMask not detected**
   - Ensure MetaMask is installed
   - Check if user is on a supported browser

2. **Connection rejected**
   - User cancelled the connection request
   - Show clear instructions to retry

3. **Wrong network**
   - Guide users to switch networks
   - Provide automatic network switching

4. **Auto-connect not working**
   - Check if connection permission was granted
   - Verify localStorage is accessible

### Debug Mode

Add debug logging to the hook:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[useWallet] ${message}`, data);
  }
}
```

## Production Considerations

- Add proper error boundaries
- Implement connection timeouts
- Cache provider instances
- Handle mobile-specific behaviors
- Add analytics for connection events
- Implement graceful degradation

This implementation provides a solid foundation for MetaMask integration in React applications with all the necessary error handling and edge cases covered.