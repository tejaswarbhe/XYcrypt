// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

const API_URL = 'https://xycrypt.onrender.com';

function App() {
  // State for form inputs
  const [encryptKey, setEncryptKey] = useState('ABC123');
  const [plaintext, setPlaintext] = useState('');
  const [decryptKey, setDecryptKey] = useState('ABC123');
  const [ciphertext, setCiphertext] = useState('');
  
  // State for encryption metadata
  const [encryptionMetadata, setEncryptionMetadata] = useState({
    matrixKey: null,
    originalLength: 0,
    originalPlaintext: '',
  });
  
  // State for UI feedback
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    connecting: true,
    message: 'Connecting to Python backend...'
  });
  
  // State for operation status
  const [encryptStatus, setEncryptStatus] = useState({
    loading: false,
    success: false,
    error: '',
    showResult: false
  });
  
  const [decryptStatus, setDecryptStatus] = useState({
    loading: false,
    success: false,
    error: '',
    showResult: false,
    validation: { show: false, match: false, message: '' }
  });
  
  // Result state
  const [encryptResult, setEncryptResult] = useState('');
  const [decryptResult, setDecryptResult] = useState('');
  
  // Refs for textareas
  const plaintextRef = useRef(null);
  const ciphertextRef = useRef(null);
  
  // Check backend connection on component mount
  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch(`${API_URL}/encrypt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'test', plaintext: 'test' })
        });
        
        if (response.ok) {
          setConnectionStatus({
            connected: true,
            connecting: false,
            message: 'Connected to Python backend'
          });
          
          // Hide the connection message after 3 seconds
          setTimeout(() => {
            setConnectionStatus(prev => ({ ...prev, show: false }));
          }, 3000);
        } else {
          throw new Error('Backend returned error');
        }
      } catch (error) {
        setConnectionStatus({
          connected: false,
          connecting: false,
          message: 'Failed to connect to Python backend. Make sure the server is running.'
        });
      }
    }
    
    checkConnection();
  }, []);
  
  // Auto-resize textareas when content changes
  useEffect(() => {
    const resizeTextarea = (textarea) => {
      if (!textarea) return;
      textarea.style.height = 'auto';
      const newHeight = Math.min(300, Math.max(120, textarea.scrollHeight));
      textarea.style.height = `${newHeight}px`;
    };
    
    if (plaintextRef.current) {
      resizeTextarea(plaintextRef.current);
    }
    
    if (ciphertextRef.current) {
      resizeTextarea(ciphertextRef.current);
    }
  }, [plaintext, ciphertext]);
  
  // Handle encrypt key change (sync with decrypt key)
  const handleEncryptKeyChange = (e) => {
    setEncryptKey(e.target.value);
    setDecryptKey(e.target.value);
  };
  
  // Handle decrypt key change (sync with encrypt key)
  const handleDecryptKeyChange = (e) => {
    setDecryptKey(e.target.value);
    setEncryptKey(e.target.value);
  };
  
  // Handle encrypt button click
  const handleEncrypt = async () => {
    // Reset previous results
    setEncryptStatus({
      loading: true,
      success: false,
      error: '',
      showResult: false
    });
    
    // Basic validation
    if (!encryptKey.trim()) {
      setEncryptStatus({
        loading: false,
        success: false,
        error: 'Please enter an encryption key',
        showResult: false
      });
      return;
    }
    
    if (!plaintext) {
      setEncryptStatus({
        loading: false,
        success: false,
        error: 'Please enter text to encrypt',
        showResult: false
      });
      return;
    }
    
    try {
      // Call backend API for encryption
      const response = await fetch(`${API_URL}/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: encryptKey, plaintext })
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        // Store encryption metadata for decryption
        setEncryptionMetadata({
          matrixKey: result.MK,
          originalLength: result.length,
          originalPlaintext: plaintext
        });
        
        // Set results
        setEncryptResult(result.ciphertext);
        
        // Auto-fill the decryption side
        setCiphertext(result.ciphertext);
        
        // Update status
        setEncryptStatus({
          loading: false,
          success: true,
          error: '',
          showResult: true
        });
      } else {
        throw new Error(result.message || 'Encryption failed');
      }
    } catch (error) {
      // Show error message
      setEncryptStatus({
        loading: false,
        success: false,
        error: `Encryption failed: ${error.message}`,
        showResult: false
      });
      console.error(error);
    }
  };
  
  // Handle decrypt button click
  const handleDecrypt = async () => {
    // Reset previous results
    setDecryptStatus({
      loading: true,
      success: false,
      error: '',
      showResult: false,
      validation: { show: false, match: false, message: '' }
    });
    
    // Basic validation
    if (!decryptKey.trim()) {
      setDecryptStatus({
        loading: false,
        success: false,
        error: 'Please enter a decryption key',
        showResult: false,
        validation: { show: false, match: false, message: '' }
      });
      return;
    }
    
    if (!ciphertext) {
      setDecryptStatus({
        loading: false,
        success: false,
        error: 'Please enter text to decrypt',
        showResult: false,
        validation: { show: false, match: false, message: '' }
      });
      return;
    }
    
    try {
      // Call backend API for decryption
      const response = await fetch(`${API_URL}/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: decryptKey,
          ciphertext,
          length: encryptionMetadata.originalLength,
          MK: encryptionMetadata.matrixKey
        })
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        // Set decryption result
        setDecryptResult(result.plaintext);
        
        // Validate against stored original plaintext if available
        let validationStatus = { show: false, match: false, message: '' };
        
        if (encryptionMetadata.originalPlaintext) {
          if (encryptionMetadata.originalPlaintext === result.plaintext) {
            validationStatus = {
              show: true,
              match: true,
              message: '✓ Decryption matches the original plaintext!'
            };
          } else {
            validationStatus = {
              show: true,
              match: false,
              message: '✗ Decryption does not match the original plaintext.'
            };
          }
        }
        
        // Update status
        setDecryptStatus({
          loading: false,
          success: true,
          error: '',
          showResult: true,
          validation: validationStatus
        });
      } else {
        throw new Error(result.message || 'Decryption failed');
      }
    } catch (error) {
      // Show error message
      setDecryptStatus({
        loading: false,
        success: false,
        error: `Decryption failed: ${error.message}`,
        showResult: false,
        validation: { show: false, match: false, message: '' }
      });
      console.error(error);
    }
  };
  
  // Copy text to clipboard function
  const copyToClipboard = async (text, setButtonText) => {
    try {
      await navigator.clipboard.writeText(text);
      setButtonText('Copied!');
      setTimeout(() => setButtonText('Copy'), 1500);
    } catch (err) {
      console.error('Could not copy text: ', err);
    }
  };
  
  // State for copy button text
  const [copyEncryptButtonText, setCopyEncryptButtonText] = useState('Copy');
  const [copyDecryptButtonText, setCopyDecryptButtonText] = useState('Copy');
  
  return (
    <div className="app-container">
      <h1>Xycrypt - Encryption & Decryption Tool</h1>
      
      {/* Connection Status */}
      {connectionStatus.connecting || !connectionStatus.connected ? (
        <div className="connection-status">
          <div className={`status-indicator ${connectionStatus.connecting ? 'status-connecting' : 'status-disconnected'}`}></div>
          <span>{connectionStatus.message}</span>
        </div>
      ) : null}
      
      <div className="container">
        {/* Encryption Panel */}
        <div className="panel">
          <h2>Encryption</h2>
          
          <label>
            Encryption Key:
            <span className="tooltip">
              <span className="info-icon">i</span>
              <span className="tooltiptext">This is your secret key. Keep it safe and use the same key for decryption.</span>
            </span>
          </label>
          <input
            type="text"
            value={encryptKey}
            onChange={handleEncryptKeyChange}
            placeholder="Enter your secret key"
          />
          
          <label>
            Plaintext:
            <span className="tooltip">
              <span className="info-icon">i</span>
              <span className="tooltiptext">The text you want to encrypt. For best performance, keep it under 10 characters.</span>
            </span>
          </label>
          <textarea
            ref={plaintextRef}
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder="Enter text to encrypt"
          />
          
          <button 
            onClick={handleEncrypt} 
            disabled={encryptStatus.loading}
          >
            {encryptStatus.loading && (
              <span className="spinner"></span>
            )}
            Encrypt
          </button>
          
          {encryptStatus.loading && (
            <div className="progress-bar">
              <div className="progress"></div>
            </div>
          )}
          
          {encryptStatus.error && (
            <div className="error">{encryptStatus.error}</div>
          )}
          
          {encryptStatus.success && (
            <div className="success">Encryption completed successfully!</div>
          )}
          
          {encryptStatus.showResult && (
            <div className="result-container show">
              <h3>Encryption Result:</h3>
              <button 
                className="copy-btn" 
                onClick={() => copyToClipboard(encryptResult, setCopyEncryptButtonText)}
              >
                {copyEncryptButtonText}
              </button>
              
              <p><strong>Ciphertext (encoded):</strong></p>
              <pre>{encryptResult}</pre>
              
              <div>
                <p className="info">Copy this ciphertext for decryption. Use the same key for decryption as used for encryption.</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Decryption Panel */}
        <div className="panel">
          <h2>Decryption</h2>
          
          <label>
            Decryption Key:
            <span className="tooltip">
              <span className="info-icon">i</span>
              <span className="tooltiptext">Must be the same key used for encryption.</span>
            </span>
          </label>
          <input
            type="text"
            value={decryptKey}
            onChange={handleDecryptKeyChange}
            placeholder="Enter your secret key"
          />
          
          <label>
            Ciphertext:
            <span className="tooltip">
              <span className="info-icon">i</span>
              <span className="tooltiptext">Paste the encrypted text from the encryption result.</span>
            </span>
          </label>
          <textarea
            ref={ciphertextRef}
            value={ciphertext}
            onChange={(e) => setCiphertext(e.target.value)}
            placeholder="Enter text to decrypt"
          />
          
          <button 
            onClick={handleDecrypt} 
            disabled={decryptStatus.loading}
          >
            {decryptStatus.loading && (
              <span className="spinner"></span>
            )}
            Decrypt
          </button>
          
          {decryptStatus.loading && (
            <div className="progress-bar">
              <div className="progress"></div>
            </div>
          )}
          
          {decryptStatus.error && (
            <div className="error">{decryptStatus.error}</div>
          )}
          
          {decryptStatus.success && (
            <div className="success">Decryption completed successfully!</div>
          )}
          
          {decryptStatus.showResult && (
            <div className="result-container show">
              <h3>Decryption Result:</h3>
              <button 
                className="copy-btn" 
                onClick={() => copyToClipboard(decryptResult, setCopyDecryptButtonText)}
              >
                {copyDecryptButtonText}
              </button>
              
              <p><strong>Plaintext:</strong></p>
              <pre>{decryptResult}</pre>
              
              {decryptStatus.validation.show && (
                <div className={`validation ${decryptStatus.validation.match ? 'match' : 'mismatch'}`}>
                  {decryptStatus.validation.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <footer>
        Xycrypt Encryption Tool - © 2025
      </footer>
    </div>
  );
}

export default App;