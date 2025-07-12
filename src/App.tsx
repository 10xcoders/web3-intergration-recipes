import React, { useState } from 'react';
import { 
  Wallet, 
  Code, 
  Shield, 
  Zap, 
  BookOpen, 
  Github, 
  ExternalLink,
  ChevronRight,
  Star,
  Users,
  Download
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const recipes = [
    {
      category: 'Wallet Integration',
      icon: <Wallet className="w-5 h-5" />,
      items: [
        { name: 'MetaMask Connection', status: 'Complete', difficulty: 'Beginner' },
        { name: 'Multi-Wallet Support', status: 'Complete', difficulty: 'Intermediate' },
        { name: 'Wallet Switching', status: 'Complete', difficulty: 'Beginner' }
      ]
    },
    {
      category: 'Smart Contract Interaction',
      icon: <Code className="w-5 h-5" />,
      items: [
        { name: 'Contract Calls', status: 'Complete', difficulty: 'Intermediate' },
        { name: 'Transaction Handling', status: 'Complete', difficulty: 'Advanced' },
        { name: 'Event Listening', status: 'In Progress', difficulty: 'Intermediate' }
      ]
    },
    {
      category: 'Data Fetching',
      icon: <Zap className="w-5 h-5" />,
      items: [
        { name: 'Blockchain Data', status: 'Complete', difficulty: 'Intermediate' },
        { name: 'Price Feeds', status: 'Complete', difficulty: 'Beginner' },
        { name: 'Historical Data', status: 'Planned', difficulty: 'Advanced' }
      ]
    }
  ];

  const templates = [
    {
      name: 'React dApp Template',
      description: 'Complete React starter with wallet integration, transaction management, and modern UI',
      tech: ['React', 'TypeScript', 'Tailwind', 'ethers.js'],
      status: 'Ready'
    },
    {
      name: 'Next.js Starter',
      description: 'Full-stack Next.js application with SSR support and web3 integration',
      tech: ['Next.js', 'TypeScript', 'wagmi', 'RainbowKit'],
      status: 'Coming Soon'
    },
    {
      name: 'Vanilla JS Template',
      description: 'Framework-agnostic implementation for maximum compatibility',
      tech: ['JavaScript', 'HTML5', 'CSS3', 'ethers.js'],
      status: 'Ready'
    }
  ];

  const stats = [
    { label: 'Recipes', value: '15+', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Templates', value: '3', icon: <Code className="w-5 h-5" /> },
    { label: 'Frameworks', value: '4', icon: <Zap className="w-5 h-5" /> },
    { label: 'Security Checks', value: '20+', icon: <Shield className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Web3 Integration Recipes
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            <span>Production-Ready Web3 Integration Patterns</span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Build Web3 Apps with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Confidence</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            A comprehensive collection of battle-tested web3 integration patterns, code examples, 
            and best practices for modern web developers. Skip the research, start building.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => setActiveTab('recipes')}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <BookOpen className="w-5 h-5" />
              <span>Explore Recipes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab('templates')}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-gray-300"
            >
              <Download className="w-5 h-5" />
              <span>Get Templates</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mx-auto mb-3">
                  {React.cloneElement(stat.icon, { className: 'w-6 h-6 text-white' })}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
              {['overview', 'recipes', 'templates', 'docs'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Wallet Integration</h3>
                  <p className="text-gray-600 mb-4">
                    Complete wallet connection flows with MetaMask, WalletConnect, and multi-wallet support.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li>• Auto-reconnection handling</li>
                    <li>• Network switching</li>
                    <li>• Error management</li>
                    <li>• Mobile compatibility</li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Smart Contracts</h3>
                  <p className="text-gray-600 mb-4">
                    Robust patterns for contract interactions, transaction handling, and event listening.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li>• Type-safe contract calls</li>
                    <li>• Gas optimization</li>
                    <li>• Transaction monitoring</li>
                    <li>• Event subscriptions</li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Security First</h3>
                  <p className="text-gray-600 mb-4">
                    Built-in security patterns, input validation, and protection against common vulnerabilities.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li>• Input sanitization</li>
                    <li>• XSS prevention</li>
                    <li>• Gas limit protection</li>
                    <li>• Phishing detection</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'recipes' && (
              <div className="space-y-8">
                {recipes.map((category, index) => (
                  <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
                    <div className="flex items-center space-x-3 mb-6">
                      {category.icon}
                      <h3 className="text-2xl font-semibold">{category.category}</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.status === 'Complete' ? 'bg-green-100 text-green-800' :
                              item.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.difficulty === 'Beginner' ? 'bg-blue-100 text-blue-800' :
                              item.difficulty === 'Intermediate' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.difficulty}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="grid md:grid-cols-3 gap-8">
                {templates.map((template, index) => (
                  <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold">{template.name}</h3>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        template.status === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{template.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {template.tech.map((tech, techIndex) => (
                        <span key={techIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <button 
                      className={`w-full py-3 rounded-lg font-medium transition-colors ${
                        template.status === 'Ready'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={template.status !== 'Ready'}
                    >
                      {template.status === 'Ready' ? 'Use Template' : 'Coming Soon'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Architecture Patterns</h3>
                  <p className="text-gray-600 mb-4">
                    Learn how to structure scalable web3 applications with proper separation of concerns.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 mb-6">
                    <li>• Layered architecture design</li>
                    <li>• State management patterns</li>
                    <li>• Component organization</li>
                    <li>• Testing strategies</li>
                  </ul>
                  <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                    <span>Read Guide</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Security Considerations</h3>
                  <p className="text-gray-600 mb-4">
                    Comprehensive security guide covering common vulnerabilities and protection strategies.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 mb-6">
                    <li>• Input validation patterns</li>
                    <li>• XSS prevention techniques</li>
                    <li>• Gas limit protection</li>
                    <li>• Phishing detection</li>
                  </ul>
                  <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                    <span>Security Guide</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Testing Strategies</h3>
                  <p className="text-gray-600 mb-4">
                    Best practices for testing web3 applications, including mocking and integration tests.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 mb-6">
                    <li>• Unit testing patterns</li>
                    <li>• Contract mocking</li>
                    <li>• Integration testing</li>
                    <li>• E2E test strategies</li>
                  </ul>
                  <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                    <span>Testing Guide</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Contributing</h3>
                  <p className="text-gray-600 mb-4">
                    Join our community and help improve web3 development for everyone.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 mb-6">
                    <li>• Contribution guidelines</li>
                    <li>• Code standards</li>
                    <li>• Review process</li>
                    <li>• Community support</li>
                  </ul>
                  <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                    <span>Start Contributing</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Build Your Web3 Application?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start with our production-ready templates and scale with confidence using battle-tested patterns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center justify-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-colors font-medium">
              <Download className="w-5 h-5" />
              <span>Download Templates</span>
            </button>
            <button className="flex items-center justify-center space-x-2 px-8 py-4 bg-blue-700 text-white rounded-xl hover:bg-blue-800 transition-colors font-medium">
              <Users className="w-5 h-5" />
              <span>Join Community</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded">
                  <Code className="w-4 h-4 text-white m-1" />
                </div>
                <span className="font-semibold">Web3 Recipes</span>
              </div>
              <p className="text-gray-400 text-sm">
                Production-ready web3 integration patterns for modern developers.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Recipes</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Wallet Integration</a></li>
                <li><a href="#" className="hover:text-white">Smart Contracts</a></li>
                <li><a href="#" className="hover:text-white">Data Fetching</a></li>
                <li><a href="#" className="hover:text-white">User Experience</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Templates</a></li>
                <li><a href="#" className="hover:text-white">Security Guide</a></li>
                <li><a href="#" className="hover:text-white">Best Practices</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">GitHub</a></li>
                <li><a href="#" className="hover:text-white">Discord</a></li>
                <li><a href="#" className="hover:text-white">Contributing</a></li>
                <li><a href="#" className="hover:text-white">Issues</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Web3 Integration Recipes. Open source under MIT License.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;