import React from 'react';
import { WalletProvider } from './providers/WalletProvider';
import { TransactionProvider } from './providers/TransactionProvider';
import { Header } from './components/layout/Header';
import { MainContent } from './components/layout/MainContent';
import { Footer } from './components/layout/Footer';
import { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  return (
    <WalletProvider>
      <TransactionProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <MainContent />
          <Footer />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </TransactionProvider>
    </WalletProvider>
  );
}

export default App;