import React from 'react';
import { WalletButton } from '../wallet/WalletButton';
import { NetworkIndicator } from '../wallet/NetworkIndicator';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                🌐 My dApp
              </h1>
            </div>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Portfolio
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Trading
              </a>
            </nav>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <NetworkIndicator />
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}