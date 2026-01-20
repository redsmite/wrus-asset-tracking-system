import { MongoClient } from "mongodb";

// Connection URL (local MongoDB)
const uri = "mongodb://127.0.0.1:27017"; // default local MongoDB
const client = new MongoClient(uri);

// Database name
const dbName = "wrus_db";

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db(dbName);
  }
  return db;
}

export { connectDB };
