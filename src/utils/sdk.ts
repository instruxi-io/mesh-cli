import { MeshSDK, MeshSDKLite, Mesh, MeshLite, UnifiedClient } from '@instruxi-io/mesh-sdk-core';
import { createWalletClient, http, createPublicClient, Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Default API URI
const DEFAULT_API_URI = 'http://localhost:8080';
const SDK_VERSION = '0.1.0';

// Token storage path
const TOKEN_DIR = path.join(os.homedir(), '.mesh-cli');
const TOKEN_FILE = path.join(TOKEN_DIR, 'token.json');

// Token data interface
interface TokenData {
  token: string;
  expiresAt: number;
}

// Create a unified client for blockchain operations
async function createUnifiedClient(privateKey: string, chain: Chain = sepolia): Promise<UnifiedClient> {
  // Remove 0x prefix if present
  const normalizedKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  const viemAccount = privateKeyToAccount(`0x${normalizedKey}`);

  const publicClient = createPublicClient({
    chain,
    transport: http()
  }) as any;

  const walletClient = createWalletClient({
    account: viemAccount,
    chain,
    transport: http()
  }) as any;

  // Cast to any to avoid TypeScript errors with the UnifiedClient interface
  return {
    account: viemAccount,
    open: publicClient,
    private: {
      ...walletClient,
      chain,
    },
  } as any;
}

// Token management functions
function saveToken(token: string, expiresIn: number): void {
  // Create directory if it doesn't exist
  if (!fs.existsSync(TOKEN_DIR)) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
  }
  
  const expiresAt = Date.now() + expiresIn * 1000;
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, expiresAt }));
}

function getToken(): TokenData | null {
  if (fs.existsSync(TOKEN_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
      if (data.expiresAt > Date.now()) {
        return data;
      }
    } catch (error) {
      // If there's an error reading the token file, return null
      return null;
    }
  }
  return null;
}

// Initialize SDK with API key
export async function initSDKWithApiKey(apiKey: string, apiUri: string = DEFAULT_API_URI): Promise<MeshLite> {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const meshOptions = {
    apiUri,
    apiKey,
    version: SDK_VERSION
  };

  return MeshSDKLite.init(meshOptions);
}

// Initialize SDK with private key (SIWE)
export async function initSDKWithPrivateKey(privateKey: string, apiKey: string = '', apiUri: string = DEFAULT_API_URI): Promise<Mesh> {
  if (!privateKey) {
    throw new Error('Private key is required');
  }

  const unifiedClient = await createUnifiedClient(privateKey);

  const meshOptions = {
    apiUri,
    apiKey,
    version: SDK_VERSION,
    signer: unifiedClient
  };

  const mesh = MeshSDK.init(meshOptions);

  // Check for existing token
  const tokenData = getToken();
  if (tokenData) {
    console.log('Using existing token');
    mesh.setJwtToken(tokenData.token);
  }

  return mesh;
}

// Main SDK initialization function
export async function initSDK(): Promise<Mesh | MeshLite> {
  const apiKey = process.env.API_KEY;
  const privateKey = process.env.PRIVATE_KEY;
  const apiUri = process.env.API_URI || DEFAULT_API_URI;

  if (apiKey && !privateKey) {
    return initSDKWithApiKey(apiKey, apiUri);
  } else if (privateKey) {
    return initSDKWithPrivateKey(privateKey, apiKey || '', apiUri);
  } else {
    throw new Error('Either API_KEY or PRIVATE_KEY must be provided in environment variables');
  }
}

// Login with SIWE
export async function loginWithSIWE(mesh: Mesh): Promise<string> {
  const nonce = await mesh.enforcer.requestNonce({ account_address: mesh.getSigner.account.address });
  
  // Use a default domain and URI since we can't access the protected apiUri property
  const apiUri = process.env.API_URI || DEFAULT_API_URI;
  const domain = new URL(apiUri).hostname;
  
  const siweMessageParams = {
    domain,
    address: mesh.getSigner.account.address,
    uri: apiUri,
    version: '1' as const,
    chainId: 1,
    nonce: nonce.data.nonce,
    issuedAt: new Date(),
  };
  
  const { message, signature } = await mesh.signSiWeMessage(siweMessageParams);
  const authResponse = await mesh.enforcer.authenticateSiWe({ message, signature });
  
  // Save token with a long expiry (30 days)
  saveToken(authResponse.data.token, 30 * 24 * 60 * 60);
  
  return authResponse.data.token;
}
