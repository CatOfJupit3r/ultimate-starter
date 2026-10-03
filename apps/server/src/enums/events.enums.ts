import { em } from 'enumwaii';
import { emToZodSchema } from 'enumwaii/zod';

const eventsEnumwaii = em(['BETA_EVENT']);

export const EVENTS = eventsEnumwaii.enum;

export type EventType = (typeof eventsEnumwaii)['~type'];

export const eventTypeSchema = emToZodSchema(eventsEnumwaii);

export interface iBetaEventPayload {
  userId: string;
}

export interface iEventPayloadMap {
  [EVENTS.BETA_EVENT]: iBetaEventPayload;
}
