import mongoose from 'mongoose';
import 'reflect-metadata';
import { afterAll, afterEach } from 'vitest';

// Import custom matchers
import './matchers';

const uri = process.env.MONGO_URI;
const workerId = process.env.VITEST_WORKER_ID ?? '0';
const baseDbName = process.env.MONGO_DATABASE_NAME ?? 'startername-test';
const dbName = `${baseDbName}-${workerId}`;

// Ensure downstream code (e.g., DatabaseService) sees the scoped db name
process.env.MONGO_DATABASE_NAME = dbName;

if (!uri) {
  throw new Error('MONGO_URI was not provided to test setup');
}

const mongoUriWithDb = uri.endsWith('/') ? `${uri}${dbName}` : `${uri}/${dbName}`;

await mongoose.connect(mongoUriWithDb, {
  serverSelectionTimeoutMS: 5000,
  // Reduce connection pool for tests
  maxPoolSize: 5,
});

afterEach(async () => {
  // Use deleteMany on all collections instead of dropDatabase - much faster
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});
