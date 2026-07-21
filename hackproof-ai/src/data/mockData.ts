import type { Team, HackathonStats, ActivityLog } from '../types';
import seedData from '../../../shared/seed-data.json';

export const INITIAL_TEAMS = seedData.teams as Team[];
export const MOCK_STATS: HackathonStats = seedData.stats as HackathonStats;
export const INITIAL_ACTIVITY_LOGS = seedData.activityLogs as ActivityLog[];
