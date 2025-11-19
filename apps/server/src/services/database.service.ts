import mongoose from 'mongoose';

import env from '@~/constants/env';

class DatabaseService {
  public async connect() {
    await this.connectToExternalDatabase();
  }

  private async connectToExternalDatabase() {
    await mongoose
      .connect(env.MONGO_URI, {
        dbName: env.MONGO_DATABASE_NAME,
        auth: {
          username: env.MONGO_USER,
          password: env.MONGO_PASSWORD,
        },
      })
      .catch((error) => {
        console.log('Error connecting to database:', error);
      });
  }

  public getClient() {
    const client = mongoose.connection.getClient();
    if (!client) throw new Error('Database client is not connected');
    return client.db();
  }
}

export default new DatabaseService();
