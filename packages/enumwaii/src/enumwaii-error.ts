export class EnumwaiiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnumwaiiError';
  }
}
