import { Enumwaii } from '@startername/enumwaii/enumwaii';
import type { InferEnumwaii } from '@startername/enumwaii/enumwaii';

const eventsEnumwaii = new Enumwaii('EventType', ['BETA_EVENT']);

export const EVENTS = eventsEnumwaii.enum;

export type EventType = InferEnumwaii<typeof eventsEnumwaii>;

export const eventTypeSchema = eventsEnumwaii.schema;

export interface iBetaEventPayload {
  userId: string;
}

export interface iEventPayloadMap {
  [EVENTS.BETA_EVENT]: iBetaEventPayload;
}
