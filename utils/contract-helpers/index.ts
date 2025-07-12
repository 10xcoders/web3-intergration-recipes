/**
 * Utility functions for common smart contract operations
 */

import { ethers } from 'ethers';

// Common contract ABIs
export const ABIS = {
  ERC20: [
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
  ],
  
  ERC721: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function approve(address to, uint256 tokenId)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function setApprovalForAll(address operator, bool approved)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)"
  ],

  MULTICALL: [
    "function aggregate(tuple(address target, bytes callData)[] calls) returns (uint256 blockNumber, bytes[] returnData)"
  ]
};

// Network configurations
export const NETWORKS = {
  1: { name: 'Ethereum Mainnet', rpc: 'https://eth-mainnet.alchemyapi.io/v2/' },
  5: { name: 'Goerli', rpc: 'https://eth-goerli.alchemyapi.io/v2/' },
  11155111: { name: 'Sepolia', rpc: 'https://eth-sepolia.g.alchemy.com/v2/' },
  137: { name: 'Polygon', rpc: 'https://polygon-mainnet.alchemyapi.io/v2/' },
  80001: { name: 'Mumbai', rpc: 'https://polygon-mumbai.alchemyapi.io/v2/' }
} as const;

// Contract factory with caching
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
    const key = `${address.toLowerCase()}-${signer ? 'signer' : 'provider'}`;
    
    if (!this.contracts.has(key)) {
      const contract = new ethers.Contract(address, abi, signer || this.provider);
      this.contracts.set(key, contract);
    }

    return this.contracts.get(key)!;
  }

  getERC20Contract(address: string, signer?: ethers.Signer): ethers.Contract {
    return this.getContract(address, ABIS.ERC20, signer);
  }

  getERC721Contract(address: string, signer?: ethers.Signer): ethers.Contract {
    return this.getContract(address, ABIS.ERC721, signer);
  }

  clearCache(): void {
    this.contracts.clear();
  }
}

// Gas estimation utilities
export class GasUtils {
  static async estimateGasWithBuffer(
    contract: ethers.Contract,
    method: string,
    args: any[],
    bufferPercent = 20
  ): Promise<bigint> {
    try {
      const gasEstimate = await contract[method].estimateGas(...args);
      return gasEstimate * BigInt(100 + bufferPercent) / 100n;
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw new Error('Unable to estimate gas for transaction');
    }
  }

  static async getCurrentGasPrice(provider: ethers.Provider): Promise<bigint> {
    try {
      const feeData = await provider.getFeeData();
      return feeData.gasPrice || 0n;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return ethers.parseUnits('20', 'gwei'); // Fallback gas price
    }
  }

  static calculateTransactionCost(gasUsed: bigint, gasPrice: bigint): string {
    return ethers.formatEther(gasUsed * gasPrice);
  }
}

// Token utilities
export class TokenUtils {
  private contractFactory: ContractFactory;

  constructor(provider: ethers.Provider) {
    this.contractFactory = new ContractFactory(provider);
  }

  async getTokenInfo(address: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    const contract = this.contractFactory.getERC20Contract(address);

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
      throw new Error(`Failed to fetch token info for ${address}`);
    }
  }

  async getBalance(tokenAddress: string, userAddress: string): Promise<string> {
    const contract = this.contractFactory.getERC20Contract(tokenAddress);

    try {
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      throw new Error(`Failed to fetch balance for ${tokenAddress}`);
    }
  }

  async getAllowance(
    tokenAddress: string,
    owner: string,
    spender: string
  ): Promise<string> {
    const contract = this.contractFactory.getERC20Contract(tokenAddress);

    try {
      const allowance = await contract.allowance(owner, spender);
      const decimals = await contract.decimals();
      return ethers.formatUnits(allowance, decimals);
    } catch (error) {
      throw new Error(`Failed to fetch allowance for ${tokenAddress}`);
    }
  }

  async approve(
    tokenAddress: string,
    signer: ethers.Signer,
    spender: string,
    amount: string
  ): Promise<ethers.ContractTransactionResponse> {
    const contract = this.contractFactory.getERC20Contract(tokenAddress, signer);

    try {
      const decimals = await contract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);

      const gasLimit = await GasUtils.estimateGasWithBuffer(
        contract,
        'approve',
        [spender, amountWei]
      );

      return await contract.approve(spender, amountWei, { gasLimit });
    } catch (error) {
      throw new Error(`Failed to approve ${tokenAddress}`);
    }
  }
}

// Transaction utilities
export class TransactionUtils {
  static async waitForTransaction(
    provider: ethers.Provider,
    txHash: string,
    confirmations = 1,
    timeout = 300000 // 5 minutes
  ): Promise<ethers.TransactionReceipt> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (receipt && receipt.confirmations >= confirmations) {
          return receipt;
        }

        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn('Error checking transaction status:', error);
      }
    }

    throw new Error(`Transaction ${txHash} not confirmed within timeout`);
  }

  static parseTransactionError(error: any): string {
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      return 'Transaction rejected by user';
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return 'Insufficient funds for transaction';
    }
    
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return 'Transaction would fail - check parameters';
    }
    
    if (error.reason) {
      return `Contract error: ${error.reason}`;
    }
    
    if (error.message?.includes('revert')) {
      const match = error.message.match(/revert (.+)'/);
      if (match) {
        return `Contract reverted: ${match[1]}`;
      }
    }
    
    return 'Transaction failed';
  }
}

// Address utilities
export class AddressUtils {
  static isValidAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  static checksumAddress(address: string): string {
    try {
      return ethers.getAddress(address);
    } catch {
      throw new Error('Invalid Ethereum address');
    }
  }

  static shortenAddress(address: string, chars = 4): string {
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid address');
    }
    
    return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
  }

  static isZeroAddress(address: string): boolean {
    return address === ethers.ZeroAddress;
  }
}

// Format utilities
export class FormatUtils {
  static formatUnits(value: bigint, decimals: number, precision = 4): string {
    const formatted = ethers.formatUnits(value, decimals);
    const num = parseFloat(formatted);
    
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    
    return num.toFixed(precision).replace(/\.?0+$/, '');
  }

  static formatEther(value: bigint, precision = 4): string {
    return this.formatUnits(value, 18, precision);
  }

  static formatGwei(value: bigint, precision = 2): string {
    return this.formatUnits(value, 9, precision);
  }

  static parseUnits(value: string, decimals: number): bigint {
    try {
      return ethers.parseUnits(value, decimals);
    } catch {
      throw new Error('Invalid number format');
    }
  }
}

// Export all utilities
export {
  ContractFactory,
  GasUtils,
  TokenUtils,
  TransactionUtils,
  AddressUtils,
  FormatUtils
};