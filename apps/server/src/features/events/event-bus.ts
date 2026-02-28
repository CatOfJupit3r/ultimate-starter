import { EventEmitter } from 'node:events';
import { singleton } from 'tsyringe';

import type { Listener } from './listener.class';

@singleton()
export class EventBus {
  private readonly emitter = new EventEmitter();

  public on<T>(listener: Listener<T>, handler: (payload: T) => unknown): this {
    this.emitter.on(listener.name, handler);
    return this;
  }

  public off<T>(listener: Listener<T>, handler: (payload: T) => unknown): this {
    this.emitter.off(listener.name, handler);
    return this;
  }

  public emit<T>(listener: Listener<T>, payload: T): boolean {
    return this.emitter.emit(listener.name, payload);
  }

  public once<T>(listener: Listener<T>, handler: (payload: T) => unknown): this {
    this.emitter.once(listener.name, handler);
    return this;
  }
}
