import achievementsContract from './contract/achievements.contract';
import badgesContract from './contract/badges.contract';
import indexContract from './contract/index.contract';
import userContract from './contract/user.contract';

export const CONTRACT = {
  user: userContract,
  index: indexContract,
  achievements: achievementsContract,
  badges: badgesContract,
};

export type AppContract = typeof CONTRACT;

export default CONTRACT;
