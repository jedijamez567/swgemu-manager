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
