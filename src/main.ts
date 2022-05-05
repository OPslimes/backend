require("dotenv").config();

import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { mongoose } from "@typegoose/typegoose";

import { UserResolver } from "./resolvers/User.resolver";
import { CodespaceResolver } from "./resolvers/Codespace.resolver";
import { connectToDB } from "./utils/index";

const mongoOptions: mongoose.ConnectOptions = {
  keepAlive: true,
  connectTimeoutMS: 30000,
  dbName: "test2",
};

let mongooseClient: typeof mongoose;

const startServer = async () => {
  mongooseClient = await connectToDB(mongoOptions);

  const app = express();

  const PORT = process.env.PORT || 4000;

  app.use(express.json());
  app.use(
    cors({
      origin: true,
      credentials: true,
      optionsSuccessStatus: 200,
      methods: "POST",
    })
  );

  // need cookieParser middleware before we can do anything with cookies
  app.use(cookieParser());

  app.use((req, res, next) => next());

  // let static middleware do its job
  app.use(express.static(__dirname + "/public"));

  const server = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, CodespaceResolver],
    }),
    context: ({ req, res }) => ({ req, res }),
    debug: false,
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  console.log("\nServer starting...");
  await server.start();

  server.applyMiddleware({ app, path: "/api/v1/graphql", cors: false });

  app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}/api/v1/graphql`));
};

// driver code
(async () => {
  try {
    await startServer();
  } catch (err) {
    await mongooseClient!.disconnect();
    console.error(err);
    process.exit(1);
  }
})();
