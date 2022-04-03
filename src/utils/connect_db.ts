import { mongoose } from "@typegoose/typegoose";

/**
 * Connect to the database and return the mongoose client
 * @param options mongoose options object (see mongoose docs)
 * @returns mongoose client
 */
export const connectToDB = async (options?: mongoose.ConnectOptions): Promise<typeof mongoose> => {
 try {
  const mongooseClient = await mongoose.connect(process.env.MONGO_URI!, options);
  console.log(`Connected to ${mongooseClient.connection.name} database`);
  return mongooseClient;
 } catch (err) {
  console.error(err);
  throw new Error("Error connecting to database");
 }
};
