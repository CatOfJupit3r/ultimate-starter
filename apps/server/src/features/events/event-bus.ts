import { EventEmitter } from 'node:events';
import { singleton } from 'tsyringe';

import type { iEventPayloadMap, EventType } from '@~/features/events/events.constants';

@singleton()
export class TypedEventBus extends EventEmitter {
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
