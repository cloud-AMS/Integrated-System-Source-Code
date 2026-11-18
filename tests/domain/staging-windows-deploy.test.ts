import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDeploymentEnv, resolveDeploymentEnvironment } from '../../server/envLoader';
import { buildWindowsDeploymentGuides } from '../../server/deploymentGuides';
import { ServerRbacStore } from '../../server/rbacStore';

const TRACKED_KEYS = [
  'DEPLOYMENT_ENV',
  'VITE_DEPLOYMENT_ENV',
  'VITE_FIREBASE_PROJECT_ID',
  'AMS_DATA_DIR',
  'APP_URL',
  'FIREBASE_ADMIN_EMAILS',
  'BOOTSTRAP_DEV_EMAIL'
] as const;

describe('Staging Firebase & Deployment Windows Server VPS', () => {
  const prevValues: Partial<Record<(typeof TRACKED_KEYS)[number], string | undefined>> = {};
  for (const key of TRACKED_KEYS) {
    prevValues[key] = process.env[key];
  }

  const tempDirs: string[] = [];

  afterEach(() => {
    for (const key of TRACKED_KEYS) {
      const prev = prevValues[key];
      if (prev === undefined) delete process.env[key];
      else process.env[key] = prev;
    }
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir && fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('memuat .env.staging saat DEPLOYMENT_ENV=staging tanpa menimpa process.env yang sudah ditetapkan NSSM/OS', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-win-env-'));
    tempDirs.push(dir);

    fs.writeFileSync(
      path.join(dir, '.env'),
      'DEPLOYMENT_ENV=staging\nVITE_FIREBASE_PROJECT_ID=from-dot-env\nAMS_DATA_DIR=C:\\AMS\\Fallback\n',
      'utf8'
    );
    fs.writeFileSync(
      path.join(dir, '.env.staging'),
      'VITE_DEPLOYMENT_ENV=staging\nVITE_FIREBASE_PROJECT_ID=staging-firebase-project\nAMS_DATA_DIR=C:\\AMS\\Data\n',
      'utf8'
    );

    delete process.env.DEPLOYMENT_ENV;
    delete process.env.VITE_DEPLOYMENT_ENV;
    delete process.env.VITE_FIREBASE_PROJECT_ID;
    process.env.AMS_DATA_DIR = 'D:\\CustomVolume\\AMSData';

    const loaded = loadDeploymentEnv(dir);
    expect(loaded.deploymentEnv).toBe('staging');
    expect(loaded.loadedFiles).toEqual(['.env.staging', '.env']);
    expect(process.env.VITE_FIREBASE_PROJECT_ID).toBe('staging-firebase-project');
    expect(process.env.AMS_DATA_DIR).toBe('D:\\CustomVolume\\AMSData');

    const resolved = resolveDeploymentEnvironment();
    expect(resolved.isStaging).toBe(true);
    expect(resolved.deploymentEnv).toBe('staging');
  });

  it('menghasilkan konfigurasi Caddyfile, NSSM, PowerShell, dan .env.staging Windows yang siap pakai', () => {
    const guides = buildWindowsDeploymentGuides({
      domain: 'staging.ams-med.co.id',
      deploymentEnv: 'staging',
      activeDriver: 'firebase',
      firebaseProjectId: 'ams-staging-demo'
    });

    expect(guides.isStaging).toBe(true);
    expect(guides.caddyfile).toContain('staging.ams-med.co.id');
    expect(guides.caddyfile).toContain('reverse_proxy 127.0.0.1:3000');
    expect(guides.nssmCommands.join('\n')).toContain('npm run build:staging');
    expect(guides.nssmCommands.join('\n')).toContain('AMS_DATA_DIR=C:\\AMS\\Data');
    expect(guides.nssmCommands.join('\n')).toContain('DEPLOYMENT_ENV=staging');
    expect(guides.envStagingTemplate).toContain('APP_URL=https://staging.ams-med.co.id');
    expect(guides.envStagingTemplate).toContain('VITE_DEPLOYMENT_ENV=staging');
    expect(guides.powershellQuickDeploy.join('\n')).toContain('.\\deploy.ps1');
    expect(fs.existsSync(path.join(process.cwd(), 'deploy.ps1'))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), 'scripts', 'deploy-windows-vps.ps1'))).toBe(false);
    const deployScript = fs.readFileSync(path.join(process.cwd(), 'deploy.ps1'), 'utf8');
    expect(deployScript).toContain('"pull"');
    expect(deployScript).toContain('"--ff-only"');
    expect(deployScript).toContain('"build:staging"');
    expect(deployScript).toContain(':(exclude)public/website-published.json');
    expect(deployScript).toContain('[Environment]::SetEnvironmentVariable($clientConfigKey, $envMap[$clientConfigKey], "Process")');
    expect(deployScript).toContain('Invoke-CheckedCommand "npm" @("ci", "--include=dev")');
    const stopServiceIndex = deployScript.indexOf('Stop-Service -Name $svcName -Force');
    const npmCiIndex = deployScript.indexOf('Invoke-CheckedCommand "npm" @("ci", "--include=dev")');
    expect(stopServiceIndex).toBeGreaterThanOrEqual(0);
    expect(stopServiceIndex).toBeLessThan(npmCiIndex);
  });

  it('mengizinkan admin Firebase staging (cloud.ams2026@gmail.com) login tanpa menimpa email developer utama', () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ams-win-rbac-'));
    tempDirs.push(dataDir);

    const rbac = new ServerRbacStore(dataDir);
    const devLogin = rbac.authenticateByVerifiedEmail(
      'antraderyll@gmail.com',
      'uid-dev-1',
      'Developer Utama',
      '127.0.0.1',
      'Vitest'
    );
    expect(devLogin.ok).toBe(true);

    const stagingLogin = rbac.authenticateByVerifiedEmail(
      'cloud.ams2026@gmail.com',
      'uid-staging-owner',
      'Owner Staging Cloud',
      '127.0.0.1',
      'Vitest'
    );
    expect(stagingLogin.ok).toBe(true);
    if (!stagingLogin.ok) return;

    expect(stagingLogin.user.email).toBe('cloud.ams2026@gmail.com');
    expect(stagingLogin.role.id).toBe('developer_it_support');

    const allUsers = rbac.listAllUsersForCloudSync();
    expect(allUsers.some((u) => u.email === 'antraderyll@gmail.com')).toBe(true);
    expect(allUsers.some((u) => u.email === 'cloud.ams2026@gmail.com')).toBe(true);
  });
});
