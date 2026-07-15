import { config } from './config/index.js';
import app from './app.js';

const server = app.listen(config.server.port, () => {
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`  HackProof AI Backend listening on http://localhost:${config.server.port}`);
  console.log(`  Environment: ${config.server.nodeEnv}`);
  console.log(`  Gemini configured:  ${config.gemini.apiKey ? 'yes' : 'no (heuristic fallback active)'}`);
  console.log(`  GitHub configured:  ${config.github.personalAccessToken ? 'yes' : 'no'}`);
  console.log(`  Blockchain enabled: ${config.blockchain.enabled ? 'yes' : 'no'}`);
  console.log('─────────────────────────────────────────────────────────────────');
});

function shutdown(signal: string): void {
  console.log(`\n[${signal}] received. Shutting down gracefully...`);
  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
    console.log('Server closed. Bye.');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('Forcing shutdown after timeout.');
    process.exit(1);
  }, 8000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown('uncaughtException');
});

export default server;
