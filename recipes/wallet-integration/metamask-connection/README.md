# MetaMask Connection Recipe

A comprehensive guide to implementing MetaMask wallet connections with proper error handling, network management, and user experience considerations.

## Use Cases

- Connect user wallets to your dApp
- Handle network switching and account changes
- Manage connection state across page refreshes
- Provide fallbacks for mobile and different browsers

## Prerequisites

- Node.js 18+
- Basic understanding of Ethereum and web3
- MetaMask browser extension installed (for testing)

## Quick Start

### Installation

```bash
npm install ethers @metamask/sdk
```

### Basic Connection

```typescript
import { ethers } from 'ethers';

async function connectWallet() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    return {
      address: accounts[0],
      provider,
      signer
    };
  } catch (error) {
    console.error('Connection failed:', error);
    throw error;
  }
}
```

## Implementation Guides

- [Vanilla JavaScript](./vanilla-js/README.md) - Pure JS implementation
- [React](./react/README.md) - React hooks and context
- [Vue](./vue/README.md) - Vue 3 composition API

## Features Covered

### ✅ Connection Management
- Detect MetaMask availability
- Request wallet connection
- Handle user rejection
- Auto-reconnect on page reload

### ✅ Network Handling
- Detect current network
- Switch networks programmatically
- Handle network changes
- Validate supported networks

### ✅ Account Management
- Get connected accounts
- Handle account switching
- Monitor account changes
- Disconnect functionality

### ✅ Error Handling
- User-friendly error messages
- Fallback for mobile browsers
- Connection timeout handling
- Network-specific errors

## Advanced Features

### Auto-Connect on Page Load

```typescript
export async function autoConnect(): Promise<WalletConnection | null> {
  try {
    if (!window.ethereum) return null;

    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });

    if (accounts.length === 0) return null;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();

    return {
      address: accounts[0],
      provider,
      signer,
      network: network.name,
      chainId: Number(network.chainId)
    };
  } catch (error) {
    console.error('Auto-connect failed:', error);
    return null;
  }
}
```

### Network Switching

```typescript
export async function switchNetwork(chainId: number): Promise<void> {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      throw new Error('Network not added to MetaMask');
    }
    throw switchError;
  }
}
```

### Event Listeners

```typescript
export function setupEventListeners(
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void,
  onDisconnect: () => void
) {
  if (!window.ethereum) return;

  window.ethereum.on('accountsChanged', onAccountsChanged);
  window.ethereum.on('chainChanged', onChainChanged);
  window.ethereum.on('disconnect', onDisconnect);

  // Cleanup function
  return () => {
    window.ethereum.removeListener('accountsChanged', onAccountsChanged);
    window.ethereum.removeListener('chainChanged', onChainChanged);
    window.ethereum.removeListener('disconnect', onDisconnect);
  };
}
```

## Common Issues

### MetaMask Not Detected
```typescript
if (!window.ethereum) {
  // Show install prompt or redirect to MetaMask download
  window.open('https://metamask.io/download/', '_blank');
  return;
}
```

### User Rejected Connection
```typescript
catch (error: any) {
  if (error.code === 4001) {
    setError('Connection rejected by user');
  } else {
    setError('Failed to connect wallet');
  }
}
```

### Mobile Compatibility
```typescript
function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function openMetaMaskMobile(dappUrl: string) {
  if (isMobile()) {
    window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
  }
}
```

## Security Considerations

- **Never store private keys**: Always use the user's wallet for signing
- **Validate network**: Ensure users are on the correct network
- **Handle permissions**: Request only necessary permissions
- **Sanitize inputs**: Validate all user inputs before processing
- **Use HTTPS**: Always serve your dApp over HTTPS in production

## Testing

### Local Testing
1. Install MetaMask browser extension
2. Switch to a testnet (Goerli, Sepolia)
3. Get testnet ETH from a faucet
4. Test all connection flows

### Error Scenarios to Test
- MetaMask not installed
- User rejects connection
- Wrong network selected
- Account switching
- Network connectivity issues

## Performance Tips

- Cache provider instances
- Minimize unnecessary wallet calls
- Use event listeners for state updates
- Implement connection timeouts
- Lazy load wallet connections

## Browser Support

- ✅ Chrome/Chromium browsers with MetaMask
- ✅ Firefox with MetaMask
- ✅ Safari with MetaMask (limited)
- ✅ Mobile browsers (with MetaMask app)
- ❌ Internet Explorer (not supported)

## Further Reading

- [MetaMask Developer Documentation](https://docs.metamask.io/)
- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [ethers.js Documentation](https://docs.ethers.io/)
- [Web3 Security Best Practices](../../docs/security-considerations.md)