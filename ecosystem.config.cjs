/**
 * @file ecosystem.config.cjs
 * @description PM2 Process Manager Configuration untuk AMS Integrated System (Produksi VPS)
 */

module.exports = {
  apps: [
    {
      name: 'ams-integrated-system',
      script: 'server.js',
      // Wajib 1 instance (fork) karena hub WebSocket (/api/sync/ws), sesi memori, dan store JSON
      // (rbac-db.json & app-state.json) tidak berbagi state lintas proses cluster.
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        APP_URL: process.env.APP_URL,
        AMS_DB_DRIVER: 'firebase',
        AMS_DATA_DIR: '/var/lib/ams-data'
      },
      env_staging: {
        NODE_ENV: 'production',
        PORT: 3000,
        APP_URL: process.env.APP_URL,
        DEPLOYMENT_ENV: 'staging',
        VITE_DEPLOYMENT_ENV: 'staging',
        AMS_DB_DRIVER: 'firebase',
        AMS_DATA_DIR: process.env.AMS_DATA_DIR || '/var/lib/ams-data'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
