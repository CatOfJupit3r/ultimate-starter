import { afterAll, afterEach } from 'bun:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import 'reflect-metadata';

import { registerServices } from '@~/di';

let mongo: MongoMemoryServer;

console.log('Setting up in-memory MongoDB server for tests...');
mongo = await MongoMemoryServer.create();
const uri = mongo.getUri();
await mongoose.connect(uri, {
  serverSelectionTimeoutMS: 1000,
});
console.log('In-memory MongoDB server is ready.');

console.log('Registering DI services for tests...');
await registerServices();
console.log('DI services registered.');

afterEach(async () => {
  await Promise.race([
    mongoose.connection.db?.dropDatabase(),
    new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 100);
    }),
  ]);
});

afterAll(async () => {
  console.log('Tearing down in-memory MongoDB server...');
  try {
    await mongoose.disconnect();
    await mongo.stop();
  } catch (error) {
    console.error('Error during teardown of in-memory MongoDB server:', error);
  }
  console.log('In-memory MongoDB server has been stopped.');
});
