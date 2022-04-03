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
    if (!req.cookies["userId"]) throw new ResolverError("Session expired.", "SESSION_EXPIRED");

    if (!input.title || !input.code || !input.language)
      throw new ResolverError("Title, code or language is missing.", "INVALID_CODESPACE_INPUT");

    input.title = input.title.trim();
    if (input.title.length > 50 || input.title.length < 3)
      throw new ResolverError("Title must be between 3 and 50.", "INVALID_CODESPACE_INPUT");

    const user = await UserModel.findOne({ _id: decodeURIComponent(req.cookies["userId"]) });

    if (!user) throw new ResolverError("Something went wrong.", "SOMETHING_WENT_WRONG");

    // Check if codespace already exists for this user
    if (await CodespaceModel.findOne({ title: input.title, owner: user.toObject()._id }))
      throw new ResolverError("Codespace already exists.", "CODESPACE_ALREADY_EXISTS");

    const codespace = new CodespaceModel(input);
    // Set owner
    codespace.owner = user._id;
    // convert code to base64 and save
    codespace.code = encode(codespace.code!);
    await codespace.save();
    return codespace.toObject();
  }

  /**
   * @param title Title of the codespace to be updated
   * @param input Input to update the codespace with the new value
   * @returns Updated codespace
   *
   * @TODO Add a good validation for input
   */
  @Mutation(() => Codespace)
  async updateCodespace(
    @Arg("title") title: string,
    @Arg("updatedInput") updatedInput: CreateCodespaceInput,
    @Ctx() { req }: Context
  ): Promise<Codespace> {
    if (!req.cookies["userId"]) throw new ResolverError("Session expired", "SESSION_EXPIRED");

    if (!(await CodespaceModel.findOne({ title: title })))
      throw new ResolverError("Codespace not found.", "CODESPACE_NOT_FOUND");

    const user = await UserModel.findOne({ _id: decodeURIComponent(req.cookies["userId"]) });

    if (!user) throw new ResolverError("Something went wrong.", "SOMETHING_WENT_WRONG");

    const codespace = await CodespaceModel.findOne({ title: title, owner: user._id });

    if (!codespace) throw new ResolverError("Codespace not found.", "CODESPACE_NOT_FOUND");

    if (updatedInput.title) updatedInput.title = updatedInput.title.trim();
    if (updatedInput.title?.length <= 50 || updatedInput.title?.length >= 3) codespace.title = updatedInput.title;
    if (updatedInput.language) codespace.language = updatedInput.language;
    if (updatedInput.description) codespace.description = updatedInput.description;
    if (updatedInput.code) codespace.code = updatedInput.code;
    codespace.isPublic = updatedInput.isPublic;

    await codespace.save();
    return codespace.toObject();
  }

  /**
   * get a codespace by title for the current logged in user
   * @param title Title of the codespace of the user
   * @returns codespace
   */
  @Query(() => Codespace)
  async searchCodespaceForUserByTitle(@Arg("title") title: string, @Ctx() { req }: Context): Promise<Codespace> {
    if (!req.cookies["userId"]) throw new ResolverError("Session expired", "SESSION_EXPIRED");
    if (!title) throw new ResolverError("Title is missing.", "INVALID_CODESPACE_INPUT");

    const user = await UserModel.findOne({ _id: decodeURIComponent(req.cookies["userId"]) });

    if (!user) throw new ResolverError("Something went wrong.", "SOMETHING_WENT_WRONG");

    const codespace = await CodespaceModel.findOne({ title: title, owner: user._id });

    if (!codespace) throw new ResolverError("Codespace not found.", "CODESPACE_NOT_FOUND");
    return codespace.toObject();
  }

  /**
   * get a codespaces by title using everyones codespaces
   * @param title Title of the codespace
   * @returns Codespaces that match the title
   */
  @Query(() => [Codespace])
  async searchCodespacesByTitle(@Arg("title") title: string): Promise<Codespace[]> {
    if (!title) throw new ResolverError("Title is missing.", "INVALID_CODESPACE_INPUT");

    const codespaces = await CodespaceModel.find({
      title: title,
      isPublic: true,
    });

    if (!codespaces) throw new ResolverError("Codespaces not found.", "CODESPACES_NOT_FOUND");
    return codespaces.map((codespace) => codespace.toObject());
  }

  /**
   * get all codespaces for the current logged in user
   * @returns All codespaces for the current logged in user
   */
  @Query(() => [Codespace])
  async getCodespacesForUser(@Ctx() { req }: Context): Promise<Codespace[]> {
    if (!req.cookies["userId"]) throw new ResolverError("Session expired", "SESSION_EXPIRED");

    const user = await UserModel.findOne({ _id: decodeURIComponent(req.cookies["userId"]) });

    if (!user) throw new ResolverError("Something went wrong.", "SOMETHING_WENT_WRONG");

    const codespaces = await CodespaceModel.find({ owner: user._id });

    if (!codespaces) throw new ResolverError("Codespaces not found.", "CODESPACES_NOT_FOUND");
    return codespaces.map((codespace) => codespace.toObject());
  }
}
