import React, { useState, useEffect, useCallback } from 'react';
import {
  createTransaction,
  getTxRawFromTxRawOrDirectSignResponse,
  MsgCreateDenom,
  MsgMint,
  MsgChangeAdmin,
  MsgSetDenomMetadata,
  TxRestApi,
  ChainGrpcAuthApi,
} from '@injectivelabs/sdk-ts';
import { broadcastTx, getKeplr } from '../utils/keplrUtils';
import axios from 'axios';
import { useNetwork } from '../contexts/NetworkContext';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';
import crypto from 'crypto';

// Function to fetch the document and compute the SHA-256 hash
async function generateUriHash(uri: string): Promise<string | null> {
  try {
    const response = await axios.get(uri, { responseType: 'arraybuffer' });
    const documentContent = response.data;
    const hash = crypto.createHash('sha256').update(documentContent).digest('hex');
    return hash;
  } catch (error) {
    console.error('Error fetching the document or generating hash:', error);
    return null;
  }
}

// Helper function for uploading an image to Pinata
const uploadImageToPinata = async (file: File): Promise<string | null> => {
  const apiKey = '801873651d8211b81406';  // Replace with your actual Pinata API key
  const apiSecret = 'ef3d8d8b9de6d8fd7276959bf36c543e4509f288f0d6dcee29f029c821852210';  // Replace with your actual Pinata API secret
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
    });

    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    console.log('Image uploaded successfully, IPFS URL:', ipfsUrl);
    return ipfsUrl;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    return null;
  }
};

const TokenCreator = () => {
  const { isTestnet } = useNetwork();
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [decimals, setDecimals] = useState(6);
  const [injectiveAddress, setInjectiveAddress] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const network = isTestnet ? Network.Testnet : Network.Mainnet;
  const endpoints = getNetworkEndpoints(network);
  const chainId = isTestnet ? 'injective-888' : 'injective-1';

  const initializeKeplr = useCallback(async () => {
    try {
      const { key } = await getKeplr(chainId);
      setInjectiveAddress(key.bech32Address);
    } catch (error) {
      console.error('Error initializing Keplr:', error);
    }
  }, [chainId]);

  useEffect(() => {
    initializeKeplr();
  }, [initializeKeplr]);

  const createToken = async () => {
    if (!injectiveAddress) {
      setStatus('Please connect your wallet first.');
      return;
    }

    if (!symbol || !name || !description || !logo) {
      setStatus('Please fill all required fields.');
      return;
    }

    const logoUrl = await uploadImageToPinata(logo);
    if (!logoUrl) {
      setStatus('Failed to upload logo to IPFS.');
      return;
    }

    // Generate URI hash for the logo
    const uriHash = await generateUriHash(logoUrl);
    if (!uriHash) {
      setStatus('Failed to generate URI hash for logo.');
      return;
    }

    const subdenom = symbol.toLowerCase();
    const denom = `factory/${injectiveAddress}/${subdenom}`;
    const amount = 1_000_000_000;

    try {
      const msgCreateDenom = MsgCreateDenom.fromJSON({ subdenom, sender: injectiveAddress });
      const msgMint = MsgMint.fromJSON({ sender: injectiveAddress, amount: { denom, amount: amount.toString() } });
      const msgChangeAdmin = MsgChangeAdmin.fromJSON({
        denom,
        sender: injectiveAddress,
        newAdmin: 'inj1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqe2hm49',
      });

      const msgSetDenomMetadata = MsgSetDenomMetadata.fromJSON({
        sender: injectiveAddress,
        metadata: {
          decimals: decimals,
          base: denom,
          description,
          display: symbol,
          name,
          symbol,
          uri: logoUrl,
          uriHash: uriHash || '',
          denomUnits: [{ denom, exponent: decimals, aliases: [symbol] }],
        },
      });

      const { offlineSigner } = await getKeplr(chainId);
      const accounts = await offlineSigner.getAccounts();
      if (!accounts || accounts.length === 0) {
        setStatus('No accounts found. Please ensure your wallet is connected.');
        return;
      }

      const [{ address, pubkey }] = accounts;

      // Fetch account details using gRPC
      const chainGrpcAuthApi = new ChainGrpcAuthApi(endpoints.grpc);
      const accountDetailsResponse = await chainGrpcAuthApi.fetchAccount(address);
      if (!accountDetailsResponse) {
        setStatus('Failed to retrieve account details from the blockchain.');
        return;
      }

      const sequence = accountDetailsResponse.baseAccount?.sequence;
      const accountNumber = accountDetailsResponse.baseAccount?.accountNumber;

      if (typeof sequence !== 'string' || typeof accountNumber !== 'string') {
        setStatus('Failed to retrieve valid account details from the blockchain.');
        return;
      }

      const messages = [msgCreateDenom, msgMint, msgSetDenomMetadata, msgChangeAdmin];
      console.log('Messages:', messages); // Debugging output

      // Create a transaction sign doc
      const signDoc = createTransaction({
        pubKey: pubkey,
        chainId,
        fee: {
          amount: [{ denom: 'inj', amount: '50000' }],
          gas: '500000',
        },
        message: messages,
        sequence: sequence,
        timeoutHeight: 0,
        accountNumber: accountNumber,
      });

      const directSignResponse = await offlineSigner.signDirect(address, signDoc);
      const txRaw = getTxRawFromTxRawOrDirectSignResponse(directSignResponse);
      const txHash = await broadcastTx(chainId, txRaw);
      const response = await new TxRestApi(endpoints.rest).fetchTxPoll(txHash);

      if (response && response.txHash) {
        setStatus(`Transaction successful: ${response.txHash}`);
      } else {
        setStatus('Transaction broadcasted but no response received.');
      }
    } catch (error) {
      console.error('Error creating token:', error);
      setStatus('Failed to create token. Please check the console for more details.');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
    }
  };

  return (
    <div className="flex justify-center items-center p-10 h-[90vh]">
      <div className="w-full max-w-md shadow-lg p-8 rounded-lg bg-[#f0f0ef]">
        <h2 className="text-2xl font-bold text-center mb-6">Create Your Token</h2>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Creator Address:
            <input
              type="text"
              value={injectiveAddress || ''}
              disabled
              className="w-full p-2 border rounded-lg outline-none bg-gray-100"
            />
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Symbol*:
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
              className="w-full p-2 border rounded-lg outline-none"
            />
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Name*:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 border rounded-lg outline-none"
            />
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Description*:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full p-2 border rounded-lg outline-none"
            />
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Logo*:
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              required
              className="w-full p-2 border rounded-lg outline-none"
            />
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Decimals*:
            <input
              type="number"
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
              required
              className="w-full p-2 border rounded-lg outline-none"
            />
          </label>
        </div>

        <button
          onClick={createToken}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Create Token
        </button>

        {status && <p className="mt-4 text-center text-red-500">{status}</p>}
      </div>
    </div>
  );
};

export default TokenCreator;

