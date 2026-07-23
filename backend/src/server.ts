import { config } from './config/index.js'
import app from './app.js'
import prisma from './data/prisma.js'
import { seedIfEmpty } from './data/seed.js'

async function main(): Promise<void> {
  await prisma.$connect()
  console.log('[db] Connected to database.')

  // Clean all existing data to start fresh
  try {
    await prisma.transaction.deleteMany()
    await prisma.block.deleteMany()
    await prisma.commit.deleteMany()
    await prisma.team.deleteMany()
    await prisma.activityLog.deleteMany()
    console.log('[db] All demo team data removed from database.')
  } catch (err) {
    console.error('Failed to clear database:', err)
  }

  await seedIfEmpty()

  const server = app.listen(config.server.port, () => {
    console.log('─────────────────────────────────────────────────────────────────')
    console.log(`  HackProof AI Backend listening on http://localhost:${config.server.port}`)
    console.log(`  Environment: ${config.server.nodeEnv}`)
    console.log(`  Groq configured:    ${config.groq.apiKey ? 'yes' : 'no (heuristic fallback active)'}`)
    console.log(`  GitHub configured:  ${config.github.personalAccessToken ? 'yes' : 'no'}`)
    console.log(`  Blockchain mode:   ${config.blockchain.blockchainMode} (enabled: ${config.blockchain.enabled})`)
    console.log('─────────────────────────────────────────────────────────────────')
  })

  function shutdown(signal: string): void {
    console.log(`\n[${signal}] received. Shutting down gracefully...`)
    server.close(async (err) => {
      if (err) {
        console.error('Error during shutdown:', err)
        await prisma.$disconnect()
        process.exit(1)
      }
      await prisma.$disconnect()
      console.log('Server closed. Bye.')
      process.exit(0)
    })
    setTimeout(() => {
      console.warn('Forcing shutdown after timeout.')
      process.exit(1)
    }, 8000)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason)
  })
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err)
    shutdown('uncaughtException')
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export default app
