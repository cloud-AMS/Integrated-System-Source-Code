import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export type DeploymentEnvironment = 'staging' | 'production' | 'development';

export interface LoadedEnvResult {
  deploymentEnv: DeploymentEnvironment;
  loadedFiles: string[];
}

function normalizeDeploymentMode(raw?: string): DeploymentEnvironment | null {
  const cleaned = (raw || '').trim().toLowerCase();
  if (cleaned === 'staging') return 'staging';
  if (cleaned === 'production') return 'production';
  if (cleaned === 'development') return 'development';
  return null;
}

function peekEnvFileValue(filePath: string, key: string): string | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  try {
    const parsed = dotenv.parse(fs.readFileSync(filePath, 'utf8'));
    return parsed[key];
  } catch {
    return undefined;
  }
}

/**
 * Memuat file .env* di runtime Node/Windows Service (NSSM/PM2) tanpa menimpa
 * variabel lingkungan yang sudah ditetapkan oleh OS/Process Manager.
 * Prioritas (tertinggi ke terendah):
 *  process.env > .env.<mode>.local > .env.<mode> > .env.local > .env
 */
export function loadDeploymentEnv(rootDir = process.cwd()): LoadedEnvResult {
  const baseEnvPath = path.join(rootDir, '.env');
  const explicitMode =
    normalizeDeploymentMode(process.env.DEPLOYMENT_ENV) ||
    normalizeDeploymentMode(process.env.VITE_DEPLOYMENT_ENV);
  const dotEnvMode =
    normalizeDeploymentMode(peekEnvFileValue(baseEnvPath, 'DEPLOYMENT_ENV')) ||
    normalizeDeploymentMode(peekEnvFileValue(baseEnvPath, 'VITE_DEPLOYMENT_ENV'));
  const nodeEnvMode = normalizeDeploymentMode(process.env.NODE_ENV);

  const detectedMode: DeploymentEnvironment = explicitMode || dotEnvMode || nodeEnvMode || 'development';

  const candidateFiles =
    detectedMode === 'staging' || detectedMode === 'production'
      ? [`.env.${detectedMode}.local`, `.env.${detectedMode}`, '.env.local', '.env']
      : ['.env.local', '.env'];

  const loadedFiles: string[] = [];
  for (const fileName of candidateFiles) {
    const fullPath = path.join(rootDir, fileName);
    if (!fs.existsSync(fullPath)) continue;
    const result = dotenv.config({ path: fullPath, override: false });
    if (!result.error) {
      loadedFiles.push(fileName);
    }
  }

  const finalMode =
    normalizeDeploymentMode(process.env.DEPLOYMENT_ENV) ||
    normalizeDeploymentMode(process.env.VITE_DEPLOYMENT_ENV) ||
    detectedMode;

  return {
    deploymentEnv: finalMode,
    loadedFiles
  };
}

export function resolveDeploymentEnvironment(): {
  deploymentEnv: DeploymentEnvironment;
  isStaging: boolean;
  appUrl: string;
} {
  const deploymentEnv =
    normalizeDeploymentMode(process.env.DEPLOYMENT_ENV) ||
    normalizeDeploymentMode(process.env.VITE_DEPLOYMENT_ENV) ||
    normalizeDeploymentMode(process.env.NODE_ENV) ||
    'development';
  const appUrl = (
    process.env.APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    'http://localhost:3000'
  ).trim();
  return {
    deploymentEnv,
    isStaging: deploymentEnv === 'staging',
    appUrl
  };
}
