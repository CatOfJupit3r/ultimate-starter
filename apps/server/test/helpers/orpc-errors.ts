import { expect } from 'vitest';

import { errorMessages } from '@startername/common/enums/errors.enums';
import type { ErrorCodesType } from '@startername/common/enums/errors.enums';

interface iORPCErrorLike {
  message?: string;
  code?: string;
  data?: {
    code?: string;
    message?: string;
  };
}

async function getRejectedError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error('Expected promise to reject');
}

export async function expectORPCError(
  promise: Promise<unknown>,
  options: {
    code: ErrorCodesType;
    message?: string | RegExp;
    transportMessage?: string | RegExp;
  },
) {
  const error = (await getRejectedError(promise)) as iORPCErrorLike;

  expect(error).toBeDefined();
  expect(error.data?.code).toBe(options.code);

  const message = error.data?.message;
  const expectedMessage = options.message ?? errorMessages(options.code);

  if (typeof expectedMessage === 'string') {
    expect(message).toBe(expectedMessage);
  } else {
    expect(message ?? '').toMatch(expectedMessage);
  }

  if (options.transportMessage) {
    if (typeof options.transportMessage === 'string') {
      expect(error.message).toBe(options.transportMessage);
    } else {
      expect(error.message ?? '').toMatch(options.transportMessage);
    }
  }

  return error;
}
