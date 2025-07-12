/**
 * Centralized error handling utilities for web3 applications
 */

// Error types
export enum ErrorType {
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Base error class
export class Web3Error extends Error {
  public readonly type: ErrorType;
  public readonly code?: number | string;
  public readonly originalError?: any;

  constructor(
    type: ErrorType,
    message: string,
    code?: number | string,
    originalError?: any
  ) {
    super(message);
    this.name = 'Web3Error';
    this.type = type;
    this.code = code;
    this.originalError = originalError;
  }
}

// Specific error classes
export class UserRejectedError extends Web3Error {
  constructor(message = 'Transaction rejected by user', originalError?: any) {
    super(ErrorType.USER_REJECTED, message, 4001, originalError);
    this.name = 'UserRejectedError';
  }
}

export class InsufficientFundsError extends Web3Error {
  constructor(message = 'Insufficient funds for transaction', originalError?: any) {
    super(ErrorType.INSUFFICIENT_FUNDS, message, 'INSUFFICIENT_FUNDS', originalError);
    this.name = 'InsufficientFundsError';
  }
}

export class NetworkError extends Web3Error {
  constructor(message = 'Network connection failed', originalError?: any) {
    super(ErrorType.NETWORK_ERROR, message, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

export class ContractError extends Web3Error {
  constructor(message: string, originalError?: any) {
    super(ErrorType.CONTRACT_ERROR, message, 'CONTRACT_ERROR', originalError);
    this.name = 'ContractError';
  }
}

export class ValidationError extends Web3Error {
  constructor(message: string, originalError?: any) {
    super(ErrorType.VALIDATION_ERROR, message, 'VALIDATION_ERROR', originalError);
    this.name = 'ValidationError';
  }
}

// Error parser
export class ErrorParser {
  static parse(error: any): Web3Error {
    if (error instanceof Web3Error) {
      return error;
    }

    // User rejected transaction
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      return new UserRejectedError(error.message, error);
    }

    // Insufficient funds
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return new InsufficientFundsError(error.message, error);
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return new NetworkError(error.message, error);
    }

    // Contract reverted
    if (error.reason || error.message?.includes('revert')) {
      const revertReason = error.reason || this.extractRevertReason(error.message);
      return new ContractError(`Contract reverted: ${revertReason}`, error);
    }

    // Gas estimation failed
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      return new ContractError('Transaction would fail - check parameters', error);
    }

    // Generic fallback
    return new Web3Error(
      ErrorType.UNKNOWN_ERROR,
      error.message || 'An unexpected error occurred',
      error.code,
      error
    );
  }

  private static extractRevertReason(message: string): string {
    const match = message.match(/revert (.+)'/);
    return match ? match[1] : 'Unknown reason';
  }

  static getUserFriendlyMessage(error: Web3Error): string {
    switch (error.type) {
      case ErrorType.USER_REJECTED:
        return 'Transaction was cancelled. Please try again if you want to proceed.';
      
      case ErrorType.INSUFFICIENT_FUNDS:
        return 'You don\'t have enough funds to complete this transaction. Please add more funds to your wallet.';
      
      case ErrorType.NETWORK_ERROR:
        return 'Network connection failed. Please check your internet connection and try again.';
      
      case ErrorType.CONTRACT_ERROR:
        return `Transaction failed: ${error.message}`;
      
      case ErrorType.VALIDATION_ERROR:
        return error.message;
      
      default:
        return 'Something went wrong. Please try again later.';
    }
  }
}

// Error handler with retry logic
export class ErrorHandler {
  private maxRetries: number;
  private retryDelay: number;

  constructor(maxRetries = 3, retryDelay = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async handleWithRetry<T>(
    operation: () => Promise<T>,
    shouldRetry?: (error: Web3Error) => boolean
  ): Promise<T> {
    let lastError: Web3Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = ErrorParser.parse(error);

        // Don't retry user-rejected errors
        if (lastError.type === ErrorType.USER_REJECTED) {
          throw lastError;
        }

        // Custom retry logic
        if (shouldRetry && !shouldRetry(lastError)) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          throw lastError;
        }

        // Wait before retrying
        await this.wait(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError!;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Error logger
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: Array<{ timestamp: Date; error: Web3Error; context?: string }> = [];

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Web3Error, context?: string): void {
    const logEntry = {
      timestamp: new Date(),
      error,
      context
    };

    this.logs.push(logEntry);
    
    // Keep only last 100 errors
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Web3 Error: ${error.type}`);
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      if (context) console.error('Context:', context);
      console.error('Original Error:', error.originalError);
      console.groupEnd();
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(logEntry);
    }
  }

  private sendToAnalytics(logEntry: any): void {
    // Implement your analytics service integration here
    // e.g., Sentry, LogRocket, etc.
  }

  getRecentErrors(limit = 10): Array<{ timestamp: Date; error: Web3Error; context?: string }> {
    return this.logs.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Global error boundary for React components
export class Web3ErrorBoundary {
  static wrapAsync<T>(
    fn: (...args: any[]) => Promise<T>
  ): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      try {
        return await fn(...args);
      } catch (error) {
        const web3Error = ErrorParser.parse(error);
        ErrorLogger.getInstance().log(web3Error, fn.name);
        throw web3Error;
      }
    };
  }

  static wrapSync<T>(
    fn: (...args: any[]) => T
  ): (...args: any[]) => T {
    return (...args: any[]): T => {
      try {
        return fn(...args);
      } catch (error) {
        const web3Error = ErrorParser.parse(error);
        ErrorLogger.getInstance().log(web3Error, fn.name);
        throw web3Error;
      }
    };
  }
}

// Transaction error tracker
export class TransactionErrorTracker {
  private static readonly COMMON_ERRORS = new Map([
    ['execution reverted', 'Transaction failed - contract requirements not met'],
    ['insufficient funds', 'Not enough ETH to pay for transaction'],
    ['gas required exceeds allowance', 'Gas limit too low for transaction'],
    ['nonce too low', 'Transaction nonce conflict - please retry'],
    ['replacement transaction underpriced', 'Gas price too low to replace transaction'],
    ['already known', 'Transaction already pending'],
    ['transaction underpriced', 'Gas price too low for current network conditions']
  ]);

  static getHumanReadableError(error: any): string {
    const errorMessage = error.message?.toLowerCase() || '';
    
    for (const [pattern, humanMessage] of this.COMMON_ERRORS) {
      if (errorMessage.includes(pattern)) {
        return humanMessage;
      }
    }

    return ErrorParser.getUserFriendlyMessage(ErrorParser.parse(error));
  }

  static isRetryable(error: Web3Error): boolean {
    const retryableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.UNKNOWN_ERROR
    ];

    // Network errors are retryable
    if (retryableTypes.includes(error.type)) {
      return true;
    }

    // Some contract errors might be retryable
    if (error.type === ErrorType.CONTRACT_ERROR) {
      const retryableMessages = ['network', 'timeout', 'connection'];
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg)
      );
    }

    return false;
  }
}

// Usage examples and utilities
export const handleWeb3Error = (error: any, context?: string): Web3Error => {
  const web3Error = ErrorParser.parse(error);
  ErrorLogger.getInstance().log(web3Error, context);
  return web3Error;
};

export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): T => {
  return Web3ErrorBoundary.wrapAsync(fn) as T;
};

// Export everything
export {
  ErrorParser,
  ErrorHandler,
  ErrorLogger,
  Web3ErrorBoundary,
  TransactionErrorTracker
};