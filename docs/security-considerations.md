# Security Considerations for Web3 Applications

A comprehensive guide to security best practices when building web3 applications, covering frontend security, smart contract interactions, and user protection.

## Table of Contents

- [Frontend Security](#frontend-security)
- [Wallet Integration Security](#wallet-integration-security)
- [Smart Contract Interaction Security](#smart-contract-interaction-security)
- [Data Validation & Sanitization](#data-validation--sanitization)
- [Transaction Security](#transaction-security)
- [User Protection](#user-protection)
- [Development Security](#development-security)

## Frontend Security

### Never Store Private Keys

```typescript
// ❌ NEVER DO THIS
const PRIVATE_KEY = "0x1234567890abcdef..."; // Exposed to all users
const wallet = new ethers.Wallet(PRIVATE_KEY);

// ✅ ALWAYS USE USER'S WALLET
const signer = await provider.getSigner(); // User controls their keys
```

### Environment Variable Security

```typescript
// ✅ Safe for frontend (public information)
const RPC_URL = process.env.REACT_APP_RPC_URL;
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

// ❌ NEVER expose sensitive data in frontend env vars
const PRIVATE_KEY = process.env.REACT_APP_PRIVATE_KEY; // This will be visible!
const API_SECRET = process.env.REACT_APP_SECRET_KEY; // This will be visible!

// ✅ Use backend environment variables for secrets
// These should only exist on your server/backend
const SECRET_KEY = process.env.SECRET_KEY; // Server-only
const DATABASE_URL = process.env.DATABASE_URL; // Server-only
```

### Secure Configuration Management

```typescript
// config/security.ts
export const SECURITY_CONFIG = {
  // Safe to expose - these are network identifiers
  SUPPORTED_NETWORKS: [1, 5, 137, 80001],
  
  // Public contract addresses
  CONTRACTS: {
    1: { // Mainnet
      TOKEN: "0x...",
      ROUTER: "0x...",
    },
    5: { // Goerli
      TOKEN: "0x...",
      ROUTER: "0x...",
    }
  },
  
  // Public RPC endpoints
  RPC_ENDPOINTS: {
    1: process.env.REACT_APP_MAINNET_RPC,
    5: process.env.REACT_APP_GOERLI_RPC,
  },
  
  // Security settings
  MAX_SLIPPAGE: 3, // 3%
  MAX_GAS_PRICE: ethers.parseUnits('100', 'gwei'),
  TRANSACTION_TIMEOUT: 300000, // 5 minutes
} as const;
```

## Wallet Integration Security

### Secure Connection Handling

```typescript
// utils/wallet-security.ts
import { AddressValidator } from '../validation-functions';

export class WalletSecurity {
  static async validateConnection(provider: ethers.BrowserProvider): Promise<{
    isValid: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    try {
      // Check if we're on the correct network
      const network = await provider.getNetwork();
      if (!SECURITY_CONFIG.SUPPORTED_NETWORKS.includes(Number(network.chainId))) {
        warnings.push(`Unsupported network: ${network.name}`);
      }

      // Verify the provider is legitimate
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        warnings.push('Using non-MetaMask provider - proceed with caution');
      }

      // Check for account access
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) {
        warnings.push('No accounts accessible');
        return { isValid: false, warnings };
      }

      // Validate first account
      const firstAccount = accounts[0].address;
      if (!AddressValidator.isValid(firstAccount)) {
        warnings.push('Invalid account address format');
        return { isValid: false, warnings };
      }

      return { isValid: true, warnings };
    } catch (error) {
      return { 
        isValid: false, 
        warnings: [...warnings, 'Failed to validate connection'] 
      };
    }
  }

  static sanitizeUserInput(input: string): string {
    // Remove any potentially malicious characters
    return input
      .replace(/[<>'"]/g, '') // Remove HTML/script injection chars
      .trim()
      .slice(0, 1000); // Limit length
  }

  static validateNetworkBeforeTransaction(
    currentChainId: number,
    requiredChainId: number
  ): void {
    if (currentChainId !== requiredChainId) {
      throw new Error(
        `Wrong network. Please switch to ${requiredChainId} before proceeding.`
      );
    }
  }
}
```

### Secure Event Listeners

```typescript
// hooks/useSecureWallet.ts
import { useEffect, useCallback } from 'react';

export function useSecureWallet() {
  const [walletState, setWalletState] = useState({
    isConnected: false,
    address: null,
    chainId: null,
  });

  // Secure account change handler
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    // Validate accounts before processing
    const validatedAccounts = accounts.filter(AddressValidator.isValid);
    
    if (validatedAccounts.length === 0) {
      // Force disconnect if no valid accounts
      setWalletState({
        isConnected: false,
        address: null,
        chainId: null,
      });
      localStorage.removeItem('walletConnected');
      return;
    }

    // Update with first valid account
    setWalletState(prev => ({
      ...prev,
      address: validatedAccounts[0],
      isConnected: true,
    }));
  }, []);

  // Secure network change handler
  const handleChainChanged = useCallback((chainId: string) => {
    const numericChainId = parseInt(chainId, 16);
    
    // Validate chain ID
    if (!SECURITY_CONFIG.SUPPORTED_NETWORKS.includes(numericChainId)) {
      console.warn(`Switched to unsupported network: ${numericChainId}`);
    }
    
    setWalletState(prev => ({
      ...prev,
      chainId: numericChainId,
    }));
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged]);

  return walletState;
}
```

## Smart Contract Interaction Security

### Input Validation Before Contract Calls

```typescript
// services/secure-contract-service.ts
import { 
  AddressValidator, 
  AmountValidator, 
  TransactionValidator 
} from '../utils/validation-functions';

export class SecureContractService {
  private provider: ethers.BrowserProvider;

  constructor(provider: ethers.BrowserProvider) {
    this.provider = provider;
  }

  async secureTransfer(
    tokenAddress: string,
    recipient: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<ethers.ContractTransactionResponse> {
    // 1. Validate all inputs
    AddressValidator.requireValid(tokenAddress);
    AddressValidator.requireValid(recipient);
    
    if (AddressValidator.isZeroAddress(recipient)) {
      throw new Error('Cannot send tokens to zero address');
    }

    const decimals = 18; // Get from contract
    const parsedAmount = AmountValidator.requireValid(amount, { decimals });

    // 2. Verify current network
    const network = await this.provider.getNetwork();
    WalletSecurity.validateNetworkBeforeTransaction(
      Number(network.chainId),
      1 // Mainnet
    );

    // 3. Check contract existence
    const code = await this.provider.getCode(tokenAddress);
    if (code === '0x') {
      throw new Error('No contract found at the given address');
    }

    // 4. Create contract with validated inputs
    const contract = new ethers.Contract(
      tokenAddress,
      ['function transfer(address to, uint256 amount) returns (bool)'],
      signer
    );

    // 5. Estimate gas first to catch issues early
    try {
      await contract.transfer.estimateGas(recipient, parsedAmount);
    } catch (error) {
      throw new Error('Transaction would fail - check balances and parameters');
    }

    // 6. Execute with proper gas limit
    const gasEstimate = await contract.transfer.estimateGas(recipient, parsedAmount);
    const gasLimit = gasEstimate * 120n / 100n; // 20% buffer

    return await contract.transfer(recipient, parsedAmount, { gasLimit });
  }

  async secureContractRead(
    contractAddress: string,
    abi: ethers.InterfaceAbi,
    method: string,
    args: any[] = []
  ): Promise<any> {
    // Validate contract address
    AddressValidator.requireValid(contractAddress);

    // Verify contract exists
    const code = await this.provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('No contract found at address');
    }

    const contract = new ethers.Contract(contractAddress, abi, this.provider);

    // Validate method exists
    if (!(method in contract.interface.functions)) {
      throw new Error(`Method ${method} not found in contract ABI`);
    }

    try {
      return await contract[method](...args);
    } catch (error: any) {
      if (error.reason) {
        throw new Error(`Contract call failed: ${error.reason}`);
      }
      throw new Error('Contract call failed');
    }
  }
}
```

### Gas Limit Security

```typescript
// utils/gas-security.ts
export class GasSecurity {
  private static readonly MAX_GAS_LIMIT = 30000000n; // Ethereum block gas limit
  private static readonly MIN_GAS_LIMIT = 21000n;    // Minimum transaction gas

  static validateGasLimit(gasLimit: bigint): void {
    if (gasLimit < this.MIN_GAS_LIMIT) {
      throw new Error(`Gas limit too low. Minimum: ${this.MIN_GAS_LIMIT}`);
    }

    if (gasLimit > this.MAX_GAS_LIMIT) {
      throw new Error(`Gas limit too high. Maximum: ${this.MAX_GAS_LIMIT}`);
    }
  }

  static async secureGasEstimation(
    contract: ethers.Contract,
    method: string,
    args: any[]
  ): Promise<bigint> {
    try {
      const estimate = await contract[method].estimateGas(...args);
      
      // Add safety buffer but cap at reasonable limit
      const withBuffer = estimate * 130n / 100n; // 30% buffer
      const cappedGasLimit = withBuffer > this.MAX_GAS_LIMIT 
        ? this.MAX_GAS_LIMIT 
        : withBuffer;

      this.validateGasLimit(cappedGasLimit);
      return cappedGasLimit;

    } catch (error: any) {
      if (error.reason) {
        throw new Error(`Gas estimation failed: ${error.reason}`);
      }
      throw new Error('Unable to estimate gas - transaction may fail');
    }
  }

  static validateGasPrice(gasPrice: bigint, maxGasPrice: bigint): void {
    if (gasPrice > maxGasPrice) {
      throw new Error(
        `Gas price ${ethers.formatUnits(gasPrice, 'gwei')} Gwei exceeds maximum ${ethers.formatUnits(maxGasPrice, 'gwei')} Gwei`
      );
    }
  }
}
```

## Data Validation & Sanitization

### Comprehensive Input Sanitization

```typescript
// utils/input-sanitizer.ts
export class InputSanitizer {
  static sanitizeForContract(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeForContract(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeForContract(value);
      }
      return sanitized;
    }
    
    return input;
  }

  private static sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      throw new Error('Expected string input');
    }

    return str
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .slice(0, 1000); // Limit length
  }

  static sanitizeTokenMetadata(metadata: any): {
    name: string;
    symbol: string;
    decimals: number;
  } {
    if (!metadata || typeof metadata !== 'object') {
      throw new Error('Invalid metadata format');
    }

    const name = this.sanitizeString(metadata.name || 'Unknown');
    const symbol = this.sanitizeString(metadata.symbol || 'UNK');
    const decimals = Number(metadata.decimals);

    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 77) {
      throw new Error('Invalid decimals value');
    }

    return { name, symbol, decimals };
  }
}
```

### XSS Prevention

```typescript
// utils/xss-prevention.ts
export class XSSPrevention {
  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  static sanitizeDisplayData(data: any): any {
    if (typeof data === 'string') {
      return this.escapeHtml(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeDisplayData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeDisplayData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  static sanitizeUrl(url: string): string {
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid URL format');
    }
    
    const parsed = new URL(url);
    
    // Only allow safe protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }
    
    return parsed.toString();
  }
}
```

## Transaction Security

### Secure Transaction Building

```typescript
// services/secure-transaction-service.ts
export class SecureTransactionService {
  async buildSecureTransaction(params: {
    to: string;
    value?: bigint;
    data?: string;
    gasLimit?: bigint;
    gasPrice?: bigint;
    nonce?: number;
  }): Promise<ethers.TransactionRequest> {
    const { to, value = 0n, data = '0x', gasLimit, gasPrice, nonce } = params;

    // Validate recipient
    AddressValidator.requireValid(to);
    
    if (AddressValidator.isZeroAddress(to) && !data) {
      throw new Error('Cannot send ETH to zero address without data');
    }

    // Validate value
    if (value < 0n) {
      throw new Error('Transaction value cannot be negative');
    }

    // Validate data
    if (data !== '0x') {
      if (!/^0x[0-9a-fA-F]*$/.test(data)) {
        throw new Error('Invalid transaction data format');
      }
    }

    // Validate gas parameters
    if (gasLimit) {
      GasSecurity.validateGasLimit(gasLimit);
    }

    if (gasPrice) {
      GasSecurity.validateGasPrice(gasPrice, SECURITY_CONFIG.MAX_GAS_PRICE);
    }

    return {
      to,
      value,
      data,
      gasLimit,
      gasPrice,
      nonce,
    };
  }

  async executeSecureTransaction(
    signer: ethers.Signer,
    transaction: ethers.TransactionRequest,
    options: {
      requireConfirmations?: number;
      timeout?: number;
    } = {}
  ): Promise<ethers.TransactionReceipt> {
    const { requireConfirmations = 1, timeout = 300000 } = options;

    // Final validation before sending
    const network = await signer.provider!.getNetwork();
    if (!SECURITY_CONFIG.SUPPORTED_NETWORKS.includes(Number(network.chainId))) {
      throw new Error('Transaction attempted on unsupported network');
    }

    // Send transaction
    const tx = await signer.sendTransaction(transaction);
    
    // Wait for confirmation with timeout
    const receipt = await Promise.race([
      tx.wait(requireConfirmations),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout')), timeout)
      )
    ]);

    if (!receipt) {
      throw new Error('Transaction failed - no receipt');
    }

    if (receipt.status === 0) {
      throw new Error('Transaction reverted');
    }

    return receipt;
  }
}
```

### Slippage Protection

```typescript
// utils/slippage-protection.ts
export class SlippageProtection {
  static calculateMinimumOutput(
    expectedOutput: bigint,
    slippagePercent: number
  ): bigint {
    if (slippagePercent < 0 || slippagePercent > 100) {
      throw new Error('Slippage must be between 0 and 100 percent');
    }

    if (slippagePercent > SECURITY_CONFIG.MAX_SLIPPAGE) {
      throw new Error(`Slippage exceeds maximum allowed (${SECURITY_CONFIG.MAX_SLIPPAGE}%)`);
    }

    const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 100));
    return expectedOutput * slippageMultiplier / 10000n;
  }

  static validatePriceImpact(
    inputAmount: bigint,
    outputAmount: bigint,
    expectedRate: bigint
  ): void {
    const actualRate = outputAmount * 10000n / inputAmount;
    const expectedRateWithTolerance = expectedRate * 95n / 100n; // 5% tolerance

    if (actualRate < expectedRateWithTolerance) {
      throw new Error('Price impact too high - transaction would be unfavorable');
    }
  }
}
```

## User Protection

### Phishing Protection

```typescript
// utils/phishing-protection.ts
export class PhishingProtection {
  private static readonly KNOWN_SCAM_ADDRESSES = new Set([
    // Add known scam addresses
    '0x0000000000000000000000000000000000000000',
  ]);

  private static readonly TRUSTED_DOMAINS = new Set([
    'app.uniswap.org',
    'metamask.io',
    'etherscan.io',
  ]);

  static checkAddress(address: string): {
    isSafe: boolean;
    warning?: string;
  } {
    const normalizedAddress = address.toLowerCase();
    
    if (this.KNOWN_SCAM_ADDRESSES.has(normalizedAddress)) {
      return {
        isSafe: false,
        warning: 'This address is associated with known scams. Do not proceed.'
      };
    }

    if (AddressValidator.isZeroAddress(address)) {
      return {
        isSafe: false,
        warning: 'Sending to zero address will result in permanent loss of funds.'
      };
    }

    return { isSafe: true };
  }

  static validateDomain(currentDomain: string): {
    isSafe: boolean;
    warning?: string;
  } {
    if (this.TRUSTED_DOMAINS.has(currentDomain)) {
      return { isSafe: true };
    }

    // Check for common phishing patterns
    const suspiciousPatterns = [
      /uniswap\./i,
      /metamask\./i,
      /etherscan\./i,
    ];

    const isPhishingAttempt = suspiciousPatterns.some(pattern => 
      pattern.test(currentDomain) && !this.TRUSTED_DOMAINS.has(currentDomain)
    );

    if (isPhishingAttempt) {
      return {
        isSafe: false,
        warning: 'This domain appears to be impersonating a trusted service. Verify the URL carefully.'
      };
    }

    return { isSafe: true };
  }

  static generateSecurityChecklist(transaction: {
    to: string;
    value: bigint;
    data?: string;
  }): string[] {
    const checklist: string[] = [];

    checklist.push('✓ Verified the recipient address is correct');
    checklist.push('✓ Double-checked the transaction amount');
    
    if (transaction.value > ethers.parseEther('0.1')) {
      checklist.push('⚠️  Large transaction - extra verification recommended');
    }

    if (transaction.data && transaction.data !== '0x') {
      checklist.push('⚠️  This transaction includes contract interaction');
    }

    const addressCheck = this.checkAddress(transaction.to);
    if (!addressCheck.isSafe) {
      checklist.push(`❌ ${addressCheck.warning}`);
    }

    return checklist;
  }
}
```

### User Consent and Warnings

```typescript
// components/SecurityWarnings.tsx
import React, { useState } from 'react';

interface SecurityWarningProps {
  type: 'high_value' | 'contract_interaction' | 'new_token' | 'slippage';
  onConfirm: () => void;
  onCancel: () => void;
}

export function SecurityWarning({ type, onConfirm, onCancel }: SecurityWarningProps) {
  const [userConfirmed, setUserConfirmed] = useState(false);

  const getWarningContent = () => {
    switch (type) {
      case 'high_value':
        return {
          title: 'High Value Transaction',
          message: 'You are about to send a large amount. Please verify all details carefully.',
          checks: [
            'Recipient address is correct',
            'Transaction amount is correct',
            'You trust the recipient'
          ]
        };

      case 'contract_interaction':
        return {
          title: 'Contract Interaction',
          message: 'This transaction will interact with a smart contract. Ensure you understand what it does.',
          checks: [
            'You trust this contract',
            'You understand what this transaction does',
            'Contract address has been verified'
          ]
        };

      case 'new_token':
        return {
          title: 'New Token Detected',
          message: 'You are interacting with a token not in our database. Exercise caution.',
          checks: [
            'Token contract has been verified',
            'You trust this token',
            'Token is not a scam'
          ]
        };

      case 'slippage':
        return {
          title: 'High Slippage Warning',
          message: 'The slippage for this trade is unusually high. You may receive less tokens than expected.',
          checks: [
            'You understand slippage risks',
            'You accept the potential loss',
            'You have verified the trade parameters'
          ]
        };
    }
  };

  const content = getWarningContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900">{content.title}</h2>
        </div>

        <p className="text-gray-700 mb-6">{content.message}</p>

        <div className="space-y-3 mb-6">
          {content.checks.map((check, index) => (
            <label key={index} className="flex items-start space-x-2">
              <input 
                type="checkbox" 
                className="mt-1" 
                onChange={(e) => {
                  // Track if all checkboxes are checked
                  const allChecked = content.checks.every((_, i) => 
                    document.querySelectorAll('input[type="checkbox"]')[i]?.checked
                  );
                  setUserConfirmed(allChecked);
                }}
              />
              <span className="text-sm text-gray-700">{check}</span>
            </label>
          ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!userConfirmed}
            className={`flex-1 py-2 px-4 rounded-md ${
              userConfirmed
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            I Understand, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Development Security

### Secure Development Practices

```typescript
// scripts/security-check.ts
export class SecurityChecker {
  static checkEnvironmentVariables(): void {
    const requiredVars = ['REACT_APP_RPC_URL'];
    const optionalVars = ['REACT_APP_ANALYTICS_KEY'];
    
    // Check required variables
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        console.error(`❌ Missing required environment variable: ${varName}`);
        process.exit(1);
      }
    });

    // Warn about exposed secrets
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('REACT_APP_') && (
        key.includes('PRIVATE') ||
        key.includes('SECRET') ||
        key.includes('KEY')
      )) {
        console.warn(`⚠️  Warning: ${key} contains sensitive keywords and will be exposed to users`);
      }
    });

    console.log('✅ Environment variables check passed');
  }

  static checkDependencies(): void {
    const packageJson = require('../../package.json');
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Check for known vulnerable packages
    const vulnerablePackages = ['event-stream', 'flatmap-stream'];
    
    vulnerablePackages.forEach(pkg => {
      if (dependencies[pkg]) {
        console.error(`❌ Vulnerable package detected: ${pkg}`);
        process.exit(1);
      }
    });

    console.log('✅ Dependencies check passed');
  }

  static validateContractAddresses(): void {
    const contracts = SECURITY_CONFIG.CONTRACTS;
    
    Object.entries(contracts).forEach(([networkId, networkContracts]) => {
      Object.entries(networkContracts).forEach(([name, address]) => {
        if (!AddressValidator.isValid(address)) {
          console.error(`❌ Invalid contract address for ${name} on network ${networkId}: ${address}`);
          process.exit(1);
        }
      });
    });

    console.log('✅ Contract addresses validation passed');
  }
}

// Run security checks
if (require.main === module) {
  SecurityChecker.checkEnvironmentVariables();
  SecurityChecker.checkDependencies();
  SecurityChecker.validateContractAddresses();
  console.log('🔒 All security checks passed!');
}
```

### Security Testing

```typescript
// __tests__/security.test.ts
describe('Security Tests', () => {
  describe('Input Validation', () => {
    it('should reject invalid addresses', () => {
      expect(() => AddressValidator.requireValid('invalid')).toThrow();
      expect(() => AddressValidator.requireValid('0x')).toThrow();
      expect(() => AddressValidator.requireValid('0x123')).toThrow();
    });

    it('should reject malicious amounts', () => {
      expect(() => AmountValidator.requireValid('-1')).toThrow();
      expect(() => AmountValidator.requireValid('1e50')).toThrow();
      expect(() => AmountValidator.requireValid('<script>')).toThrow();
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML characters', () => {
      const malicious = '<script>alert("xss")</script>';
      const escaped = XSSPrevention.escapeHtml(malicious);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });

    it('should validate URLs', () => {
      expect(XSSPrevention.isValidUrl('javascript:alert(1)')).toBe(false);
      expect(XSSPrevention.isValidUrl('data:text/html,<script>')).toBe(false);
      expect(XSSPrevention.isValidUrl('https://example.com')).toBe(true);
    });
  });

  describe('Gas Security', () => {
    it('should reject excessive gas limits', () => {
      const excessiveGas = 50000000n; // Above block limit
      expect(() => GasSecurity.validateGasLimit(excessiveGas)).toThrow();
    });

    it('should reject insufficient gas limits', () => {
      const insufficientGas = 10000n; // Below minimum
      expect(() => GasSecurity.validateGasLimit(insufficientGas)).toThrow();
    });
  });
});
```

## Security Checklist

### Pre-Deployment Checklist

- [ ] **No private keys in code or environment variables**
- [ ] **All user inputs are validated and sanitized**
- [ ] **Contract addresses are verified and correct**
- [ ] **Network validation is implemented**
- [ ] **Gas limits are properly bounded**
- [ ] **Slippage protection is implemented**
- [ ] **Error messages don't leak sensitive information**
- [ ] **XSS prevention is implemented**
- [ ] **Dependencies are up to date and secure**
- [ ] **Security tests are passing**

### Runtime Security Monitoring

```typescript
// utils/security-monitor.ts
export class SecurityMonitor {
  private static failedAttempts = new Map<string, number>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly BLOCK_DURATION = 300000; // 5 minutes

  static recordFailedAttempt(identifier: string): void {
    const attempts = this.failedAttempts.get(identifier) || 0;
    this.failedAttempts.set(identifier, attempts + 1);

    if (attempts + 1 >= this.MAX_ATTEMPTS) {
      console.warn(`🚨 Security: ${identifier} exceeded max failed attempts`);
      // Implement blocking logic here
    }
  }

  static isBlocked(identifier: string): boolean {
    return (this.failedAttempts.get(identifier) || 0) >= this.MAX_ATTEMPTS;
  }

  static clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }
}
```

Remember: **Security is an ongoing process, not a one-time implementation**. Regularly review and update your security measures as the web3 landscape evolves.