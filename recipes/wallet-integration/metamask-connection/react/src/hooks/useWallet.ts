import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

interface WalletHook extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

export function useWallet(): WalletHook {
  const [state, setState] = useState<WalletState>({
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<WalletState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const connect = useCallback(async () => {
    try {
      clearError();
      updateState({ isConnecting: true });

      if (!window.ethereum) {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      updateState({
        address: accounts[0],
        provider,
        signer,
        chainId: Number(network.chainId),
        isConnecting: false,
      });

      // Store connection state
      localStorage.setItem('walletConnected', 'true');

    } catch (error: any) {
      console.error('Connection failed:', error);
      updateState({
        isConnecting: false,
        error: getErrorMessage(error),
      });
    }
  }, [updateState, clearError]);

  const disconnect = useCallback(() => {
    updateState({
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      error: null,
    });
    localStorage.removeItem('walletConnected');
  }, [updateState]);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    try {
      clearError();

      if (!window.ethereum) {
        throw new Error('MetaMask not available');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      // Update chain ID after successful switch
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      updateState({ chainId: Number(network.chainId) });

    } catch (error: any) {
      if (error.code === 4902) {
        updateState({ error: 'Network not added to MetaMask' });
      } else if (error.code === 4001) {
        updateState({ error: 'Network switch rejected by user' });
      } else {
        updateState({ error: 'Failed to switch network' });
      }
    }
  }, [updateState, clearError]);

  // Auto-connect on page load
  useEffect(() => {
    const autoConnect = async () => {
      if (localStorage.getItem('walletConnected') === 'true') {
        try {
          if (!window.ethereum) return;

          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          }) as string[];

          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();

            updateState({
              address: accounts[0],
              provider,
              signer,
              chainId: Number(network.chainId),
            });
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          localStorage.removeItem('walletConnected');
        }
      }
    };

    autoConnect();
  }, [updateState]);

  // Setup event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        updateState({ address: accounts[0] });
      }
    };

    const handleChainChanged = (chainId: string) => {
      updateState({ chainId: parseInt(chainId, 16) });
    };

    const handleDisconnect = () => {
      disconnect();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
      window.ethereum?.removeListener('disconnect', handleDisconnect);
    };
  }, [updateState, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
  };
}

function getErrorMessage(error: any): string {
  if (error.code === 4001) {
    return 'Connection rejected by user';
  }
  if (error.code === -32002) {
    return 'Connection request already pending';
  }
  return error.message || 'An unexpected error occurred';
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}