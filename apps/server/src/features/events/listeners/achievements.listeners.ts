import { Listener } from '../listener.class';

export const BetaEventListener = new Listener<{ userId: string }>('BETA_EVENT');
