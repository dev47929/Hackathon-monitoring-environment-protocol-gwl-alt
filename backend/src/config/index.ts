import dotenv from 'dotenv';

dotenv.config();

function env(name: string, fallback: string = ''): string {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

function envNumber(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v === 'true' || v === '1' || v === 'yes';
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  corsOrigin: string;
  isDev: boolean;
  isProd: boolean;
}

export interface DatabaseConfig {
  url: string;
}

export interface GitHubConfig {
  appId: string;
  privateKey: string;
  webhookSecret: string;
  personalAccessToken: string;
  apiBase: string;
  apiVersion: string;
}

export interface GroqConfig {
  apiKey: string;
  commitModel: string;
  interviewModel: string;
  presentationModel: string;
  maxDiffChars: number;
}

export interface GeminiConfig {
  apiKey: string;
  commitModel: string;
  interviewModel: string;
  presentationModel: string;
  maxDiffChars: number;
}

export interface BlockchainConfig {
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
  enabled: boolean;
  blockchainMode: 'dummy' | 'real' | 'off';
  signerAddress: string;
  blockInterval: number;
}

export interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  github: GitHubConfig;
  groq: GroqConfig;
  gemini: GeminiConfig;
  blockchain: BlockchainConfig;
}

export const config: Config = {
  server: {
    port: envNumber('PORT', 3000),
    nodeEnv: env('NODE_ENV', 'development'),
    jwtSecret: env('JWT_SECRET', 'dev-insecure-secret-change-me'),
    corsOrigin: env('CORS_ORIGIN', '*'),
    isDev: env('NODE_ENV', 'development') === 'development',
    isProd: env('NODE_ENV', 'development') === 'production',
  },
  database: {
    url: env('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/hackproof_db'),
  },
  github: {
    appId: env('GITHUB_APP_ID'),
    privateKey: env('GITHUB_PRIVATE_KEY'),
    webhookSecret: env('GITHUB_WEBHOOK_SECRET'),
    personalAccessToken: env('GITHUB_PERSONAL_ACCESS_TOKEN'),
    apiBase: 'https://api.github.com',
    apiVersion: '2022-11-28',
  },
  groq: {
    apiKey: env('GROQ_API_KEY'),
    commitModel: env('GROQ_COMMIT_MODEL', 'openai/gpt-oss-20b'),
    interviewModel: env('GROQ_INTERVIEW_MODEL', 'openai/gpt-oss-20b'),
    presentationModel: env('GROQ_PRESENTATION_MODEL', 'openai/gpt-oss-20b'),
    maxDiffChars: 30000,
  },
  gemini: {
    apiKey: env('GEMINI_API_KEY'),
    commitModel: env('GEMINI_COMMIT_MODEL', 'gemini-2.5-flash'),
    interviewModel: env('GEMINI_INTERVIEW_MODEL', 'gemini-2.5-flash'),
    presentationModel: env('GEMINI_PRESENTATION_MODEL', 'gemini-2.5-pro'),
    maxDiffChars: 30000,
  },
  blockchain: {
    rpcUrl: env('BLOCKCHAIN_RPC_URL'),
    privateKey: env('BLOCKCHAIN_PRIVATE_KEY'),
    contractAddress: env('SMART_CONTRACT_ADDRESS', '0x74f2e4129bb882ca1a654921b777a888c3a9f02c'),
    enabled: envBool('BLOCKCHAIN_ENABLED', true),
    blockchainMode: env('BLOCKCHAIN_MODE', 'dummy') as 'dummy' | 'real' | 'off',
    signerAddress: env('BLOCKCHAIN_SIGNER_ADDRESS', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'),
    blockInterval: envNumber('BLOCKCHAIN_BLOCK_INTERVAL', 10),
  },
};

export default config;
