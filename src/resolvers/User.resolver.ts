import { Arg, Mutation, Query, Resolver, Ctx } from "type-graphql";
import mongoose from "mongoose";
import { CookieOptions } from "express";
import { isEmail } from "class-validator";

import { CreateUserInput, UpdateUserInput, User, UserModel } from "../schemas/user/User.schema";
import { ResolverError, isImage } from "../utils/index";
import { Context } from "../types/context";
import { Profile } from "../schemas/user/Profile.schema";

@Resolver(User)
export class UserResolver {
  private cookieOptions: CookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 7, // Expires in 1 week
    httpOnly: false,
    sameSite: "lax",
  };

  /**
   * @param id user id (mongo id)
   * @returns user object
   */
  @Query(() => User)
  async getUserById(@Arg("id") id: string): Promise<User> {
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
   * @brief get current user using cookies, if user is not logged in, throw error
   * @returns user object
   */
  @Query(() => User)
  async me(@Ctx() { req }: Context): Promise<User> {
    if (!req.cookies["token"]) throw new ResolverError("Session expired", "SESSION_EXPIRED");

    const user = await UserModel.findOne({ _id: decodeURIComponent(req.cookies["token"]) });
    if (!user) throw new ResolverError("User not found", "USER_NOT_FOUND");

    return user.toObject();
  }

  /**
   *
   * @param username username of the user to search
   * @returns user object list or undefined if not found. the list is lmited to 50 users only (for performance reasons) and sorted by username alphabetically
   */
  @Query(() => [Profile])
  async searchUsers(@Arg("username") username: string): Promise<Profile[] | undefined> {
    const users = await UserModel.find({ username: { $regex: username, $options: "i" } })
      .limit(50)
      .sort({ username: 1 });
    return users.map((user) => user.toObject());
  }

  /**
   * @breif create user and return user object (signup)
   * @param input input object with email and password fields. @Note: "input" must be the name of the argument when creating user.
   * @returns user user object
   */
  @Mutation(() => Boolean)
  async createUser(@Arg("input") input: CreateUserInput): Promise<boolean> {
    // check if email or password, etc are empty
    if (!input.name || !input.username || !input.email || !input.password)
      throw new ResolverError("Name, username, email or password is missing", "INVALID_INPUT");

    // check if email is valid
    if (!isEmail(input.email))
      throw new ResolverError("Invalid email", "INVALID_EMAIL", {
        errors: {
          field: "email",
          message: "Invalid email",
        },
      });

    // check if username is valid
    if (input.username.length < 3 || input.username.length > 20)
      throw new ResolverError("Invalid username", "INVALID_USERNAME", {
        errors: {
          field: "username",
          message: "Invalid username",
        },
      });

    // check if password is valid
    if (input.password.length < 6 || input.password.length > 50)
      throw new ResolverError("Password must be between 6 and 50 characters", "INVALID_PASSWORD");

    const userInput = new UserModel(input);

    // check if email already exists
    const isAlreadyExistsEmail = await UserModel.findOne({ email: userInput.email });
    if (isAlreadyExistsEmail)
      throw new ResolverError("Email already exists", "EMAIL_ALREADY_EXISTS", {
        errors: {
          field: "email",
          message: "Email already exists",
        },
      });

    // check if username is already taken
    const isAlreadyExistsUsername = await UserModel.findOne({ username: userInput.username });
    if (isAlreadyExistsUsername)
      throw new ResolverError("Username already exists", "USERNAME_ALREADY_EXISTS", {
        errors: {
          field: "username",
          message: "Username already exists",
        },
      });

    const { _id } = await userInput.save();
    return true;
  }

  /**
   * @brief check if user exists by email or username and return user object (login). If user is not found, throw error. user login will expire after 1 week.
   * @param email user input email
   * @param password user input password
   * @returns user object
   */
  @Mutation(() => User)
  async loginByEmailAndPassword(
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
    res.cookie("token", encodeURIComponent(user._id), this.cookieOptions);

    return user;
  }

  @Mutation(() => User)
  async loginByUsernameorEmailAndPassword(
    @Arg("input") input: string,
    @Arg("password") password: string,
    @Ctx() { res }: Context
  ): Promise<User | string> {
    let email = "",
      username = "";
    // check if username or password are empty
    if (!input || !password) throw new ResolverError("Username/Email or password is missing");

    if (!isEmail(input)) {
      username = input;
      if (input.length < 3 || input.length > 20)
        throw new ResolverError("Invalid username", "INVALID_USERNAME", {
          errors: {
            field: "username",
            message: "Invalid username",
          },
        });
    } else {
      email = input;
      if (!isEmail(input))
        throw new ResolverError("Invalid email", "INVALID_EMAIL", {
          errors: {
            field: "email",
            message: "Invalid email",
          },
        });
    }
    // check if password is valid
    if (password.length < 6 || password.length > 50)
      throw new ResolverError("Password must be between 6 and 50 characters", "INVALID_PASSWORD");
    // check if user exists by username and password
    let user: any = null;
    if (email) {
      user = await UserModel.findOne({ email: email, password: password });
    } else if (username) {
      user = await UserModel.findOne({ username: username, password: password });
    }
    if (!user)
      throw new ResolverError("Invalid username/email or password", "INVALID_CREDENTIALS", {
        errors: [
          {
            field: "username/email",
            message: "Invalid username/email",
          },
          {
            field: "password",
            message: "Invalid password",
          },
        ],
      });

    user.toObject();

    // set userId cookie, so we can access user data without logging in again
    //TODO: hash user id

    res.cookie("token", encodeURIComponent(user._id), this.cookieOptions);

    return user;
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: Context): Promise<boolean> {
    res.clearCookie("token");
    return true;
  }

  @Mutation(() => Boolean)
  async deleteUser(@Arg("username") username: string): Promise<boolean> {
    await UserModel.deleteOne({ username: username });
    return true;
  }

  @Mutation(() => Boolean)
  async updateUser(@Arg("input") input: UpdateUserInput, @Ctx() { req, res }: Context): Promise<boolean> {
    if (!req.cookies["token"]) throw new ResolverError("Session expired", "SESSION_EXPIRED");

    const user = await UserModel.findOne({ _id: decodeURIComponent(req.cookies["token"]) });

    if (!user) throw new ResolverError("User not found", "USER_NOT_FOUND");

    let isChanged = false;

    if (input.name && input.name.length > 0 && input.name !== user.name) {
      user.name = input.name;
      isChanged = true;
    }

    if (input.username && input.username !== user.username) {
      if (input.username.length < 3 || input.username.length > 20)
        throw new ResolverError("Invalid username", "INVALID_USERNAME", {
          errors: {
            field: "username",
            message: "Invalid username",
          },
        });
      const isAlreadyExistsUsername = await UserModel.findOne({ username: input.username });
      if (isAlreadyExistsUsername)
        throw new ResolverError("Username already exists", "USERNAME_ALREADY_EXISTS", {
          errors: {
            field: "username",
            message: "Username already exists",
          },
        });
      user.username = input.username;
      isChanged = true;
    }

    if (input.avatar && input.avatar !== user.avatar) {
      if (isImage(input.avatar)) {
        user.avatar = input.avatar;
        isChanged = true;
      } else {
        throw new ResolverError("Invalid avatar", "INVALID_AVATAR", {
          errors: {
            field: "avatar",
            message: "Invalid avatar",
          },
        });
      }
    }

    if (input.email) {
      if (!isEmail(input.email))
        throw new ResolverError("Invalid email", "INVALID_EMAIL", {
          errors: {
            field: "email",
            message: "Invalid email",
          },
        });

      const isAlreadyExistsEmail = await UserModel.findOne({ email: input.email });
      if (isAlreadyExistsEmail)
        throw new ResolverError("Email already exists", "EMAIL_ALREADY_EXISTS", {
          errors: {
            field: "email",
            message: "Email already exists",
          },
        });
      user.email = input.email;
      isChanged = true;
    }

    if (input.password) {
      if (input.password.length < 6 || input.password.length > 50)
        throw new ResolverError("Password must be between 6 and 50 characters", "INVALID_PASSWORD");
      user.password = input.password;
      isChanged = true;

      /**
       * @NOTE maybe send email to user with new password to confirm it
       */
      // // send email to user with new password
      // const transporter = nodemailer.createTransport({
      //   service: "gmail",
      //   auth: {
      //     user: process.env.EMAIL,
      //     pass: process.env.EMAIL_PASSWORD,
      //   },
      // });
      // const mailOptions = {
      //   from: process.env.EMAIL,
      //   to: user.email,
      //   subject: "Password changed",
      //   text: `Your new password is: ${input.password}`,
      // };
      // transporter.sendMail(mailOptions, (err, info) => {
      //   if (err) {
      //     console.log(err);
      //   } else {
      //     console.log(info);
      //   }

      //   transporter.close();

      //   return true;

      // });
    }
    if (isChanged) {
      await user.save();
      return true;
    } else return false;
  }
}
