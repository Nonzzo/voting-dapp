import React, { useState } from 'react';
import { testIPFSConnection } from '../utils/ipfs';

const IPFSTest = () => {
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTest = async () => {
        setLoading(true);
        setStatus('');
        setError('');
        
        try {
            const cid = await testIPFSConnection();
            setStatus(`Connection successful! Test CID: ${cid}`);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ipfs-test">
            <h3>IPFS Connection Test</h3>
            <button 
                onClick={handleTest}
                disabled={loading}
                className="test-button"
            >
                {loading ? 'Testing...' : 'Test IPFS Connection'}
            </button>
            
            {status && <div className="success-message">{status}</div>}
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default IPFSTest;