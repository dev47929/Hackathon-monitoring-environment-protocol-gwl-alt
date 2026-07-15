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
}

export interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  github: GitHubConfig;
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
  gemini: {
    apiKey: env('GEMINI_API_KEY'),
    commitModel: 'gemini-2.5-flash',
    interviewModel: 'gemini-2.5-flash',
    presentationModel: 'gemini-2.5-pro',
    maxDiffChars: 30000,
  },
  blockchain: {
    rpcUrl: env('BLOCKCHAIN_RPC_URL'),
    privateKey: env('BLOCKCHAIN_PRIVATE_KEY'),
    contractAddress: env('SMART_CONTRACT_ADDRESS', '0x74f2e4129bb882ca1a654921b777a888c3a9f02c'),
    enabled: envBool('BLOCKCHAIN_ENABLED', true),
  },
};

export default config;
