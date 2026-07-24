const BASE = 'http://localhost:3000';

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function registerOrLogin(email, name, password, role) {
  try {
    const result = await req('POST', '/api/auth/register', { email, name, password, role });
    console.log(`  Registered: ${email}`);
    return result.data.token;
  } catch (err) {
    if (err.status === 409) {
      const result = await req('POST', '/api/auth/login', { email, password });
      console.log(`  Logged in (already registered): ${email}`);
      return result.data.token;
    }
    throw err;
  }
}

async function main() {
  console.log('Pushing demo data to', BASE, '\n');

  // 1. Organizer
  console.log('--- Organizer ---');
  const orgToken = await registerOrLogin(
    'shourya@demo.com', 'Shourya Sharma', 'Demo@1234', 'organizer'
  );

  // 2. Judge
  console.log('--- Judge ---');
  await registerOrLogin(
    'tejal@demo.com', 'Tejal Patel', 'Demo@1234', 'judge'
  );

  // 3. Teams
  const teams = [
    {
      name: 'BlogCraft',
      repoUrl: 'https://github.com/udbhavshrivastava3-cyber/PROJECT-2-BLOG-WEBSITE',
      techStack: ['HTML', 'CSS', 'JavaScript', 'Node.js'],
      members: ['Udbhav Shrivastava'],
      description: 'Dynamic personal and community blog platform with responsive layout and content management.',
      email: 'udbhav@demo.com',
      password: 'Demo@1234',
    },
    {
      name: 'HackProof AI',
      repoUrl: 'https://github.com/dev47929/Hackathon-monitoring-environment-protocol-gwl-alt',
      techStack: ['TypeScript', 'React', 'Tailwind CSS', 'Node.js', 'Prisma'],
      members: ['Dev Joshi'],
      description: 'Continuous hackathon developer monitoring, AI code auditor, and blockchain commit integrity anchoring.',
      email: 'dev@demo.com',
      password: 'Demo@1234',
    },
    {
      name: 'JobTrack AI',
      repoUrl: 'https://github.com/dev47929/job-tracker',
      techStack: ['TypeScript', 'React', 'Node.js', 'Express'],
      members: ['Arjun Nair'],
      description: 'Smart job application tracking dashboard with status automation, interview prep, and analytics.',
      email: 'arjun@demo.com',
      password: 'Demo@1234',
    },
  ];

  for (const t of teams) {
    console.log(`--- Team: ${t.name} ---`);
    try {
      const result = await req('POST', '/api/teams', t, orgToken);
      console.log(`  Created (id: ${result.data.id}, commits: ${result.data.commitsCount})`);
    } catch (err) {
      if (err.status === 400 && err.data?.details?.teamId) {
        console.log(`  Already exists (duplicate repoUrl), teamId: ${err.data.details.teamId}`);
      } else {
        throw err;
      }
    }
  }

  console.log('\nAll demo data pushed successfully!');
}

main().catch((err) => {
  console.error('\nScript failed:', err.message);
  process.exit(1);
});
