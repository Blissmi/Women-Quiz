module.exports = {
  apps: [
    {
      name: 'quiz-app',
      script: 'npm',
      args: 'run server',
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
