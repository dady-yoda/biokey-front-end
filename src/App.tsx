import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { Fingerprint } from 'lucide-react';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import './App.css';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ABI = [
  "function registerUser(bytes32 fingerprintHash, string memory storagePath) public",
  "function verifyFingerprint(bytes32 fingerprintHash) public view returns (address, string memory)",
  "event UserRegistered(address user, bytes32 fingerprintHash, string storagePath)"
];

const CONTRACT_ADDRESS = "0x02A325A665Adff460A63B24EaED29C68390b22C4";
const USER_API_BASE_URL = "http://15.206.189.237:5000/api";
const BLOCKCHAIN_RPC_URL = "http://15.206.189.237:8545";

// MetaMask Fox Logo SVG Component
const MetaMaskLogo = () => (
  <svg width="24" height="24" viewBox="0 0 318.6 318.6" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Keep the full SVG code you provided */}
  </svg>
);

export default function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState<any>(null);
  const [fingerprintData, setFingerprintData] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [existingUsername, setExistingUsername] = useState('');

  // Get provider function
  const getProvider = useCallback(() => {
    if (typeof window.ethereum !== 'undefined') {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    return new ethers.providers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
  }, []);

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      setStatus('MetaMask detected. Choose a login method.');
    } else {
      setStatus('Please install MetaMask to use this application.');
    }
  }, []);

  // Check if user exists in database when account changes
  const checkUserExists = useCallback(async () => {
    if (!account) return;
    
    try {
      const response = await axios.get(`${USER_API_BASE_URL}/user/${account}`);
      setExistingUsername(response.data.username);
      setStatus(`Welcome back, ${response.data.username}!`);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setShowUsernameForm(true);
        setStatus('Please choose a username for your account.');
      } else {
        console.error('Error checking user:', error);
        setStatus('Error checking user account. Please try again.');
        setShowUsernameForm(true); // Show form anyway on error
      }
    }
  }, [account]);

  useEffect(() => {
    checkUserExists();
  }, [checkUserExists]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        setStatus('Connecting to MetaMask...');
        
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        setAccount(accounts[0]);
        setStatus('Connected to MetaMask');
        
        const web3Provider = getProvider();
        const signer = web3Provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);
        
        setStatus('Ready to authenticate');
      } catch (error: any) {
        setStatus('Error connecting: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setStatus('Please install MetaMask!');
    }
  };

  const saveUsername = async () => {
    if (!username.trim()) {
      setStatus('Please enter a valid username');
      return;
    }

    try {
      setIsLoading(true);
      setStatus('Saving username...');
      
      const response = await axios.post(`${USER_API_BASE_URL}/user`, {
        walletAddress: account,
        username: username.trim()
      });
      
      setExistingUsername(response.data.username);
      setShowUsernameForm(false);
      setStatus(`Username saved successfully! Welcome, ${response.data.username}!`);
    } catch (error: any) {
      if (error.response && error.response.data.error === 'Username already taken') {
        setStatus('Username already taken. Please choose another one.');
      } else {
        setStatus('Error saving username: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const simulateFingerprintScan = () => {
    const simulatedFingerprint = Math.random().toString(36).substring(2) + 
                                Date.now().toString(36);
    const fingerprintHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(simulatedFingerprint));
    setFingerprintData(fingerprintHash);
    return fingerprintHash;
  };

  const handleLoginMethodSelect = (method: string) => {
    setLoginMethod(method);
    if (method === 'metamask') {
      connectWallet();
    } else if (method === 'fingerprint') {
      setStatus('Fingerprint authentication selected');
      // You can add fingerprint authentication logic here
    }
  };

  const resetLoginMethod = () => {
    setLoginMethod(null);
    setFingerprintData('');
  };

  // If a login method is selected and we have user info to show
  if (loginMethod && account) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden">
        {/* Background elements from your new UI */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 animate-pulse" style={{ animationDuration: '8s' }}>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1691318110143-ebd82d266740?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHRlY2hub2xvZ3klMjBkaWdpdGFsJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NTYwMDM3MTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Abstract technology background"
              className="w-full h-full object-cover opacity-30"
            />
          </div>
          
          {/* Animated overlay for parallax effect */}
          <div className="absolute inset-0 transform scale-110 animate-pulse opacity-20" style={{ animationDuration: '12s', animationDelay: '2s' }}>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1691318110143-ebd82d266740?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHRlY2hub2xvZ3klMjBkaWdpdGFsJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NTYwMDM3MTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Abstract technology background overlay"
              className="w-full h-full object-cover blur-sm"
            />
          </div>
        </div>
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-purple-900/70 to-gray-800/80"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          {/* Glass Card */}
          <div className="w-full max-w-md">
            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-white text-center mb-4">Puter OS Blockchain Login</h2>
              
              <div className="text-white text-center mb-4">{status}</div>
              
              {loginMethod === 'metamask' && account && (
                <div className="metamask-section">
                  <h3 className="text-white text-center">MetaMask Login</h3>
                  <div className="connected-wallet text-center">
                    <p className="text-white">Connected: {account.substring(0, 10)}...</p>
                    
                    {showUsernameForm ? (
                      <div className="username-form mt-4">
                        <p className="text-white">Please choose a username for your account:</p>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter your username"
                          disabled={isLoading}
                          className="username-input w-full p-2 mt-2 rounded bg-white/10 border border-white/20 text-white"
                        />
                        <button 
                          onClick={saveUsername}
                          disabled={isLoading || !username.trim()}
                          className="save-username-btn w-full p-2 mt-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {isLoading ? 'Saving...' : 'Save Username'}
                        </button>
                      </div>
                    ) : (
                      <div className="user-info mt-4">
                        <p className="text-white">Welcome, {existingUsername}!</p>
                        <p className="text-white">You are now logged in with MetaMask.</p>
                      </div>
                    )}
                  </div>
                  <button onClick={resetLoginMethod} className="back-btn w-full p-2 mt-4 rounded bg-gray-600 hover:bg-gray-700 text-white">
                    Back to Login Options
                  </button>
                </div>
              )}
              
              {loginMethod === 'fingerprint' && (
                <div className="fingerprint-section text-center">
                  <h3 className="text-white">Fingerprint Authentication</h3>
                  <button 
                    onClick={simulateFingerprintScan}
                    disabled={isLoading}
                    className="scan-btn w-full p-2 mt-2 rounded bg-green-600 hover:bg-green-700 text-white"
                  >
                    Scan Fingerprint
                  </button>
                  <button onClick={resetLoginMethod} className="back-btn w-full p-2 mt-4 rounded bg-gray-600 hover:bg-gray-700 text-white">
                    Back to Login Options
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the login options UI if no method is selected
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated Background Image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 animate-pulse" style={{ animationDuration: '8s' }}>
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1691318110143-ebd82d266740?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHRlY2hub2xvZ3klMjBkaWdpdGFsJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NTYwMDM3MTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Abstract technology background"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        
        {/* Animated overlay for parallax effect */}
        <div className="absolute inset-0 transform scale-110 animate-pulse opacity-20" style={{ animationDuration: '12s', animationDelay: '2s' }}>
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1691318110143-ebd82d266740?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHRlY2hub2xvZ3klMjBkaWdpdGFsJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NTYwMDM3MTd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Abstract technology background overlay"
            className="w-full h-full object-cover blur-sm"
          />
        </div>
      </div>
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-purple-900/70 to-gray-800/80"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Additional floating elements */}
        <div className="absolute top-1/3 right-1/3 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '8s', animationDelay: '3s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        {/* Glass Card */}
        <div className="w-full max-w-md">
          <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-white text-2xl font-bold mb-2">Welcome back to BiokeyOS</h1>
              <p className="text-gray-300">Choose your preferred authentication method</p>
              <p className="text-gray-400 text-sm mt-2">{status}</p>
            </div>

            {/* Buttons Container */}
            <div className="space-y-4">
              {/* MetaMask Button */}
              <button
                onClick={() => handleLoginMethodSelect('metamask')}
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 disabled:opacity-50"
              >
                {/* Button Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-purple-600 transition-all duration-300"></div>
                
                {/* Button Content */}
                <div className="relative flex items-center justify-center space-x-3">
                  <MetaMaskLogo />
                  <span className="text-white font-medium">Connect MetaMask</span>
                </div>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-gray-400 bg-transparent">or</span>
                </div>
              </div>

              {/* Fingerprint Button */}
              <button
                onClick={() => handleLoginMethodSelect('fingerprint')}
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-50"
              >
                {/* Button Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 group-hover:from-green-600 group-hover:via-green-500 group-hover:to-emerald-500 transition-all duration-300"></div>
                
                {/* Glowing Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-green-300/20 to-emerald-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Button Content */}
                <div className="relative flex items-center justify-center space-x-3">
                  <Fingerprint className="w-6 h-6 text-white group-hover:text-green-100 transition-colors duration-300" />
                  <span className="text-white font-medium group-hover:text-green-100 transition-colors duration-300">Use Fingerprint</span>
                </div>
              </button>
            </div>

            {/* Security Badge */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-300 text-sm">Secured with end-to-end encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}