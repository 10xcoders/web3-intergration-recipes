# Smart Contract Calls Recipe

Comprehensive patterns for reading from and writing to smart contracts with proper error handling, transaction management, and optimization techniques.

## Use Cases

- Read contract data (view/pure functions)
- Execute contract transactions (state-changing functions)
- Handle complex contract interactions
- Optimize for gas efficiency
- Manage transaction states

## Prerequisites

- Connected wallet (see [MetaMask Connection](../../wallet-integration/metamask-connection/))
- Contract ABI and address
- Basic understanding of smart contracts
- Testnet ETH for transactions

## Quick Start

### Installation

```bash
npm install ethers
```

### Basic Contract Setup

```typescript
import { ethers } from 'ethers';

const contractABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const contractAddress = "0x...";
const provider = new ethers.BrowserProvider(window.ethereum);
const contract = new ethers.Contract(contractAddress, contractABI, provider);
```

## Contract Interactions

### Reading Contract Data

```typescript
// Simple read operation
export async function getBalance(contractAddress: string, userAddress: string): Promise<string> {
  try {
    const contract = new ethers.Contract(
      contractAddress, 
      ["function balanceOf(address) view returns (uint256)"], 
      provider
    );
    
    const balance = await contract.balanceOf(userAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw new Error('Unable to fetch balance');
  }
}

// Batch multiple reads
export async function getTokenInfo(contractAddress: string): Promise<TokenInfo> {
  const contract = new ethers.Contract(contractAddress, [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)"
  ], provider);

  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply()
    ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: ethers.formatUnits(totalSupply, decimals)
    };
  } catch (error) {
    console.error('Failed to get token info:', error);
    throw error;
  }
}
```

### Writing to Contracts

```typescript
export async function transferTokens(
  contractAddress: string,
  signer: ethers.Signer,
  to: string,
  amount: string
): Promise<ethers.ContractTransactionResponse> {
  const contract = new ethers.Contract(
    contractAddress,
    ["function transfer(address to, uint256 amount) returns (bool)"],
    signer
  );

  try {
    // Estimate gas before sending
    const gasEstimate = await contract.transfer.estimateGas(to, ethers.parseEther(amount));
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate * 120n / 100n;

    const transaction = await contract.transfer(to, ethers.parseEther(amount), {
      gasLimit
    });

    console.log('Transaction sent:', transaction.hash);
    return transaction;
  } catch (error: any) {
    console.error('Transfer failed:', error);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient funds for transaction');
    }
    if (error.reason) {
      throw new Error(error.reason);
    }
    throw new Error('Transaction failed');
  }
}
```

## Advanced Patterns

### Transaction Status Management

```typescript
interface TransactionState {
  hash?: string;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: string;
  receipt?: ethers.TransactionReceipt;
}

export class TransactionManager {
  private state: TransactionState = { status: 'idle' };
  private callbacks: Array<(state: TransactionState) => void> = [];

  onStateChange(callback: (state: TransactionState) => void) {
    this.callbacks.push(callback);
  }

  private updateState(newState: Partial<TransactionState>) {
    this.state = { ...this.state, ...newState };
    this.callbacks.forEach(callback => callback(this.state));
  }

  async executeTransaction(
    contract: ethers.Contract,
    method: string,
    args: any[],
    options: ethers.Overrides = {}
  ): Promise<ethers.TransactionReceipt> {
    try {
      this.updateState({ status: 'pending', error: undefined });

      // Estimate gas
      const gasEstimate = await contract[method].estimateGas(...args, options);
      const gasLimit = gasEstimate * 120n / 100n;

      // Send transaction
      const transaction = await contract[method](...args, { ...options, gasLimit });
      
      this.updateState({ 
        status: 'pending', 
        hash: transaction.hash 
      });

      // Wait for confirmation
      const receipt = await transaction.wait();
      
      this.updateState({ 
        status: 'success', 
        receipt 
      });

      return receipt;
    } catch (error: any) {
      this.updateState({ 
        status: 'error', 
        error: this.parseError(error) 
      });
      throw error;
    }
  }

  private parseError(error: any): string {
    if (error.code === 'USER_REJECTED') {
      return 'Transaction rejected by user';
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return 'Insufficient funds';
    }
    if (error.reason) {
      return error.reason;
    }
    return 'Transaction failed';
  }
}
```

### Contract Factory Pattern

```typescript
export class ContractFactory {
  private contracts = new Map<string, ethers.Contract>();
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  getContract(
    address: string, 
    abi: ethers.InterfaceAbi, 
    signer?: ethers.Signer
  ): ethers.Contract {
    const key = `${address}-${signer ? 'signer' : 'provider'}`;
    
    if (!this.contracts.has(key)) {
      const contract = new ethers.Contract(
        address, 
        abi, 
        signer || this.provider
      );
      this.contracts.set(key, contract);
    }

    return this.contracts.get(key)!;
  }

  // Specialized contract getters
  getERC20Contract(address: string, signer?: ethers.Signer): ethers.Contract {
    const erc20ABI = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "event Transfer(address indexed from, address indexed to, uint256 value)",
      "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ];

    return this.getContract(address, erc20ABI, signer);
  }
}
```

### Multi-call Pattern

```typescript
export async function multicall<T>(
  calls: Array<{ contract: ethers.Contract; method: string; args: any[] }>,
  batchSize = 10
): Promise<T[]> {
  const results: T[] = [];
  
  // Process in batches to avoid overwhelming the RPC
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async ({ contract, method, args }) => {
      try {
        return await contract[method](...args);
      } catch (error) {
        console.warn(`Call failed: ${method}`, error);
        return null;
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push(null);
      }
    });
  }

  return results;
}

// Usage example
export async function getMultipleBalances(
  tokenAddresses: string[],
  userAddress: string,
  provider: ethers.Provider
): Promise<Array<{ address: string; balance: string | null }>> {
  const contractFactory = new ContractFactory(provider);
  
  const calls = tokenAddresses.map(address => ({
    contract: contractFactory.getERC20Contract(address),
    method: 'balanceOf',
    args: [userAddress]
  }));

  const balances = await multicall<bigint>(calls);
  
  return tokenAddresses.map((address, index) => ({
    address,
    balance: balances[index] ? ethers.formatEther(balances[index]) : null
  }));
}
```

## Error Handling Patterns

### Comprehensive Error Handler

```typescript
export class ContractErrorHandler {
  static handle(error: any): never {
    // User rejected transaction
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction rejected by user');
    }

    // Insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient funds for gas');
    }

    // Gas estimation failed
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error('Transaction would fail - check parameters');
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network connection failed - please retry');
    }

    // Contract reverted
    if (error.reason) {
      throw new Error(`Contract error: ${error.reason}`);
    }

    // RPC errors
    if (error.message?.includes('revert')) {
      const match = error.message.match(/revert (.+)'/);
      if (match) {
        throw new Error(`Contract reverted: ${match[1]}`);
      }
    }

    // Generic fallback
    throw new Error('Transaction failed - please try again');
  }
}

// Usage in contract calls
export async function safeContractCall<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    ContractErrorHandler.handle(error);
  }
}
```

## Implementation Guides

- [React Implementation](./react/README.md) - Hooks and components for React
- [Vue Implementation](./vue/README.md) - Composables for Vue 3
- [Vanilla JS](./vanilla-js/README.md) - Framework-agnostic implementation

## Performance Optimization

### Contract Call Caching

```typescript
class ContractCallCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 60000; // 1 minute

  private getKey(contract: string, method: string, args: any[]): string {
    return `${contract}-${method}-${JSON.stringify(args)}`;
  }

  async get<T>(
    contract: ethers.Contract,
    method: string,
    args: any[] = []
  ): Promise<T> {
    const key = this.getKey(await contract.getAddress(), method, args);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const result = await contract[method](...args);
    this.cache.set(key, { data: result, timestamp: Date.now() });
    
    return result;
  }

  clear(): void {
    this.cache.clear();
  }
}
```

## Security Considerations

- Always validate contract addresses
- Verify function signatures before calling
- Use proper gas limits to prevent failures
- Handle all possible error cases
- Never store private keys in frontend code
- Validate all user inputs before contract calls
- Use read-only providers for view functions

## Testing Strategies

### Mock Contract for Testing

```typescript
export class MockContract {
  private state: Record<string, any> = {};

  // Mock view functions
  balanceOf(address: string): bigint {
    return this.state[`balance_${address}`] || 0n;
  }

  // Mock state-changing functions
  async transfer(to: string, amount: bigint): Promise<any> {
    // Simulate transaction
    return {
      hash: '0x' + Math.random().toString(16).substring(2),
      wait: async () => ({ status: 1 })
    };
  }

  // Set mock state
  setState(key: string, value: any): void {
    this.state[key] = value;
  }
}
```

This recipe provides comprehensive patterns for smart contract interactions, covering both simple and complex use cases with proper error handling and optimization techniques.