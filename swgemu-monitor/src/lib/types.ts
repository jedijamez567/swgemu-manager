export interface StatsResponse {
  metadata: {
    asOfTime: string;
  };
  result: {
    state: {
      elapsedMs: number;
      lastResetTime: string;
      lastResetTimeMs: number;
    };
    ai: AiStats;
    core: CoreStats;
    players: PlayerStats;
    missionStats: MissionStats;
  };
}

export interface AiStats {
  activeMoveEvents: number;
  activeRecoveryEvents: number;
  countExceptions: number;
  moveEventsRetreating: number;
  moveEventsWithFollowObject: number;
  scheduledMoveEvents: number;
  countAiAgentsTotal: number;
  [key: string]: number; // countAiAgents{Zone} dynamic keys
}

export interface CoreStats {
  pid: number;
  coreStartTime: string;
  coreStartTimeMs: number;
  coreInitializedTime: string;
  coreInitializedTimeMs: number;
  coreLoadMs: number;
}

export interface PlayerStats {
  accountsCount: number;
  accountsMax: number;
  accountsMaxWhen: string;
  accountsMaxWhenMs: number;
  distinctIPsCount: number;
  distinctIPsMax: number;
  distinctIPsMaxWhen: string;
  distinctIPsMaxWhenMs: number;
  onlineCount: number;
  onlineMax: number;
  onlineMaxWhen: string;
  onlineMaxWhenMs: number;
}

export interface MissionStats {
  creditsGeneratedFromMissionsBounty: number;
  creditsGeneratedFromMissionsCrafting: number;
  creditsGeneratedFromMissionsDancer: number;
  creditsGeneratedFromMissionsDeliver: number;
  creditsGeneratedFromMissionsDestroy: number;
  creditsGeneratedFromMissionsHunting: number;
  creditsGeneratedFromMissionsMusician: number;
  creditsGeneratedFromMissionsRecon: number;
  creditsGeneratedFromMissionsSurvey: number;
  numberOfCompletedMissionsBounty: number;
  numberOfCompletedMissionsCrafting: number;
  numberOfCompletedMissionsDancer: number;
  numberOfCompletedMissionsDeliver: number;
  numberOfCompletedMissionsDestroy: number;
  numberOfCompletedMissionsHunting: number;
  numberOfCompletedMissionsMusician: number;
  numberOfCompletedMissionsRecon: number;
  numberOfCompletedMissionsSurvey: number;
}

export interface VersionResponse {
  result: {
    api_version: string;
    core3_version: string;
  };
}

export const MISSION_TYPES = [
  'Bounty',
  'Crafting',
  'Dancer',
  'Deliver',
  'Destroy',
  'Hunting',
  'Musician',
  'Recon',
  'Survey',
] as const;

export type MissionType = (typeof MISSION_TYPES)[number];

// Database types (from MySQL)

export interface Galaxy {
  galaxy_id: number;
  name: string;
  address: string;
  port: number;
  pingport: number;
  population: number;
}

export interface Account {
  account_id: number;
  username: string;
  created: string;
  active: number;
  admin_level: number;
  character_count?: number;
}

export interface Character {
  character_oid: string;
  account_id: number;
  galaxy_id: number;
  firstname: string;
  surname: string | null;
  race: number;
  gender: number;
  template: string;
  creation_date: string;
}

export interface AccountBan {
  ban_id: number;
  account_id: number;
  issuer_id: number;
  galaxy_id: number;
  name: string;
  created: string;
  expires: number;
  reason: string;
}

export interface AccountDetail {
  account: Account;
  characters: Character[];
  bans: AccountBan[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// REST API response types

export interface CharacterSearchResult {
  metadata: {
    objectCount: number;
    msSearch: number;
    msExport: number;
    offset: number;
    limit: number;
    total: number;
  };
  names: Record<string, number>;
  objects?: Record<string, ObjectData>;
}

export interface ObjectData {
  _oid: number;
  _className: string;
  _depth: number;
  _oidPath: number[];
  [key: string]: unknown;
}

export interface ObjectLookupResult {
  metadata: {
    exportTime: string;
    objectCount: number;
    maxDepth: number;
    recursive: boolean;
  };
  objects: Record<string, ObjectData>;
}

export interface ConfigResult {
  metadata: { exportTime: string };
  result: Record<string, unknown>;
}

export interface ActionResult {
  status: string;
  status_code: number;
  [key: string]: unknown;
}

export type TabId = 'dashboard' | 'players' | 'chat' | 'config' | 'console';
