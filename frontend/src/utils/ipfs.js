const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

export const uploadToIPFS = async (data) => {
    const jwt = process.env.REACT_APP_PINATA_JWT;
    if (!jwt) {
        throw new Error('Pinata JWT not configured');
    }
    
    try {
        console.log('Uploading to Pinata IPFS...');
        
        const response = await fetch(PINATA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify({
                pinataOptions: {
                    cidVersion: 1
                },
                pinataContent: data
            })
        });

        if (!response.ok) {
            throw new Error(`Pinata upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Upload successful! CID:', result.IpfsHash);
        return result.IpfsHash;
    } catch (error) {
        console.error('IPFS upload error:', error.message);
        throw new Error(`IPFS upload failed: ${error.message}`);
    }
};

export const getFromIPFS = async (hash) => {
    try {
        console.log('Fetching from IPFS:', hash);
        const response = await fetch(`${PINATA_GATEWAY}/${hash}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch from Pinata: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('IPFS fetch successful');
        return data;
    } catch (error) {
        console.error('IPFS retrieval error:', error);
        throw error;
    }
};

export const testIPFSConnection = async () => {
    try {
        console.log('Testing Pinata IPFS connection...');
        const testData = { 
            test: 'Hello Pinata IPFS',
            timestamp: new Date().toISOString()
        };
        
        const hash = await uploadToIPFS(testData);
        console.log('Test upload successful!');
        
        // Verify we can retrieve the data
        const retrieved = await getFromIPFS(hash);
        console.log('Test retrieval successful!', retrieved);
        
        return hash;
    } catch (error) {
        console.error('Pinata IPFS test failed:', error.message);
        throw error;
    }
};