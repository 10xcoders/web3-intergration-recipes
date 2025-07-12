# Architecture Patterns for Web3 Applications

This guide outlines recommended architectural patterns for building scalable, maintainable web3 applications.

## Table of Contents

- [Application Architecture](#application-architecture)
- [State Management](#state-management)
- [Component Patterns](#component-patterns)
- [Error Boundaries](#error-boundaries)
- [Performance Optimization](#performance-optimization)
- [Testing Architecture](#testing-architecture)

## Application Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│           UI Layer                  │
│  Components, Hooks, Context         │
├─────────────────────────────────────┤
│         Business Logic Layer        │
│  Services, Utilities, Validators    │
├─────────────────────────────────────┤
│         Web3 Integration Layer      │
│  Providers, Contracts, Wallets      │
├─────────────────────────────────────┤
│         External APIs Layer         │
│  RPC, Subgraph, Price APIs          │
└─────────────────────────────────────┘
```

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── wallet/          # Wallet-specific components
│   └── forms/           # Form components
├── hooks/               # Custom React hooks
│   ├── useWallet.ts     # Wallet connection hook
│   ├── useContract.ts   # Contract interaction hook
│   └── useTransaction.ts # Transaction management
├── services/            # Business logic services
│   ├── web3.ts          # Web3 service layer
│   ├── contracts.ts     # Contract service
│   └── api.ts           # External API service
├── utils/               # Utility functions
│   ├── contract-helpers/
│   ├── validation/
│   └── error-handling/
├── types/               # TypeScript definitions
│   ├── contracts.ts
│   ├── wallet.ts
│   └── api.ts
├── constants/           # Application constants
│   ├── networks.ts
│   ├── contracts.ts
│   └── errors.ts
└── context/             # React context providers
    ├── WalletContext.tsx
    ├── Web3Context.tsx
    └── TransactionContext.tsx
```

## State Management

### Context-Based Architecture

#### Web3 Provider Pattern

```typescript
// Web3Context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Web3ContextType>({
    provider: null,
    signer: null,
    chainId: null,
    isConnected: false,
  });

  useEffect(() => {
    const initializeWeb3 = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        
        setState(prev => ({
          ...prev,
          provider,
          chainId: Number(network.chainId),
        }));

        // Check if already connected
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          setState(prev => ({
            ...prev,
            signer,
            isConnected: true,
          }));
        }
      }
    };

    initializeWeb3();
  }, []);

  return (
    <Web3Context.Provider value={state}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
}
```

#### Transaction State Management

```typescript
// TransactionContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface Transaction {
  id: string;
  hash?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  type: string;
  timestamp: number;
}

interface TransactionState {
  transactions: Transaction[];
  pending: Transaction[];
}

type TransactionAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'CLEAR_TRANSACTIONS' };

function transactionReducer(state: TransactionState, action: TransactionAction): TransactionState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        pending: action.payload.status === 'pending' 
          ? [action.payload, ...state.pending]
          : state.pending,
      };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(tx =>
          tx.id === action.payload.id
            ? { ...tx, ...action.payload.updates }
            : tx
        ),
        pending: state.pending
          .filter(tx => tx.id !== action.payload.id)
          .concat(
            action.payload.updates.status === 'pending'
              ? [{ ...state.transactions.find(tx => tx.id === action.payload.id)!, ...action.payload.updates }]
              : []
          ),
      };

    case 'REMOVE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(tx => tx.id !== action.payload),
        pending: state.pending.filter(tx => tx.id !== action.payload),
      };

    case 'CLEAR_TRANSACTIONS':
      return { transactions: [], pending: [] };

    default:
      return state;
  }
}

const TransactionContext = createContext<{
  state: TransactionState;
  dispatch: React.Dispatch<TransactionAction>;
} | null>(null);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(transactionReducer, {
    transactions: [],
    pending: [],
  });

  return (
    <TransactionContext.Provider value={{ state, dispatch }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}
```

### Service Layer Pattern

```typescript
// services/web3.ts
import { ethers } from 'ethers';
import { ContractFactory, GasUtils } from '../utils/contract-helpers';

export class Web3Service {
  private provider: ethers.BrowserProvider;
  private contractFactory: ContractFactory;

  constructor(provider: ethers.BrowserProvider) {
    this.provider = provider;
    this.contractFactory = new ContractFactory(provider);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    const contract = this.contractFactory.getERC20Contract(tokenAddress);
    const balance = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  }

  async estimateGas(
    contractAddress: string,
    abi: ethers.InterfaceAbi,
    method: string,
    args: any[]
  ): Promise<bigint> {
    const contract = this.contractFactory.getContract(contractAddress, abi);
    return await GasUtils.estimateGasWithBuffer(contract, method, args);
  }

  getContract(address: string, abi: ethers.InterfaceAbi, signer?: ethers.Signer): ethers.Contract {
    return this.contractFactory.getContract(address, abi, signer);
  }
}
```

## Component Patterns

### Container/Presentation Pattern

```typescript
// containers/WalletConnectionContainer.tsx
import React from 'react';
import { WalletConnection } from '../components/WalletConnection';
import { useWallet } from '../hooks/useWallet';
import { useTransactions } from '../context/TransactionContext';

export function WalletConnectionContainer() {
  const wallet = useWallet();
  const { dispatch } = useTransactions();

  const handleConnect = async () => {
    const transactionId = `connect-${Date.now()}`;
    
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        id: transactionId,
        status: 'pending',
        type: 'wallet_connection',
        timestamp: Date.now(),
      }
    });

    try {
      await wallet.connect();
      
      dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: {
          id: transactionId,
          updates: { status: 'success' }
        }
      });
    } catch (error: any) {
      dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: {
          id: transactionId,
          updates: { status: 'error', error: error.message }
        }
      });
    }
  };

  return (
    <WalletConnection
      isConnected={wallet.isConnected}
      address={wallet.address}
      isConnecting={wallet.isConnecting}
      error={wallet.error}
      onConnect={handleConnect}
      onDisconnect={wallet.disconnect}
    />
  );
}
```

### Hook-First Pattern

```typescript
// hooks/useContract.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { Web3Service } from '../services/web3';

export function useContract(address: string, abi: ethers.InterfaceAbi) {
  const { provider, signer } = useWeb3();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [readOnlyContract, setReadOnlyContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (!provider) return;

    const web3Service = new Web3Service(provider);
    const readOnly = web3Service.getContract(address, abi);
    const writable = signer ? web3Service.getContract(address, abi, signer) : null;

    setReadOnlyContract(readOnly);
    setContract(writable);
  }, [provider, signer, address, abi]);

  return {
    contract,
    readOnlyContract,
    isReady: !!readOnlyContract,
    canWrite: !!contract,
  };
}

// Usage in component
function TokenBalance({ tokenAddress, userAddress }: TokenBalanceProps) {
  const { readOnlyContract } = useContract(tokenAddress, ERC20_ABI);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readOnlyContract || !userAddress) return;

    const fetchBalance = async () => {
      try {
        const balance = await readOnlyContract.balanceOf(userAddress);
        const decimals = await readOnlyContract.decimals();
        setBalance(ethers.formatUnits(balance, decimals));
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [readOnlyContract, userAddress]);

  if (loading) return <div>Loading...</div>;
  return <div>Balance: {balance}</div>;
}
```

## Error Boundaries

### Web3 Error Boundary

```typescript
// components/Web3ErrorBoundary.tsx
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Web3Error, ErrorType } from '../utils/error-handling';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Web3Error; resetError: () => void }>;
}

function DefaultErrorFallback({ error, resetError }: { error: Web3Error; resetError: () => void }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-800 mb-2">
        {getErrorTitle(error.type)}
      </h2>
      <p className="text-red-700 mb-4">{error.message}</p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}

function getErrorTitle(type: ErrorType): string {
  switch (type) {
    case ErrorType.USER_REJECTED:
      return 'Transaction Cancelled';
    case ErrorType.INSUFFICIENT_FUNDS:
      return 'Insufficient Funds';
    case ErrorType.NETWORK_ERROR:
      return 'Network Error';
    case ErrorType.CONTRACT_ERROR:
      return 'Contract Error';
    default:
      return 'Something Went Wrong';
  }
}

export function Web3ErrorBoundary({ children, fallback: Fallback = DefaultErrorFallback }: Props) {
  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onError={(error) => {
        console.error('Web3 Error Boundary caught error:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Transaction Error Handler

```typescript
// hooks/useTransactionError.ts
import { useCallback } from 'react';
import { ErrorParser, TransactionErrorTracker } from '../utils/error-handling';

export function useTransactionError() {
  const handleError = useCallback((error: any, context?: string) => {
    const web3Error = ErrorParser.parse(error);
    const humanMessage = TransactionErrorTracker.getHumanReadableError(error);
    
    // Log error for debugging
    console.error(`Transaction error in ${context}:`, web3Error);
    
    // Show user-friendly message
    return {
      error: web3Error,
      message: humanMessage,
      isRetryable: TransactionErrorTracker.isRetryable(web3Error),
    };
  }, []);

  return { handleError };
}
```

## Performance Optimization

### Contract Call Optimization

```typescript
// hooks/useContractCache.ts
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  blockNumber: number;
}

export function useContractCache<T>(
  contract: ethers.Contract | null,
  method: string,
  args: any[] = [],
  options: { ttl?: number; blockSensitive?: boolean } = {}
) {
  const { ttl = 60000, blockSensitive = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cache = useRef(new Map<string, CacheEntry<T>>());

  const getCacheKey = (blockNumber?: number) => 
    `${method}-${JSON.stringify(args)}-${blockSensitive ? blockNumber : ''}`;

  useEffect(() => {
    if (!contract) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = contract.provider as ethers.Provider;
        const currentBlock = blockSensitive ? await provider.getBlockNumber() : 0;
        const cacheKey = getCacheKey(currentBlock);
        const cached = cache.current.get(cacheKey);

        // Check if cached data is still valid
        if (cached && Date.now() - cached.timestamp < ttl) {
          setData(cached.data);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const result = await contract[method](...args);
        
        // Cache the result
        cache.current.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          blockNumber: currentBlock,
        });

        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contract, method, JSON.stringify(args), ttl, blockSensitive]);

  const invalidateCache = () => {
    cache.current.clear();
  };

  const refetch = () => {
    invalidateCache();
    // Re-trigger the effect by changing a dependency
  };

  return { data, loading, error, refetch, invalidateCache };
}
```

### Batch Request Optimization

```typescript
// hooks/useBatchRequests.ts
import { useState, useEffect, useCallback } from 'react';
import { multicall } from '../utils/contract-helpers';

interface BatchCall {
  id: string;
  contract: ethers.Contract;
  method: string;
  args: any[];
}

export function useBatchRequests<T = any>() {
  const [calls, setCalls] = useState<BatchCall[]>([]);
  const [results, setResults] = useState<Map<string, T>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addCall = useCallback((call: BatchCall) => {
    setCalls(prev => [...prev, call]);
  }, []);

  const removeCall = useCallback((id: string) => {
    setCalls(prev => prev.filter(call => call.id !== id));
  }, []);

  const executeBatch = useCallback(async () => {
    if (calls.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const batchResults = await multicall<T>(calls);
      
      const resultMap = new Map<string, T>();
      calls.forEach((call, index) => {
        resultMap.set(call.id, batchResults[index]);
      });

      setResults(resultMap);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [calls]);

  useEffect(() => {
    if (calls.length > 0) {
      const timer = setTimeout(executeBatch, 100); // Debounce batch execution
      return () => clearTimeout(timer);
    }
  }, [calls, executeBatch]);

  return {
    addCall,
    removeCall,
    results,
    loading,
    error,
    executeBatch,
  };
}
```

## Testing Architecture

### Service Layer Testing

```typescript
// __tests__/services/web3.test.ts
import { Web3Service } from '../../services/web3';
import { ethers } from 'ethers';

// Mock provider
const mockProvider = {
  getBalance: jest.fn(),
  getNetwork: jest.fn(),
} as any;

describe('Web3Service', () => {
  let service: Web3Service;

  beforeEach(() => {
    service = new Web3Service(mockProvider);
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return formatted balance', async () => {
      mockProvider.getBalance.mockResolvedValue(ethers.parseEther('1.0'));
      
      const balance = await service.getBalance('0x123...');
      
      expect(balance).toBe('1.0');
      expect(mockProvider.getBalance).toHaveBeenCalledWith('0x123...');
    });

    it('should handle errors gracefully', async () => {
      mockProvider.getBalance.mockRejectedValue(new Error('Network error'));
      
      await expect(service.getBalance('0x123...')).rejects.toThrow('Network error');
    });
  });
});
```

### Hook Testing

```typescript
// __tests__/hooks/useWallet.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../../hooks/useWallet';

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
    expect(result.current.isConnected).toBe(true);
  });
});
```

This architecture provides a solid foundation for building scalable web3 applications with proper separation of concerns, error handling, and testing strategies.