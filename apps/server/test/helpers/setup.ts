import { afterAll, afterEach } from 'bun:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongo: MongoMemoryServer;

console.log('Setting up in-memory MongoDB server for tests...');
mongo = await MongoMemoryServer.create();
const uri = mongo.getUri();
await mongoose.connect(uri, {
  serverSelectionTimeoutMS: 1000,
});
console.log('In-memory MongoDB server is ready.');

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
  await mongoose.disconnect();
  await mongo.stop();
  console.log('In-memory MongoDB server has been stopped.');
});
