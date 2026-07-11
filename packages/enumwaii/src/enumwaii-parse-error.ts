import { EnumwaiiError } from './enumwaii-error';

export class EnumwaiiParseError extends EnumwaiiError {
  constructor(
    readonly enumName: string,
    readonly received: unknown,
    readonly allowedValues: readonly string[],
  ) {
    super(
      `[enumwaii] "${enumName}" cannot parse ${JSON.stringify(received)}. Allowed values: ${allowedValues.join(', ')}`,
    );
    this.name = 'EnumwaiiParseError';
  }
}
