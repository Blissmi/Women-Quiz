module.exports = {
  apps: [
    {
      name: 'quiz-app',
      script: 'npm',
      args: 'run start',
      // Load environment variables from .env.local when starting via PM2
      env_file: '.env.local',
      cwd: __dirname,
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 4000
      }
    }
  ]
}
