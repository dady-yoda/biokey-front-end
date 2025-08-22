import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Your contract ABI (simplified version)
const CONTRACT_ABI = [
  "function registerUser(bytes32 fingerprintHash, string memory storagePath) public",
  "function verifyFingerprint(bytes32 fingerprintHash) public view returns (address, string memory)",
  "event UserRegistered(address user, bytes32 fingerprintHash, string storagePath)"
];

// Your contract address (replace with your actual deployed contract address)
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";

function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [fingerprintData, setFingerprintData] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if MetaMask is installed
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      setStatus('MetaMask detected. Click "Connect MetaMask" to continue.');
    } else {
      setStatus('Please install MetaMask to use this application.');
    }
  }, []);

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        setStatus('Connecting to MetaMask...');
        
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        setAccount(accounts[0]);
        setStatus('Connected to MetaMask');
        
        // Create provider and contract instance (ethers v5 syntax)
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        
        const signer = web3Provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);
        
        setStatus('Ready to authenticate');
      } catch (error) {
        setStatus('Error connecting: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setStatus('Please install MetaMask!');
    }
  };

  // Simulate fingerprint scan
  const simulateFingerprintScan = () => {
    // Generate a unique fingerprint hash for simulation
    const simulatedFingerprint = Math.random().toString(36).substring(2) + 
                                Date.now().toString(36);
    // Ethers v5 syntax for encoding bytes32
    const fingerprintHash = ethers.utils.formatBytes32String(simulatedFingerprint);
    setFingerprintData(fingerprintHash);
    return fingerprintHash;
  };

  // Register a new user
  const registerUser = async () => {
    if (!contract) {
      setStatus('Please connect wallet first');
      return;
    }
    
    try {
      setIsLoading(true);
      setStatus('Registering...');
      
      // Generate a storage path for the user
      const storagePath = `/storage/user_${account.substring(0, 8)}/`;
      
      // Call the smart contract
      const transaction = await contract.registerUser(fingerprintData, storagePath);
      setStatus('Transaction sent. Waiting for confirmation...');
      
      // Wait for transaction to be mined
      await transaction.wait();
      
      setStatus('Registration successful!');
    } catch (error) {
      setStatus('Registration failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with fingerprint
  const loginWithFingerprint = async () => {
    if (!contract) {
      setStatus('Please connect wallet first');
      return;
    }
    
    try {
      setIsLoading(true);
      setStatus('Verifying fingerprint...');
      
      // Call the smart contract to verify
      const [userAddress, storagePath] = await contract.verifyFingerprint(fingerprintData);
      
      if (userAddress === account) {
        setUserInfo({ address: userAddress, storagePath });
        setStatus('Login successful!');
        console.log('Redirecting to:', storagePath);
      } else {
        setStatus('Fingerprint does not match this account');
      }
    } catch (error) {
      setStatus('Verification failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Scan fingerprint handler
  const handleScanFingerprint = () => {
    const hash = simulateFingerprintScan();
    setStatus('Fingerprint scanned: ' + hash.substring(0, 20) + '...');
  };

  return (
    <div className="fingerprint-auth-container">
      <div className="auth-card">
        <h2>Puter OS Blockchain Login</h2>
        
        <div className="status">{status}</div>
        
        {!account ? (
          <button 
            onClick={connectWallet} 
            disabled={isLoading}
            className="connect-btn"
          >
            {isLoading ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        ) : (
          <div className="connected-wallet">
            <p>Connected: {account.substring(0, 10)}...</p>
          </div>
        )}
        
        {account && (
          <>
            <div className="fingerprint-section">
              <h3>Fingerprint Authentication</h3>
              <button 
                onClick={handleScanFingerprint}
                disabled={isLoading}
                className="scan-btn"
              >
                Scan Fingerprint
              </button>
              
              {fingerprintData && (
                <div className="fingerprint-data">
                  <p>Fingerprint Hash: {fingerprintData.substring(0, 20)}...</p>
                </div>
              )}
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={registerUser}
                disabled={!fingerprintData || isLoading}
                className="register-btn"
              >
                Register
              </button>
              
              <button 
                onClick={loginWithFingerprint}
                disabled={!fingerprintData || isLoading}
                className="login-btn"
              >
                Login
              </button>
            </div>
          </>
        )}
        
        {userInfo && (
          <div className="user-info">
            <h3>User Information</h3>
            <p>Address: {userInfo.address}</p>
            <p>Storage Path: {userInfo.storagePath}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;