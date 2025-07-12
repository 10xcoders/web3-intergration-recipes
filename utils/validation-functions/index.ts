/**
 * Validation utilities for web3 applications
 */

import { ethers } from 'ethers';

// Address validation
export class AddressValidator {
  static validate(address: string): { isValid: boolean; error?: string } {
    if (!address) {
      return { isValid: false, error: 'Address is required' };
    }

    if (typeof address !== 'string') {
      return { isValid: false, error: 'Address must be a string' };
    }

    try {
      ethers.getAddress(address);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid Ethereum address format' };
    }
  }

  static isValid(address: string): boolean {
    return this.validate(address).isValid;
  }

  static requireValid(address: string): string {
    const result = this.validate(address);
    if (!result.isValid) {
      throw new Error(result.error);
    }
    return ethers.getAddress(address);
  }

  static isZeroAddress(address: string): boolean {
    try {
      return ethers.getAddress(address) === ethers.ZeroAddress;
    } catch {
      return false;
    }
  }

  static validateMany(addresses: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    addresses.forEach(address => {
      if (this.isValid(address)) {
        valid.push(ethers.getAddress(address));
      } else {
        invalid.push(address);
      }
    });

    return { valid, invalid };
  }
}

// Amount validation
export class AmountValidator {
  static validate(
    amount: string,
    options: {
      min?: string;
      max?: string;
      decimals?: number;
      allowZero?: boolean;
    } = {}
  ): { isValid: boolean; error?: string; parsed?: bigint } {
    if (!amount) {
      return { isValid: false, error: 'Amount is required' };
    }

    if (typeof amount !== 'string') {
      return { isValid: false, error: 'Amount must be a string' };
    }

    // Check for valid number format
    if (!/^[0-9]*\.?[0-9]*$/.test(amount)) {
      return { isValid: false, error: 'Invalid number format' };
    }

    // Check for empty or just decimal point
    if (amount === '' || amount === '.') {
      return { isValid: false, error: 'Invalid amount' };
    }

    const decimals = options.decimals || 18;

    let parsed: bigint;
    try {
      parsed = ethers.parseUnits(amount, decimals);
    } catch {
      return { isValid: false, error: 'Failed to parse amount' };
    }

    // Check for zero
    if (parsed === 0n && !options.allowZero) {
      return { isValid: false, error: 'Amount must be greater than zero' };
    }

    // Check minimum
    if (options.min) {
      try {
        const minParsed = ethers.parseUnits(options.min, decimals);
        if (parsed < minParsed) {
          return { isValid: false, error: `Amount must be at least ${options.min}` };
        }
      } catch {
        return { isValid: false, error: 'Invalid minimum value' };
      }
    }

    // Check maximum
    if (options.max) {
      try {
        const maxParsed = ethers.parseUnits(options.max, decimals);
        if (parsed > maxParsed) {
          return { isValid: false, error: `Amount must not exceed ${options.max}` };
        }
      } catch {
        return { isValid: false, error: 'Invalid maximum value' };
      }
    }

    return { isValid: true, parsed };
  }

  static isValid(amount: string, options = {}): boolean {
    return this.validate(amount, options).isValid;
  }

  static requireValid(amount: string, options = {}): bigint {
    const result = this.validate(amount, options);
    if (!result.isValid) {
      throw new Error(result.error);
    }
    return result.parsed!;
  }

  static validateBalance(
    amount: string,
    balance: string,
    decimals = 18
  ): { isValid: boolean; error?: string } {
    const amountResult = this.validate(amount, { decimals });
    if (!amountResult.isValid) {
      return amountResult;
    }

    try {
      const balanceParsed = ethers.parseUnits(balance, decimals);
      if (amountResult.parsed! > balanceParsed) {
        return { isValid: false, error: 'Insufficient balance' };
      }
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Invalid balance format' };
    }
  }
}

// Transaction data validation
export class TransactionValidator {
  static validateTransactionData(data: {
    to?: string;
    value?: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate recipient address
    if (data.to) {
      const addressResult = AddressValidator.validate(data.to);
      if (!addressResult.isValid) {
        errors.push(`Invalid recipient: ${addressResult.error}`);
      }
    }

    // Validate value
    if (data.value) {
      const valueResult = AmountValidator.validate(data.value, { allowZero: true });
      if (!valueResult.isValid) {
        errors.push(`Invalid value: ${valueResult.error}`);
      }
    }

    // Validate data field
    if (data.data && data.data !== '0x') {
      if (!/^0x[0-9a-fA-F]*$/.test(data.data)) {
        errors.push('Invalid transaction data format');
      }
    }

    // Validate gas limit
    if (data.gasLimit) {
      try {
        const gasLimit = BigInt(data.gasLimit);
        if (gasLimit <= 0) {
          errors.push('Gas limit must be greater than zero');
        }
        if (gasLimit > 30000000n) { // Ethereum block gas limit
          errors.push('Gas limit exceeds block limit');
        }
      } catch {
        errors.push('Invalid gas limit format');
      }
    }

    // Validate gas price
    if (data.gasPrice) {
      try {
        const gasPrice = BigInt(data.gasPrice);
        if (gasPrice < 0) {
          errors.push('Gas price cannot be negative');
        }
      } catch {
        errors.push('Invalid gas price format');
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Network validation
export class NetworkValidator {
  private static readonly SUPPORTED_NETWORKS = new Set([1, 5, 11155111, 137, 80001]);
  
  static validate(chainId: number): { isValid: boolean; error?: string } {
    if (typeof chainId !== 'number') {
      return { isValid: false, error: 'Chain ID must be a number' };
    }

    if (chainId <= 0) {
      return { isValid: false, error: 'Chain ID must be positive' };
    }

    return { isValid: true };
  }

  static isSupported(chainId: number): boolean {
    return this.SUPPORTED_NETWORKS.has(chainId);
  }

  static requireSupported(chainId: number): void {
    if (!this.isSupported(chainId)) {
      throw new Error(`Network ${chainId} is not supported`);
    }
  }

  static getSupportedNetworks(): number[] {
    return Array.from(this.SUPPORTED_NETWORKS);
  }
}

// Private key validation (for development/testing only)
export class PrivateKeyValidator {
  static validate(privateKey: string): { isValid: boolean; error?: string } {
    if (!privateKey) {
      return { isValid: false, error: 'Private key is required' };
    }

    if (typeof privateKey !== 'string') {
      return { isValid: false, error: 'Private key must be a string' };
    }

    // Remove 0x prefix if present
    const cleaned = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    // Check length (64 hex characters)
    if (cleaned.length !== 64) {
      return { isValid: false, error: 'Private key must be 64 characters long' };
    }

    // Check hex format
    if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
      return { isValid: false, error: 'Private key must contain only hex characters' };
    }

    // Warn about potential security issues
    if (process.env.NODE_ENV === 'production') {
      console.warn('WARNING: Private key validation should not be used in production');
    }

    return { isValid: true };
  }

  static isValid(privateKey: string): boolean {
    return this.validate(privateKey).isValid;
  }
}

// Input sanitization
export class InputSanitizer {
  static sanitizeAddress(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    const trimmed = input.trim();
    if (!AddressValidator.isValid(trimmed)) {
      throw new Error('Invalid address format');
    }
    
    return ethers.getAddress(trimmed);
  }

  static sanitizeAmount(input: string, decimals = 18): { value: string; parsed: bigint } {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    const trimmed = input.trim();
    const result = AmountValidator.validate(trimmed, { decimals });
    
    if (!result.isValid) {
      throw new Error(result.error);
    }

    return { value: trimmed, parsed: result.parsed! };
  }

  static sanitizeHexData(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    const trimmed = input.trim();
    
    if (trimmed === '') {
      return '0x';
    }

    if (!trimmed.startsWith('0x')) {
      throw new Error('Hex data must start with 0x');
    }

    if (!/^0x[0-9a-fA-F]*$/.test(trimmed)) {
      throw new Error('Invalid hex data format');
    }

    return trimmed.toLowerCase();
  }
}

// Form validation utilities
export class FormValidator {
  static validateTransferForm(form: {
    recipient: string;
    amount: string;
    balance: string;
    decimals?: number;
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const decimals = form.decimals || 18;

    // Validate recipient
    const recipientResult = AddressValidator.validate(form.recipient);
    if (!recipientResult.isValid) {
      errors.recipient = recipientResult.error!;
    }

    // Validate amount
    const amountResult = AmountValidator.validate(form.amount, { decimals });
    if (!amountResult.isValid) {
      errors.amount = amountResult.error!;
    } else {
      // Check balance if amount is valid
      const balanceResult = AmountValidator.validateBalance(
        form.amount,
        form.balance,
        decimals
      );
      if (!balanceResult.isValid) {
        errors.amount = balanceResult.error!;
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  static validateSwapForm(form: {
    tokenA: string;
    tokenB: string;
    amountIn: string;
    amountOutMin: string;
    balanceA: string;
    decimalsA?: number;
    decimalsB?: number;
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Validate token addresses
    if (!AddressValidator.isValid(form.tokenA)) {
      errors.tokenA = 'Invalid token A address';
    }

    if (!AddressValidator.isValid(form.tokenB)) {
      errors.tokenB = 'Invalid token B address';
    }

    if (form.tokenA === form.tokenB) {
      errors.tokenB = 'Tokens must be different';
    }

    // Validate amounts
    const decimalsA = form.decimalsA || 18;
    const decimalsB = form.decimalsB || 18;

    const amountInResult = AmountValidator.validate(form.amountIn, { decimals: decimalsA });
    if (!amountInResult.isValid) {
      errors.amountIn = amountInResult.error!;
    } else {
      const balanceResult = AmountValidator.validateBalance(
        form.amountIn,
        form.balanceA,
        decimalsA
      );
      if (!balanceResult.isValid) {
        errors.amountIn = balanceResult.error!;
      }
    }

    const amountOutResult = AmountValidator.validate(form.amountOutMin, { 
      decimals: decimalsB,
      allowZero: true
    });
    if (!amountOutResult.isValid) {
      errors.amountOutMin = amountOutResult.error!;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }
}

// Export all validators
export {
  AddressValidator,
  AmountValidator,
  TransactionValidator,
  NetworkValidator,
  PrivateKeyValidator,
  InputSanitizer,
  FormValidator
};