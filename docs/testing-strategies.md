# Testing Strategies for Web3 Applications

A comprehensive guide to testing web3 applications, from individual functions to full end-to-end user flows. This document covers the unique challenges of testing decentralized applications and provides practical strategies and examples.

## Table of Contents

- [Why is Web3 Testing Different?](#why-is-web3-testing-different)
- [Types of Testing](#types-of-testing)
  - [1. Unit Testing](#1-unit-testing)
  - [2. Integration Testing](#2-integration-testing)
  - [3. End-to-End (E2E) Testing](#3-end-to-end-e2e-testing)
- [Testing Smart Contracts](#testing-smart-contracts)
  - [Local Blockchain Networks](#local-blockchain-networks)
  - [Frameworks: Hardhat vs. Foundry](#frameworks-hardhat-vs-foundry)
- [Testing Frontend Interactions](#testing-frontend-interactions)
  - [Mocking Wallet Connections](#mocking-wallet-connections)
  - [Mocking Contract Calls](#mocking-contract-calls)
  - [Testing Transaction Lifecycles](#testing-transaction-lifecycles)
- [Best Practices](#best-practices)

## Why is Web3 Testing Different?

Testing web3 applications introduces new complexities not found in traditional web development:

- **Blockchain State**: Tests may depend on or alter the state of a blockchain, which is persistent and complex.
- **Asynchronous Operations**: Nearly every interaction (fetching data, sending transactions) is asynchronous.
- **Wallet Interaction**: Core user flows depend on external browser extensions or hardware wallets.
- **Gas and Network Fees**: Transactions can fail due to unpredictable network conditions or incorrect gas calculations.
- **Immutability**: Once deployed, smart contracts cannot be easily changed, making thorough testing critical.

## Types of Testing

A robust testing strategy combines unit, integration, and end-to-end tests to ensure reliability and security.

### 1. Unit Testing

Unit tests verify the smallest, most isolated pieces of your application. They are fast, simple, and should form the foundation of your testing pyramid.

**What to test:**
- Utility functions (e.g., address formatters, number parsers).
- Individual React components or hooks with mock props.
- Business logic within services, isolated from external dependencies.

**Example: Testing a validation function with Jest**
```typescript
// utils/validation-functions/__tests__/AddressValidator.test.ts
import { AddressValidator } from '../AddressValidator';

describe('AddressValidator', () => {
  it('should return true for a valid address', () => {
    expect(AddressValidator.isValid('0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B')).toBe(true);
  });

  it('should return false for an invalid address', () => {
    expect(AddressValidator.isValid('0x123')).toBe(false);
  });

  it('should throw an error when requireValid is called with an invalid address', () => {
    expect(() => AddressValidator.requireValid('invalid-address')).toThrow('Invalid address');
  });
});
```

### 2. Integration Testing

Integration tests verify that different parts of your application work together correctly. In web3, this often means testing the connection between your UI, your services, and a mocked blockchain environment.

**What to test:**
- The flow from a UI component to a service layer that interacts with a contract.
- Wallet connection logic using a mocked provider.
- How your application handles contract events or state changes.

**Example: Testing a React hook that fetches contract data**
This example uses a mocked contract to test a hook similar to the `useContract` hook described in the [Architecture Patterns](./architecture-patterns.md).

```typescript
// __tests__/hooks/useTokenBalance.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTokenBalance } from '../useTokenBalance';
import { MockContract } from '../../mocks/MockContract';

describe('useTokenBalance', () => {
  it('should fetch and format the token balance', async () => {
    const mockContract = new MockContract();
    mockContract.mockResult('balanceOf', 1000000000000000000n); // 1.0
    mockContract.mockResult('decimals', 18);

    const { result } = renderHook(() => useTokenBalance(mockContract, '0x...'));

    await waitFor(() => {
      expect(result.current.balance).toBe('1.0');
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### 3. End-to-End (E2E) Testing

E2E tests simulate a real user's journey through your entire application. They are the most complex and slowest tests but provide the highest confidence that your dApp works as expected in a live environment.

**What to test:**
- The full user flow of connecting a wallet.
- Executing a transaction and waiting for it to be mined.
- Verifying that the UI updates correctly after a transaction succeeds or fails.

Tools like **Cypress** (with plugins like [Synpress](https://github.com/Synthetixio/synpress)) or **Playwright** can automate browser actions, including interacting with a real MetaMask extension.

## Testing Smart Contracts

Frontend testing is only half the story. Smart contracts must be rigorously tested before deployment.

### Local Blockchain Networks

To test contracts, you need a local blockchain environment that simulates the Ethereum network. This allows you to deploy contracts, send transactions, and check state instantly without paying real gas fees.

- **Hardhat Network**: A local Ethereum network designed for development, bundled with Hardhat. It mines blocks instantly and supports `console.log` in Solidity.
- **Anvil**: A blazing-fast local testnet node included with Foundry.

### Frameworks: Hardhat vs. Foundry

**Hardhat** and **Foundry** are the two leading frameworks for smart contract development and testing.

- **Hardhat**: Uses JavaScript/TypeScript for tests, making it familiar for web developers. It has a vast ecosystem of plugins.
- **Foundry**: Uses Solidity for tests, allowing developers to stay in one language. It is known for its high performance.

**Example: Hardhat Test (JavaScript)**
```javascript
// test/Token.test.js
const { expect } = require("chai");

describe("Token contract", function () {
  it("should transfer tokens between accounts", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    const hardhatToken = await Token.deploy();

    // Transfer 1 token from owner to addr1
    await hardhatToken.transfer(addr1.address, 1);
    expect(await hardhatToken.balanceOf(addr1.address)).to.equal(1);
  });
});
```

**Example: Foundry Test (Solidity)**
```solidity
// test/Token.t.sol
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Token.sol";

contract TokenTest is Test {
    Token public token;

    function setUp() public {
        token = new Token();
    }

    function testTransfer() public {
        address recipient = address(0x1);
        token.transfer(recipient, 1 ether);
        assertEq(token.balanceOf(recipient), 1 ether);
    }
}
```

| Feature             | Hardhat                               | Foundry                               |
| ------------------- | ------------------------------------- | ------------------------------------- |
| **Test Language**   | JavaScript / TypeScript               | Solidity                              |
| **Performance**     | Fast                                  | Very Fast                             |
| **Ecosystem**       | Large plugin ecosystem                | Growing ecosystem, less mature        |
| **Developer UX**    | Familiar for JS devs, great tooling   | Seamless for Solidity devs, powerful  |
| **Best For**        | Teams with strong JS skills           | Teams prioritizing performance/Solidity |

## Testing Frontend Interactions

### Mocking Wallet Connections

You don't need a real wallet to test your connection logic. You can mock the `window.ethereum` object to simulate wallet behavior. See the example in [architecture-patterns.md](./architecture-patterns.md#hook-testing).

### Mocking Contract Calls

Create a simple mock class to simulate contract behavior, allowing you to control return values and test how your UI handles different scenarios.

```typescript
// mocks/MockContract.ts
export class MockContract {
  private results = new Map<string, any>();
  private errors = new Map<string, any>();

  mockResult(method: string, result: any) {
    this.results.set(method, result);
    return this;
  }

  mockError(method: string, error: any) {
    this.errors.set(method, error);
    return this;
  }

  // Dynamically create methods that return promises
  constructor() {
    return new Proxy(this, {
      get(target, prop: string) {
        if (prop in target) return target[prop as keyof MockContract];
        
        return (..._args: any[]) => {
          if (target.errors.has(prop)) {
            return Promise.reject(target.errors.get(prop));
          }
          if (target.results.has(prop)) {
            return Promise.resolve(target.results.get(prop));
          }
          return Promise.reject(new Error(`Mock for ${prop} not found`));
        };
      }
    });
  }
}
```

### Testing Transaction Lifecycles

Use your mocked contract to test all stages of a transaction: `pending`, `success`, and `error`.

```typescript
// __tests__/components/TransferForm.test.tsx
it('displays a success message after a successful transaction', async () => {
  const mockContract = new MockContract().mockResult('transfer', {
    hash: '0x...',
    wait: () => Promise.resolve({ status: 1 })
  });

  // Render component with mock contract
  // Simulate form submission
  // Assert that success UI is shown
});

it('displays an error message when the transaction fails', async () => {
  const mockContract = new MockContract().mockError('transfer', new Error('User rejected'));

  // Render component with mock contract
  // Simulate form submission
  // Assert that error UI is shown
});
```

## Best Practices

- **Test on a Fork**: For high-fidelity testing, use Hardhat or Foundry to fork a public testnet or mainnet. This lets you test against real, deployed contracts and data.
- **Cover Edge Cases**: Test for insufficient funds, user-rejected transactions, high/low slippage, and network errors.
// ...existing code...
- **Isolate State**: Ensure tests are independent and do not share state. Reset the local blockchain or mocks before each test.
- **Security First**: Integrate security checks into your testing pipeline. See [Security Considerations](./security-considerations.md) for more.

## Further Reading and Resources

Here are some excellent resources to deepen your understanding of web3 testing:

- **Official Documentation:**
  - [Hardhat: Testing Contracts](https://hardhat.org/hardhat-runner/docs/guides/testing)
  - [The Foundry Book: Writing Tests](https://book.getfoundry.sh/forge/tests)
  - [Viem: Test Clients & Utilities](https://viem.sh/docs/clients/test)
  - [Ethers.js: Testing](https://docs.ethers.org/v5/getting-started/#getting-started--testing)

- **Tools for E2E Testing:**
  - [Synpress](https://github.com/Synthetixio/synpress): A Cypress plugin for testing dApps with MetaMask.
  - [Playwright](https://playwright.dev/docs/intro): A modern E2E testing framework that can be configured for web3 testing.

- **Articles and Guides:**
  - [Alchemy: A Guide to End-to-End Testing for DApps](https://www.alchemy.com/blog/end-to-end-testing-dapps)
  - [ConsenSys: Smart Contract Testing Strategy and Tools](https://consensys.io/blog/developers/smart-contract-testing-strategy-and-tools)
  - [OpenZeppelin: The Ultimate Guide to Smart Contract Testing](https://blog.openzeppelin.com/the-ultimate-guide-to-smart-contract-testing/)



# Testing Strategies for Web3 Applications

A comprehensive guide to testing web3 applications, from individual functions to full end-to-end user flows. This document covers the unique challenges of testing decentralized applications and provides practical strategies and examples.

## Table of Contents

- [Why is Web3 Testing Different?](#why-is-web3-testing-different)
- [Types of Testing](#types-of-testing)
  - [1. Unit Testing](#1-unit-testing)
  - [2. Integration Testing](#2-integration-testing)
  - [3. End-to-End (E2E) Testing](#3-end-to-end-e2e-testing)
- [Testing Smart Contracts](#testing-smart-contracts)
  - [Local Blockchain Networks](#local-blockchain-networks)
  - [Frameworks: Hardhat vs. Foundry](#frameworks-hardhat-vs-foundry)
- [Testing Frontend Interactions](#testing-frontend-interactions)
  - [Mocking Wallet Connections](#mocking-wallet-connections)
  - [Mocking Contract Calls](#mocking-contract-calls)
  - [Testing Transaction Lifecycles](#testing-transaction-lifecycles)
- [Best Practices](#best-practices)

## Why is Web3 Testing Different?

Testing web3 applications introduces new complexities not found in traditional web development:

- **Blockchain State**: Tests may depend on or alter the state of a blockchain, which is persistent and complex.
- **Asynchronous Operations**: Nearly every interaction (fetching data, sending transactions) is asynchronous.
- **Wallet Interaction**: Core user flows depend on external browser extensions or hardware wallets.
- **Gas and Network Fees**: Transactions can fail due to unpredictable network conditions or incorrect gas calculations.
- **Immutability**: Once deployed, smart contracts cannot be easily changed, making thorough testing critical.

## Types of Testing

A robust testing strategy combines unit, integration, and end-to-end tests to ensure reliability and security.

### 1. Unit Testing

Unit tests verify the smallest, most isolated pieces of your application. They are fast, simple, and should form the foundation of your testing pyramid.

**What to test:**
- Utility functions (e.g., address formatters, number parsers).
- Individual React components or hooks with mock props.
- Business logic within services, isolated from external dependencies.

**Example: Testing a validation function with Jest**
```typescript
// utils/validation-functions/__tests__/AddressValidator.test.ts
import { AddressValidator } from '../AddressValidator';

describe('AddressValidator', () => {
  it('should return true for a valid address', () => {
    expect(AddressValidator.isValid('0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B')).toBe(true);
  });

  it('should return false for an invalid address', () => {
    expect(AddressValidator.isValid('0x123')).toBe(false);
  });

  it('should throw an error when requireValid is called with an invalid address', () => {
    expect(() => AddressValidator.requireValid('invalid-address')).toThrow('Invalid address');
  });
});
```

### 2. Integration Testing

Integration tests verify that different parts of your application work together correctly. In web3, this often means testing the connection between your UI, your services, and a mocked blockchain environment.

**What to test:**
- The flow from a UI component to a service layer that interacts with a contract.
- Wallet connection logic using a mocked provider.
- How your application handles contract events or state changes.

**Example: Testing a React hook that fetches contract data**
This example uses a mocked contract to test a hook similar to the `useContract` hook described in the [Architecture Patterns](./architecture-patterns.md).

```typescript
// __tests__/hooks/useTokenBalance.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTokenBalance } from '../useTokenBalance';
import { MockContract } from '../../mocks/MockContract';

describe('useTokenBalance', () => {
  it('should fetch and format the token balance', async () => {
    const mockContract = new MockContract();
    mockContract.mockResult('balanceOf', 1000000000000000000n); // 1.0
    mockContract.mockResult('decimals', 18);

    const { result } = renderHook(() => useTokenBalance(mockContract, '0x...'));

    await waitFor(() => {
      expect(result.current.balance).toBe('1.0');
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### 3. End-to-End (E2E) Testing

E2E tests simulate a real user's journey through your entire application. They are the most complex and slowest tests but provide the highest confidence that your dApp works as expected in a live environment.

**What to test:**
- The full user flow of connecting a wallet.
- Executing a transaction and waiting for it to be mined.
- Verifying that the UI updates correctly after a transaction succeeds or fails.

Tools like **Cypress** (with plugins like [Synpress](https://github.com/Synthetixio/synpress)) or **Playwright** can automate browser actions, including interacting with a real MetaMask extension.

## Testing Smart Contracts

Frontend testing is only half the story. Smart contracts must be rigorously tested before deployment.

### Local Blockchain Networks

To test contracts, you need a local blockchain environment that simulates the Ethereum network. This allows you to deploy contracts, send transactions, and check state instantly without paying real gas fees.

- **Hardhat Network**: A local Ethereum network designed for development, bundled with Hardhat. It mines blocks instantly and supports `console.log` in Solidity.
- **Anvil**: A blazing-fast local testnet node included with Foundry.

### Frameworks: Hardhat vs. Foundry

**Hardhat** and **Foundry** are the two leading frameworks for smart contract development and testing.

- **Hardhat**: Uses JavaScript/TypeScript for tests, making it familiar for web developers. It has a vast ecosystem of plugins.
- **Foundry**: Uses Solidity for tests, allowing developers to stay in one language. It is known for its high performance.

**Example: Hardhat Test (JavaScript)**
```javascript
// test/Token.test.js
const { expect } = require("chai");

describe("Token contract", function () {
  it("should transfer tokens between accounts", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    const hardhatToken = await Token.deploy();

    // Transfer 1 token from owner to addr1
    await hardhatToken.transfer(addr1.address, 1);
    expect(await hardhatToken.balanceOf(addr1.address)).to.equal(1);
  });
});
```

**Example: Foundry Test (Solidity)**
```solidity
// test/Token.t.sol
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/Token.sol";

contract TokenTest is Test {
    Token public token;

    function setUp() public {
        token = new Token();
    }

    function testTransfer() public {
        address recipient = address(0x1);
        token.transfer(recipient, 1 ether);
        assertEq(token.balanceOf(recipient), 1 ether);
    }
}
```

| Feature             | Hardhat                               | Foundry                               |
| ------------------- | ------------------------------------- | ------------------------------------- |
| **Test Language**   | JavaScript / TypeScript               | Solidity                              |
| **Performance**     | Fast                                  | Very Fast                             |
| **Ecosystem**       | Large plugin ecosystem                | Growing ecosystem, less mature        |
| **Developer UX**    | Familiar for JS devs, great tooling   | Seamless for Solidity devs, powerful  |
| **Best For**        | Teams with strong JS skills           | Teams prioritizing performance/Solidity |

## Testing Frontend Interactions

### Mocking Wallet Connections

You don't need a real wallet to test your connection logic. You can mock the `window.ethereum` object to simulate wallet behavior. See the example in [architecture-patterns.md](./architecture-patterns.md#hook-testing).

### Mocking Contract Calls

Create a simple mock class to simulate contract behavior, allowing you to control return values and test how your UI handles different scenarios.

```typescript
// mocks/MockContract.ts
export class MockContract {
  private results = new Map<string, any>();
  private errors = new Map<string, any>();

  mockResult(method: string, result: any) {
    this.results.set(method, result);
    return this;
  }

  mockError(method: string, error: any) {
    this.errors.set(method, error);
    return this;
  }

  // Dynamically create methods that return promises
  constructor() {
    return new Proxy(this, {
      get(target, prop: string) {
        if (prop in target) return target[prop as keyof MockContract];
        
        return (..._args: any[]) => {
          if (target.errors.has(prop)) {
            return Promise.reject(target.errors.get(prop));
          }
          if (target.results.has(prop)) {
            return Promise.resolve(target.results.get(prop));
          }
          return Promise.reject(new Error(`Mock for ${prop} not found`));
        };
      }
    });
  }
}
```

### Testing Transaction Lifecycles

Use your mocked contract to test all stages of a transaction: `pending`, `success`, and `error`.

```typescript
// __tests__/components/TransferForm.test.tsx
it('displays a success message after a successful transaction', async () => {
  const mockContract = new MockContract().mockResult('transfer', {
    hash: '0x...',
    wait: () => Promise.resolve({ status: 1 })
  });

  // Render component with mock contract
  // Simulate form submission
  // Assert that success UI is shown
});

it('displays an error message when the transaction fails', async () => {
  const mockContract = new MockContract().mockError('transfer', new Error('User rejected'));

  // Render component with mock contract
  // Simulate form submission
  // Assert that error UI is shown
});
```

## Best Practices

- **Test on a Fork**: For high-fidelity testing, use Hardhat or Foundry to fork a public testnet or mainnet. This lets you test against real, deployed contracts and data.
- **Cover Edge Cases**: Test for insufficient funds, user-rejected transactions, high/low slippage, and network errors.
- **Isolate State**: Ensure tests are independent and do not share state. Reset the local blockchain or mocks before