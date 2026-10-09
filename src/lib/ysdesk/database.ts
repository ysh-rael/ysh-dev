import { MongoClient, type Db } from "mongodb";

const globalMongo = globalThis as typeof globalThis & {
  ysdeskMongoPromise?: Promise<MongoClient>;
  ysdeskIndexesPromise?: Promise<void>;
};

export async function getDatabase(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não está configurada.");

  if (!globalMongo.ysdeskMongoPromise) {
    globalMongo.ysdeskMongoPromise = new MongoClient(uri).connect();
  }

  const client = await globalMongo.ysdeskMongoPromise;
  const database = client.db(process.env.MONGODB_DB || "ysdesk");

  if (!globalMongo.ysdeskIndexesPromise) {
    globalMongo.ysdeskIndexesPromise = Promise.all([
      database.collection("users").createIndex({ email: 1 }, { unique: true }),
      database.collection("devices").createIndex({ userId: 1, status: 1 }),
      database.collection("devices").createIndex({ installationId: 1 }, { unique: true, sparse: true }),
      database.collection("devices").createIndex({ activationCodeHash: 1 }, { unique: true, sparse: true }),
      database.collection("licenses").createIndex({ paymentId: 1 }, { unique: true }),
      database.collection("licenses").createIndex({ userId: 1, expiresAt: 1 }),
      database.collection("payments").createIndex({ externalReference: 1 }, { unique: true }),
      database.collection("payments").createIndex({ mercadoPagoId: 1 }, { unique: true, sparse: true }),
      database.collection("payments").createIndex({ userId: 1, createdAt: -1 }),
      database.collection("centralTokens").createIndex({ tokenHash: 1 }, { unique: true }),
      database.collection("centralTokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      database.collection("centralTokens").createIndex({ installationId: 1, revokedAt: 1 }),
      database.collection("centralSessions").createIndex({ sessionId: 1 }, { unique: true }),
      database.collection("centralSessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      database.collection("relayTickets").createIndex({ tokenHash: 1 }, { unique: true }),
      database.collection("relayTickets").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]).then(() => undefined);
  }

  await globalMongo.ysdeskIndexesPromise;
  return database;
}