import { Team, HackathonStats, ActivityLog } from '../types';

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: 'AlphaDevs',
    repoUrl: 'https://github.com/alphadevs/ride-share-web3',
    avatar: '🚕',
    description: 'Decentralized ride-sharing network using smart contracts to match riders with drivers, bypass middleman fees, and verify rides securely on-chain.',
    techStack: ['React', 'Express', 'Solidity', 'Tailwind', 'Ethers.js', 'PostgreSQL'],
    members: ['Alex Rivera (Lead)', 'Sarah Chen (Contracts)', 'Marcus Johnson (Frontend)'],
    progress: 95,
    overallRiskScore: 12,
    commits: [
      {
        hash: 'f5d83a1',
        timestamp: '2026-07-04T09:15:00-07:00',
        author: 'Alex Rivera',
        message: 'Initial repository setup and express API structure',
        changedFiles: ['package.json', 'server.ts', '.env.example', 'tsconfig.json'],
        additions: 142,
        deletions: 0,
        aiSummary: 'Bootstrapped the backend skeleton. Initialized Express server with typescript config and environment setups. Clean, standard project initialization.',
        featureEvolution: 'Established foundational backend infrastructure and configuration.',
        category: 'backend',
        blockchainTx: '0x81fa92c730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef99823',
        blockchainStatus: 'verified',
        riskScore: 5,
        justificationStatus: 'none'
      },
      {
        hash: 'a2b3c4d',
        timestamp: '2026-07-04T11:30:00-07:00',
        author: 'Sarah Chen',
        message: 'Draft RideMatcher.sol Solidity contract for match logic',
        changedFiles: ['contracts/RideMatcher.sol', 'test/RideMatcher.test.js'],
        additions: 185,
        deletions: 0,
        aiSummary: 'Authored the initial core smart contract. Implements rider deposit escrow, basic coordinate distance calculations, and state variables for rides (Requested, Accepted, Completed).',
        featureEvolution: 'Introduced on-chain ride ride lifecycle state machine.',
        category: 'blockchain',
        blockchainTx: '0xe3a9f5d130e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef001a1',
        blockchainStatus: 'verified',
        riskScore: 8,
        justificationStatus: 'none'
      },
      {
        hash: 'c8d9e0f',
        timestamp: '2026-07-04T14:45:00-07:00',
        author: 'Marcus Johnson',
        message: 'Create mobile-friendly frontend layout and interactive map shell',
        changedFiles: ['src/components/MapContainer.tsx', 'src/App.tsx', 'src/index.css'],
        additions: 310,
        deletions: 12,
        aiSummary: 'Designed rider dashboard and integrated Mapbox container. Features elegant panels for setting destination, estimating price, and displaying available drivers.',
        featureEvolution: 'Created responsive frontend visual interface with layout templates.',
        category: 'frontend',
        blockchainTx: '0xca9d1a3c730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef7491d',
        blockchainStatus: 'verified',
        riskScore: 7,
        justificationStatus: 'none'
      },
      {
        hash: 'e4f5a6b',
        timestamp: '2026-07-04T18:20:00-07:00',
        author: 'Sarah Chen',
        message: 'Implement driver staking and rating triggers in contract',
        changedFiles: ['contracts/RideMatcher.sol', 'contracts/DriverRegistry.sol'],
        additions: 155,
        deletions: 22,
        aiSummary: 'Added custom staking mechanisms for drivers to join the pool. Secures payouts in contract escrow and prevents rating manipulation through signature validation.',
        featureEvolution: 'Enhanced smart contract security layer with driver collateral.',
        category: 'blockchain',
        blockchainTx: '0x992fa12e730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129efccda7',
        blockchainStatus: 'verified',
        riskScore: 10,
        justificationStatus: 'none'
      },
      {
        hash: 'b1c2d3e',
        timestamp: '2026-07-04T22:10:00-07:00',
        author: 'Alex Rivera',
        message: 'Setup PostgreSQL schema and connection pools',
        changedFiles: ['server/db/pool.ts', 'server/db/schema.sql', 'server/routes/api.ts'],
        additions: 98,
        deletions: 5,
        aiSummary: 'Implemented local database configurations for caching ride histories, off-chain driver metadata, and auth sessions. Added robust error retry fallback handlers.',
        featureEvolution: 'Configured relational persistent database storing off-chain session states.',
        category: 'database',
        blockchainTx: '0x4f88ba23a30e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129efa11b9',
        blockchainStatus: 'verified',
        riskScore: 6,
        justificationStatus: 'none'
      },
      {
        hash: '7a8b9c0',
        timestamp: '2026-07-05T01:30:00-07:00',
        author: 'Marcus Johnson',
        message: 'Integrate ethers.js and implement wallet connection component',
        changedFiles: ['src/components/WalletConnect.tsx', 'src/context/Web3Context.tsx', 'src/App.tsx'],
        additions: 240,
        deletions: 15,
        aiSummary: 'Integrated MetaMask/Web3 wallet login flow. Tracks chain-id, monitors balance, and handles disconnect events with smooth custom toast notifications.',
        featureEvolution: 'Connected UI layer directly to Web3 wallet infrastructure.',
        category: 'frontend',
        blockchainTx: '0x1cfa309730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef90a1e3',
        blockchainStatus: 'verified',
        riskScore: 11,
        justificationStatus: 'none'
      },
      {
        hash: '4d3e2f1',
        timestamp: '2026-07-05T04:15:00-07:00',
        author: 'Alex Rivera',
        message: 'Write Express backend endpoints linking React and Solidity',
        changedFiles: ['server/routes/ride.ts', 'server.ts'],
        additions: 190,
        deletions: 8,
        aiSummary: 'Wrote API proxy listeners that query smart contract event logs. Automatically updates database status cache, optimizing mobile UI loading times.',
        featureEvolution: 'Finished bridging middleware connecting Web3 smart contract events and off-chain caching.',
        category: 'backend',
        blockchainTx: '0x33221fa730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129effffeaa',
        blockchainStatus: 'verified',
        riskScore: 9,
        justificationStatus: 'none'
      },
      {
        hash: '0e9d8c7',
        timestamp: '2026-07-05T05:00:00-07:00',
        author: 'Marcus Johnson',
        message: 'Finalize matching dashboard & polishing CSS animations',
        changedFiles: ['src/components/RiderDashboard.tsx', 'src/index.css'],
        additions: 115,
        deletions: 4,
        aiSummary: 'Designed smooth micro-animations for searching driver loops. Fully polished layouts, hover effects, and responsive mobile controls.',
        featureEvolution: 'Enhanced user feedback loops and visual responsiveness.',
        category: 'frontend',
        blockchainTx: '0x55ee98a730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129efb72ca1',
        blockchainStatus: 'verified',
        riskScore: 5,
        justificationStatus: 'none'
      }
    ],
    claimedFeatures: [
      { id: 'c-1', claim: 'EVM Solidity smart contract matching algorithm', expectedEvidence: 'contracts/RideMatcher.sol containing deposit escrow and ride lifecycle', actualCodeReference: 'RideMatcher.sol: lines 34-110 matched with verification hash', status: 'verified' },
      { id: 'c-2', claim: 'Dynamic off-chain PostgreSQL database caching', expectedEvidence: 'Pool-based off-chain database caching server files', actualCodeReference: 'server/db/pool.ts configuring PG client and schema.sql for records', status: 'verified' },
      { id: 'c-3', claim: 'Decentralized driver staking collateral mechanism', expectedEvidence: 'Collateral lock constraints in smart contracts', actualCodeReference: 'DriverRegistry.sol: require(msg.value >= STAKE_AMOUNT, "Min stake required")', status: 'verified' }
    ],
    interviewQuestions: [
      { id: 'q-1', question: 'Why was the PostgreSQL off-chain cache introduced when ride requests are managed in RideMatcher.sol?', context: 'This was introduced in commit b1c2d3e to store metadata and improve page performance.', suggestedAnswer: 'Querying gas-heavy events continuously from blockchain nodes causes extreme latency in React mobile apps. PostgreSQL caches past coordinates and history, leaving only vital settlement on-chain.' },
      { id: 'q-2', question: 'How do you protect driver collateral from unfair penalty reports in DriverRegistry.sol?', context: 'Introduced staking in contract modifications in e4f5a6b.', suggestedAnswer: 'We introduced multi-sig arbitration where rating triggers must be supported by cryptographic signatures from both the passenger and the matched ride log hash.' }
    ]
  },
  {
    id: 'team-2',
    name: 'EcoSphere AI',
    repoUrl: 'https://github.com/ecosphere/carbon-tracker',
    avatar: '🌱',
    description: 'AI-powered tracking app utilizing camera image recognition to calculate real-time carbon offsets and logs carbon credits securely on a public chain.',
    techStack: ['React', 'Express', 'Gemini API', 'Tailwind', 'MongoDB', 'Ethers.js'],
    members: ['Dmitri Volkov (AI Engineer)', 'Anya Petrova (Fullstack)', 'Chloe Smith (Frontend)'],
    progress: 88,
    overallRiskScore: 35,
    commits: [
      {
        hash: 'b5a2e1d',
        timestamp: '2026-07-04T08:30:00-07:00',
        author: 'Anya Petrova',
        message: 'Initial project setup with express and tailwind',
        changedFiles: ['package.json', 'src/App.tsx', 'vite.config.ts'],
        additions: 95,
        deletions: 0,
        aiSummary: 'Configured standard React app with Vite and Tailwind v4. Clean startup setup.',
        featureEvolution: 'Initial system skeleton.',
        category: 'frontend',
        blockchainTx: '0x992fa12e730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129efa1111',
        blockchainStatus: 'verified',
        riskScore: 4,
        justificationStatus: 'none'
      },
      {
        hash: 'ca91e23',
        timestamp: '2026-07-04T12:00:00-07:00',
        author: 'Dmitri Volkov',
        message: 'Setup server routes and Gemini API connection for photo analysis',
        changedFiles: ['server/routes/vision.ts', 'server.ts', '.env.example'],
        additions: 120,
        deletions: 2,
        aiSummary: 'Implemented Express server bridging to Gemini API (using @google/genai SDK) to process captured images of household objects or grocery labels and determine estimated CO2 offsets.',
        featureEvolution: 'Added Gemini Vision integrations for classification.',
        category: 'ai',
        blockchainTx: '0x3ca9a23e730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef982aa3',
        blockchainStatus: 'verified',
        riskScore: 12,
        justificationStatus: 'none'
      },
      {
        hash: '9f8e7d6',
        timestamp: '2026-07-04T17:40:00-07:00',
        author: 'Dmitri Volkov',
        message: 'ADD PRE-TRAINED TENSORFLOW.JS COEFFICIENTS FOR LOCAL ANALYSIS',
        changedFiles: ['public/models/carbon_weights.bin', 'src/utils/localClassifier.ts'],
        additions: 15400,
        deletions: 0,
        aiSummary: 'Flagged: Massive code/binary upload. Committed 15.4k lines containing serialized pre-trained weight coordinates for a local edge classification module.',
        featureEvolution: 'Added off-line edge client fallback model weight database.',
        category: 'ai',
        blockchainTx: '0xfa39ca9a730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129efcca881',
        blockchainStatus: 'verified',
        isSuspicious: true,
        suspiciousReason: 'Massive code upload / serialized binary files (>15k additions)',
        riskScore: 68,
        justification: 'The 15k additions represent the compiled offline backup model weights in serialized JSON and binary blocks. They were generated locally on my machine via training script prior to the hackathon and uploaded so the client can perform fast local frame evaluations without constantly hitting the Gemini API endpoint.',
        justificationStatus: 'accepted'
      },
      {
        hash: 'b2d8e4f',
        timestamp: '2026-07-05T00:15:00-07:00',
        author: 'Chloe Smith',
        message: 'Implement user carbon budget dashboard with visual charts',
        changedFiles: ['src/components/BudgetCharts.tsx', 'src/components/CaptureModule.tsx'],
        additions: 210,
        deletions: 14,
        aiSummary: 'Created a nice SVG progress ring and grid visualizing a user\'s daily footprint vs their goals.',
        featureEvolution: 'Completed user budget dashboard analytics.',
        category: 'frontend',
        blockchainTx: '0x717ffda730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef9a3cdbb2',
        blockchainStatus: 'verified',
        riskScore: 10,
        justificationStatus: 'none'
      }
    ],
    claimedFeatures: [
      { id: 'ec-1', claim: 'Gemini AI Vision food and recycling classification', expectedEvidence: 'Integration of Gemini image analysis', actualCodeReference: 'server/routes/vision.ts using @google/genai SDK', status: 'verified' },
      { id: 'ec-2', claim: 'Local client-side TensorFlow weight fallback', expectedEvidence: 'TensorFlow.js weights and file loader', actualCodeReference: 'public/models/carbon_weights.bin verified during commit 9f8e7d6', status: 'verified' },
      { id: 'ec-3', claim: 'Solidity on-chain carbon offset minting', expectedEvidence: 'Blockchain contract deployment and triggers', actualCodeReference: 'No solidity contracts found in repository. Offsets are only saved locally in MongoDB.', status: 'unverified' }
    ],
    interviewQuestions: [
      { id: 'eq-1', question: 'How are you implementing the Solidity offset minter listed in your presentation claims?', context: 'We scanned all commits but found only MongoDB connection strings.', suggestedAnswer: 'We had to cut the Solidity smart contract from our MVP in the last hour because of RPC testnet connection failures. It is simulated on MongoDB for now.' },
      { id: 'eq-2', question: 'What is the role of the 15,400 line weights binary file uploaded in commit 9f8e7d6?', context: 'Highly flagged commit for massive additions.', suggestedAnswer: 'It contains the custom neural net layer weights for offline image analysis directly inside the browser.' }
    ]
  },
  {
    id: 'team-3',
    name: 'HealthLoop',
    repoUrl: 'https://github.com/healthloop/emergency-tracker',
    avatar: '❤️',
    description: 'A wearable fitness tracking portal linking simulated IoT sensors with real-time panic alerts and dispatch logs.',
    techStack: ['React', 'Express', 'Tailwind', 'Firebase', 'Twilio'],
    members: ['James Zhao (Lead Dev)', 'Maria Gomez (Designer)'],
    progress: 70,
    overallRiskScore: 82,
    commits: [
      {
        hash: 'b1a9988',
        timestamp: '2026-07-04T10:00:00-07:00',
        author: 'James Zhao',
        message: 'Initial project setup with simple landing text',
        changedFiles: ['package.json', 'src/App.tsx'],
        additions: 30,
        deletions: 0,
        aiSummary: 'Basic bootstrap file containing a single component stating: "Welcome to HealthLoop".',
        featureEvolution: 'Initial repository start.',
        category: 'frontend',
        blockchainTx: '0x1cfa309730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef90a1ff',
        blockchainStatus: 'verified',
        riskScore: 5,
        justificationStatus: 'none'
      },
      {
        hash: 'force-push-99',
        timestamp: '2026-07-04T18:30:00-07:00',
        author: 'James Zhao',
        message: 'FORCE PUSH: Override origin main',
        changedFiles: ['src/App.tsx'],
        additions: 5,
        deletions: 25,
        aiSummary: 'CRITICAL ALERT: Git history force push detected. The author deleted previous history, rewriting master branch.',
        featureEvolution: 'Rewrote remote branch state.',
        category: 'other',
        blockchainTx: '0x889898ff730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129efccaabc3',
        blockchainStatus: 'failed',
        isSuspicious: true,
        suspiciousReason: 'Force push / git history overwrite detected. Local commit hashes did not match blockchain audit log.',
        riskScore: 95,
        justification: 'Accidentally committed an active Google Maps API key inside the repository config. I had to purge the history to prevent API key abuse.',
        justificationStatus: 'accepted'
      },
      {
        hash: 'd3f5e92',
        timestamp: '2026-07-05T03:00:00-07:00',
        author: 'James Zhao',
        message: 'Add wearable tracking database, fully styled portal with alerts',
        changedFiles: ['src/components/Dashboard.tsx', 'src/components/Tracker.tsx', 'server/index.js', 'src/data/heartRates.json', 'src/App.tsx'],
        additions: 9850,
        deletions: 5,
        aiSummary: 'CRITICAL ALERT: Huge commit after 16 hours of absolute inactivity. Contained fully styled dashboard, complex data sets, sensor simulators, and finished CSS packages.',
        featureEvolution: 'Massive feature drops in a single block.',
        category: 'frontend',
        blockchainTx: '0x8a9da9a730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129efcca9001b',
        blockchainStatus: 'verified',
        isSuspicious: true,
        suspiciousReason: 'Long period of developer inactivity (16.5 hours) followed by massive codebase commit (>9k additions)',
        riskScore: 89,
        justificationStatus: 'pending'
      }
    ],
    claimedFeatures: [
      { id: 'hc-1', claim: 'Real-time wearable sensor feed parsing', expectedEvidence: 'Active connection to IoT simulators or sensor APIs', actualCodeReference: 'src/data/heartRates.json is static mock data. No real socket listeners found.', status: 'partially' },
      { id: 'hc-2', claim: 'Twilio SOS dispatch SMS automation', expectedEvidence: 'Backend server calling Twilio API with verified auth configurations', actualCodeReference: 'Twilio mock functions returning { status: "simulated_sms_sent" }. No active Twilio client initialized.', status: 'unverified' }
    ],
    interviewQuestions: [
      { id: 'hq-1', question: 'Why was there a 16-hour development silence followed by a 9,850 line drop in commit d3f5e92?', context: 'Suspicious pattern indicative of copying pre-existing code.', suggestedAnswer: 'I did most of the layout, styling, and simulator coding on my local hard drive while traveling in a plane without internet access. I committed it all at once when I reconnected.' },
      { id: 'hq-2', question: 'Why did you force push to origin in commit force-push-99?', context: 'This triggers a critical failed blockchain hash check.', suggestedAnswer: 'I accidentally committed our real Twilio credentials and secrets. I had to force push immediately to protect our account and security.' }
    ]
  },
  {
    id: 'team-4',
    name: 'BlocksSync',
    repoUrl: 'https://github.com/blockssync/portfolio',
    avatar: '🔗',
    description: 'An asset management index dashboard aggregating multi-chain investments, liquidity pool trackers, and yielding suggestions.',
    techStack: ['React', 'Tailwind', 'Ethers.js', 'Chart.js', 'Web3Modal'],
    members: ['Liam Murphy (Web3)', 'Nisha Patel (Frontend)'],
    progress: 82,
    overallRiskScore: 48,
    commits: [
      {
        hash: 'c1b2a3d',
        timestamp: '2026-07-04T09:00:00-07:00',
        author: 'Liam Murphy',
        message: 'Initial workspace setups',
        changedFiles: ['package.json', 'src/App.tsx'],
        additions: 55,
        deletions: 0,
        aiSummary: 'Created initial layout setup with standard configuration files.',
        featureEvolution: 'Initial file scaffolding.',
        category: 'frontend',
        blockchainTx: '0x1122a7f730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef9392812',
        blockchainStatus: 'verified',
        riskScore: 3,
        justificationStatus: 'none'
      },
      {
        hash: 'b2c9e83',
        timestamp: '2026-07-04T13:10:00-07:00',
        author: 'Nisha Patel',
        message: 'Integrate Web3 connection models',
        changedFiles: ['src/components/ConnectWallet.tsx', 'src/utils/web3-provider.js'],
        additions: 4320,
        deletions: 12,
        aiSummary: 'WARNING: Potential code clone detected. Contains 4,300 additions that closely match 98% of a public web3-react boiler template including standard layout defaults, license plates, and generic code paths.',
        featureEvolution: 'Integrated pre-built Web3 provider setups.',
        category: 'blockchain',
        blockchainTx: '0x88fca9a730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129efcc1a89c',
        blockchainStatus: 'verified',
        isSuspicious: true,
        suspiciousReason: 'High code similarity matching (98% match with public web3-react-boiler repository)',
        riskScore: 55,
        justification: 'Yes, we imported a standard open-source React Web3 provider boilerplate template to save time initializing the wallet modal UI and provider setups, so we could focus strictly on custom balance calculations during the hackathon limit.',
        justificationStatus: 'accepted'
      },
      {
        hash: '9a8d7c6',
        timestamp: '2026-07-04T20:30:00-07:00',
        author: 'Liam Murphy',
        message: 'Add custom balance hooks and smart contracts interface',
        changedFiles: ['src/hooks/useBalances.ts', 'src/components/Dashboard.tsx'],
        additions: 290,
        deletions: 15,
        aiSummary: 'Implemented custom hooks calling Web3 endpoints. Safely handles balance lookups, formats balances correctly, and displays them on a portfolio page.',
        featureEvolution: 'Finished dashboard balances feed.',
        category: 'blockchain',
        blockchainTx: '0x33b9ca9a730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129efcca002c',
        blockchainStatus: 'verified',
        riskScore: 12,
        justificationStatus: 'none'
      }
    ],
    claimedFeatures: [
      { id: 'bc-1', claim: 'Multi-chain balance aggregation', expectedEvidence: 'Code querying multiple RPC nodes (EVM + non-EVM)', actualCodeReference: 'useBalances.ts only queries Goerli Ethereum testnet endpoints.', status: 'partially' },
      { id: 'bc-2', claim: 'Pre-audited smart contract router', expectedEvidence: 'Solidity files or verified contract deployment transaction logs', actualCodeReference: 'No custom contract scripts. Only utilizes existing PancakeSwap router addresses.', status: 'verified' }
    ],
    interviewQuestions: [
      { id: 'bq-1', question: 'Why does your repository import a 4,300 line web3-provider script that shows a 98% match to public templates?', context: 'Flagged boilerplate in commit b2c9e83.', suggestedAnswer: 'We utilized the official public web3-react setup boilerplate to prevent bugs with WalletConnect v2 integrations, which are famously time-consuming to configure manually.' },
      { id: 'bq-2', question: 'How are multi-chain balances fetched when the hook only points to the Goerli Ethereum network?', context: 'Feature scan verified claim partially.', suggestedAnswer: 'We planned to expand to Polygon and Arbitrum, but our main multi-chain hooks require premium RPC credentials. We limited our demo to Ethereum Goerli.' }
    ]
  },
  {
    id: 'team-5',
    name: 'SmartContractors',
    repoUrl: 'https://github.com/smart-contractors/audit-ai',
    avatar: '🤖',
    description: 'AI auditing engine using neural nets to detect reentrancy and integer overflows in solidity smart contracts instantly, outputting visual vulnerability logs.',
    techStack: ['React', 'Express', 'Gemini API', 'Tailwind', 'Solidity', 'Docker'],
    members: ['Alice Thorne (Security)', 'Bob Miller (Frontend)', 'Charlie Green (Backend)'],
    progress: 100,
    overallRiskScore: 8,
    commits: [
      {
        hash: 'b1a2001',
        timestamp: '2026-07-04T08:00:00-07:00',
        author: 'Bob Miller',
        message: 'Initial repo setup, tailwind integration',
        changedFiles: ['package.json', 'src/App.tsx', 'tailwind.config.js'],
        additions: 120,
        deletions: 0,
        aiSummary: 'Standard skeleton file configuration.',
        featureEvolution: 'Initial layout setups.',
        category: 'frontend',
        blockchainTx: '0xaa1fa7f730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef999bbd',
        blockchainStatus: 'verified',
        riskScore: 3,
        justificationStatus: 'none'
      },
      {
        hash: 'c3d4a01',
        timestamp: '2026-07-04T11:00:00-07:00',
        author: 'Alice Thorne',
        message: 'Add buggy Smart Contracts suite for auditor validation tests',
        changedFiles: ['contracts/VulnerableWallet.sol', 'contracts/SimpleBank.sol'],
        additions: 210,
        deletions: 5,
        aiSummary: 'Configured sample target contracts with deliberate bugs (Reentrancy, Integer Overflow, Unchecked Send) for AI validation benchmarks.',
        featureEvolution: 'Added smart contract sandbox targets.',
        category: 'blockchain',
        blockchainTx: '0xbb2fa7f730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef999bbe',
        blockchainStatus: 'verified',
        riskScore: 7,
        justificationStatus: 'none'
      },
      {
        hash: 'e5f6b21',
        timestamp: '2026-07-04T15:30:00-07:00',
        author: 'Charlie Green',
        message: 'Create Express auditor proxy invoking Gemini API and AST parsing',
        changedFiles: ['server/auditor.ts', 'server.ts'],
        additions: 340,
        deletions: 12,
        aiSummary: 'Implemented backend parser that strips solidity files into Abstract Syntax Trees (AST). Feeds AST segments and raw code to Gemini model along with custom security templates.',
        featureEvolution: 'Completed AI-driven Solidity code parsing middleware.',
        category: 'ai',
        blockchainTx: '0xcc3fa7f730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef999bbf',
        blockchainStatus: 'verified',
        riskScore: 9,
        justificationStatus: 'none'
      },
      {
        hash: '7a8d009',
        timestamp: '2026-07-04T19:45:00-07:00',
        author: 'Bob Miller',
        message: 'Build Interactive Auditing UI layout',
        changedFiles: ['src/components/AuditPanel.tsx', 'src/components/VulnReport.tsx'],
        additions: 430,
        deletions: 8,
        aiSummary: 'Created panels to paste Solidity files, displaying reentrancy visual alerts with interactive highlights directly mapping to lines.',
        featureEvolution: 'Finished security frontend panels.',
        category: 'frontend',
        blockchainTx: '0xdd4fa7f730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef999bc0',
        blockchainStatus: 'verified',
        riskScore: 6,
        justificationStatus: 'none'
      },
      {
        hash: '2f3e4d5',
        timestamp: '2026-07-05T02:00:00-07:00',
        author: 'Alice Thorne',
        message: 'Refine Gemini rules prompting matrix for reentrancy accuracy',
        changedFiles: ['server/prompts/auditorPrompt.ts', 'server/auditor.ts'],
        additions: 110,
        deletions: 4,
        aiSummary: 'Refined AI instruction parameters. Instructs model to map vulnerabilities to precise column/line index blocks to prevent false alerts.',
        featureEvolution: 'Calibrated AI security detection model precision.',
        category: 'ai',
        blockchainTx: '0xee5fa7f730e21a22be72dfb7e80276d47b0a70f3f7de1b869d82cb129ef999bc1',
        blockchainStatus: 'verified',
        riskScore: 8,
        justificationStatus: 'none'
      }
    ],
    claimedFeatures: [
      { id: 'sc-1', claim: 'Solidity abstract syntax tree (AST) pre-parsing', expectedEvidence: 'Code processing Solidity file AST blocks before prompting AI', actualCodeReference: 'server/auditor.ts imports parser library and iterates over nodes', status: 'verified' },
      { id: 'sc-2', claim: 'Gemini reentrancy prompt vulnerability matrices', expectedEvidence: 'Custom advanced prompts for reentrancy audits', actualCodeReference: 'server/prompts/auditorPrompt.ts containing security rules matrix', status: 'verified' }
    ],
    interviewQuestions: [
      { id: 'sq-1', question: 'How does the Solidity AST pre-parsing step enhance the Gemini AI analysis accuracy?', context: 'Created in commit e5f6b21.', suggestedAnswer: 'Raw solidity source files can contain large irrelevant blocks of code, wasting token limits. AST pre-parsing isolates specific execution contexts (e.g. state modifications occurring after low-level external calls) to focus the prompt strictly on risky areas.' },
      { id: 'sq-2', question: 'How do you handle false positives where Gemini flags a standard transfer as reentrant?', context: 'Addressed in prompt modifications in 2f3e4d5.', suggestedAnswer: 'We calibrated the instructions inside auditorPrompt.ts with negative templates (e.g. CEI pattern examples where state is modified first) to guarantee the model validates state conditions before issuing warnings.' }
    ]
  }
];

export const MOCK_STATS: HackathonStats = {
  totalTeams: 5,
  totalCommits: 23,
  averageCommits: 4.6,
  activeAlerts: 4
};

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-07-04T08:15:00-07:00',
    type: 'success',
    message: 'GitHub webhook connected: Team AlphaDevs registered repository.',
    teamName: 'AlphaDevs'
  },
  {
    id: 'log-2',
    timestamp: '2026-07-04T09:15:00-07:00',
    type: 'info',
    message: 'AI analyzed commit f5d83a1: Bootstrapped express server skeletons.',
    teamName: 'AlphaDevs',
    refId: 'f5d83a1'
  },
  {
    id: 'log-3',
    timestamp: '2026-07-04T13:10:00-07:00',
    type: 'warning',
    message: 'AI Warning: Potential code clone (98% match) in commit b2c9e83.',
    teamName: 'BlocksSync',
    refId: 'b2c9e83'
  },
  {
    id: 'log-4',
    timestamp: '2026-07-04T17:40:00-07:00',
    type: 'warning',
    message: 'AI Warning: Massive weight database upload (15.4k lines) in commit 9f8e7d6.',
    teamName: 'EcoSphere AI',
    refId: '9f8e7d6'
  },
  {
    id: 'log-5',
    timestamp: '2026-07-04T18:30:00-07:00',
    type: 'danger',
    message: 'CRITICAL ALERT: Blockchain hash mismatch! Force push detected on main branch.',
    teamName: 'HealthLoop',
    refId: 'force-push-99'
  },
  {
    id: 'log-6',
    timestamp: '2026-07-05T03:00:00-07:00',
    type: 'danger',
    message: 'CRITICAL ALERT: 16h inactivity followed by massive 9.8k line commit d3f5e92.',
    teamName: 'HealthLoop',
    refId: 'd3f5e92'
  },
  {
    id: 'log-7',
    timestamp: '2026-07-05T04:30:00-07:00',
    type: 'info',
    message: 'Audit record published on block 8,142,042 for commit 4d3e2f1.',
    teamName: 'AlphaDevs',
    refId: '4d3e2f1'
  }
];
