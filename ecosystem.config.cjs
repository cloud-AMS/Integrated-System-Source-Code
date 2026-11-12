/**
 * @file ecosystem.config.cjs
 * @description PM2 Process Manager Configuration untuk AMS Integrated System (Produksi VPS)
 */

module.exports = {
  apps: [
    {
      name: 'ams-integrated-system',
      script: 'server.js',
      instances: 2, // Mode kluster memanfaatkan 2-4 vCPU
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true
    }
  ]
};
