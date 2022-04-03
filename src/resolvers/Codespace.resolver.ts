import { Arg, Mutation, Query, Resolver, Ctx } from "type-graphql";
import mongoose from "mongoose";

import { Codespace, CodespaceModel, CreateCodespaceInput } from "../schemas/Codespace.schema";
import { UserModel } from "../schemas/User.schema";
import { ResolverError } from "../utils/index";
import { Context } from "../types/context";
import { encode, decode } from "../utils/utils";

@Resolver(Codespace)
export class CodespaceResolver {
  @Mutation(() => Codespace)
  async createCodespace(@Arg("input") input: CreateCodespaceInput, @Ctx() { req }: Context): Promise<Codespace> {
    if (!req.cookies["userId"]) throw new ResolverError("Session expired", "SESSION_EXPIRED");

    if (!input.title || !input.code || !input.language)
      throw new ResolverError("Title, code or language is missing", "INVALID_CODESPACE_INPUT");

    input.title = input.title.trim();
    if (input.title.length > 50 || input.title.length < 3)
      throw new ResolverError("Title must be between 3 and 50.", "INVALID_CODESPACE_INPUT");

    const user = await UserModel.findOne({ _id: decodeURIComponent(req.cookies["userId"]) });

    if (!user) throw new ResolverError("Something went wrong", "SOMETHING_WENT_WRONG");

    if (await CodespaceModel.findOne({ title: input.title }))
      throw new ResolverError("Codespace already exists", "CODESPACE_ALREADY_EXISTS");

    const codespace = new CodespaceModel(input);
    codespace.owner = user._id;
    codespace.code = encode(codespace.code);
    await codespace.save();
    return codespace.toObject();
  }

  @Query(() => Codespace)
  async getCodespace(@Arg("title") title: string, @Ctx() { req }: Context): Promise<Codespace> {
    if (!req.cookies["userId"]) throw new ResolverError("Session expired", "SESSION_EXPIRED");

    if (!title) throw new ResolverError("Title is missing", "INVALID_CODESPACE_INPUT");

    const codespace = await CodespaceModel.findOne({
      title: title,
      owner: decodeURIComponent(req.cookies["userId"]),
    });

    if (!codespace) throw new ResolverError("Codespace not found", "CODESPACE_NOT_FOUND");
    return codespace.toObject();
  }

  //TODO: Query codespaces by user
  //TODO: Query codespaces by language
  //...
}
