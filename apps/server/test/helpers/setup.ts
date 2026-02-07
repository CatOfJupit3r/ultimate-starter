import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import 'reflect-metadata';
import { afterAll, afterEach } from 'vitest';

// Import custom matchers
import './matchers';

let mongo: MongoMemoryServer;

console.log('Setting up in-memory MongoDB server for tests...');
mongo = await MongoMemoryServer.create({
  // Use ephemeral storage for faster I/O in CI
  instance: {
    storageEngine: 'ephemeralForTest',
  },
});
const uri = mongo.getUri();
await mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  // Reduce connection pool for tests
  maxPoolSize: 5,
});
console.log('In-memory MongoDB server is ready.');

afterEach(async () => {
  // Use deleteMany on all collections instead of dropDatabase - much faster
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  console.log('Tearing down in-memory MongoDB server...');
  try {
    await mongoose.disconnect();
    await mongo.stop({ doCleanup: true, force: true });
  } catch (error) {
    console.error('Error during teardown of in-memory MongoDB server:', error);
  }
  console.log('In-memory MongoDB server has been stopped.');
});
