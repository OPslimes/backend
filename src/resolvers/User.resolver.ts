import { Arg, Mutation, Query, Resolver, Ctx } from "type-graphql";
import mongoose from "mongoose";
import { CookieOptions } from "express";

import { CreateUserInput, User, UserModel } from "../schemas/User.schema";
import { ResolverError } from "../utils/index";
import { isEmail } from "class-validator";
import { Context } from "../types/context";

@Resolver(User)
export class UserResolver {
	/**
	 *
	 * @param id user id (mongo id)
	 * @returns user object
	 */
	@Query(() => User)
	async getUser(@Arg("id") id: string): Promise<User> {
		if (!mongoose.Types.ObjectId.isValid(id)) throw new ResolverError("Invalid id", "INVALID_ID");

		const user = await UserModel.findOne({ _id: id });

		if (!user) {
			throw new ResolverError("User not found", "USER_NOT_FOUND", {
				errors: [
					{
						field: "id",
						message: "User not found",
					},
				],
			});
		}

		return user.toObject();
	}

	/**
	 * @breif create user and return user object (signup)
	 * @param input input object with email and password fields. @Note: "input" must be the name of the argument when creating user.
	 * @returns user user object
	 */
	@Mutation(() => User)
	async createUser(@Arg("input") input: CreateUserInput): Promise<User> {
		// check if email or password, etc are empty
		if (!input.name || !input.username || !input.email || !input.password)
			throw new ResolverError("Name, username, email or password is missing", "INVALID_INPUT");

		// check if email is valid
		if (!isEmail(input.email))
			throw new ResolverError("Invalid email", "INVALID_EMAIL", {
				errors: [
					{
						field: "email",
						message: "Invalid email",
					},
				],
			});

		// check if username is valid
		if (input.username.length < 3 || input.username.length > 20)
			throw new ResolverError("Invalid username", "INVALID_USERNAME", {
				errors: [
					{
						field: "username",
						message: "Invalid username",
					},
				],
			});

		// check if password is valid
		if (input.password.length < 6 || input.password.length > 50)
			throw new ResolverError("Password must be between 6 and 50 characters", "INVALID_PASSWORD");

		const userInput = new UserModel(input);

		// check if email already exists
		const isAlreadyExistsEmail = await UserModel.findOne({ email: userInput.email });
		if (isAlreadyExistsEmail)
			throw new ResolverError("Email already exists", "EMAIL_ALREADY_EXISTS", {
				errors: [
					{
						field: "email",
						message: "Email already exists",
					},
				],
			});

		// check if username is already taken
		const isAlreadyExistsUsername = await UserModel.findOne({ username: userInput.username });
		if (isAlreadyExistsUsername)
			throw new ResolverError("Username already exists", "USERNAME_ALREADY_EXISTS", {
				errors: [
					{
						field: "username",
						message: "Username already exists",
					},
				],
			});

		const { _id } = await userInput.save();
		return (await UserModel.findOne({ _id: _id }))!.toObject();
	}

	/**
	 *	@brief check if user exists by email or username and return user object (login)
	 * @param email user input email
	 * @param password user input password
	 * @returns user object
	 */
	@Mutation(() => User)
	async login(
		@Arg("email") email: string,
		@Arg("password") password: string,
		@Ctx() { res }: Context
	): Promise<User | string> {
		// check if email or password are empty
		if (!email || !password) throw new ResolverError("Email or password is missing");

		// check if email is valid
		if (!isEmail(email))
			throw new ResolverError("Invalid email", "INVALID_EMAIL", {
				errors: [
					{
						field: "email",
						message: "Invalid email",
					},
				],
			});

		// check if password is valid
		if (password.length < 6 || password.length > 50)
			throw new ResolverError("Password must be between 6 and 50 characters", "INVALID_PASSWORD");

		// check if user exists by email and password
		const user = await UserModel.findOne({ email, password });
		if (!user)
			throw new ResolverError("Invalid email or password", "INVALID_CREDENTIALS", {
				errors: [
					{
						field: "email",
						message: "Invalid email or password",
					},
					{
						field: "password",
						message: "Invalid email or password",
					},
				],
			});

		user.toObject();

		// set userId cookie, so we can access user data without logging in again
		//TODO: hash user id

		const cookieOptions: CookieOptions = {
			maxAge: 1000 * 60 * 60 * 24 * 7, // Expires in 1 week
			httpOnly: false,
			sameSite: "lax",
		};

		res.cookie("userId", encodeURIComponent(user._id), cookieOptions);

		return user;
	}

	@Query(() => User)
	async me(@Ctx() { req }: Context): Promise<User> {
		const user = await UserModel.findOne({ _id: decodeURIComponent(req.cookies["userId"]) });
		if (!user) throw new ResolverError("User not found", "USER_NOT_FOUND");

		return user.toObject();
	}
}
