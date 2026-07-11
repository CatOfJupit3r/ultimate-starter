import type { TestProject } from 'vitest/node';

export default async function setup({ provide }: TestProject) {
  void provide;
}
