import mongoose from 'mongoose';
import { afterAll, afterEach } from 'vitest';

// Import connection module to ensure mongoose is connected
// This module handles the connection and awaits it at module level
import './connection';
// Import custom matchers
import './matchers';

afterEach(async () => {
  // Use deleteMany on all collections instead of dropDatabase - much faster
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});
