import { EventEmitter } from 'node:events';

import type { iEventPayloadMap, EventType } from '@~/enums/events.enums';

class TypedEventBus extends EventEmitter {
  public on<K extends EventType>(event: K, listener: (payload: iEventPayloadMap[K]) => unknown): this {
    return super.on(event, listener);
  }

  public off<K extends EventType>(event: K, listener: (payload: iEventPayloadMap[K]) => unknown): this {
    return super.off(event, listener);
  }

  public emit<K extends EventType>(event: K, payload: iEventPayloadMap[K]): boolean {
    return super.emit(event, payload);
  }

  public once<K extends EventType>(event: K, listener: (payload: iEventPayloadMap[K]) => unknown): this {
    return super.once(event, listener);
  }
}

export const eventBus = new TypedEventBus();
