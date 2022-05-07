import { Field, ObjectType, ID, InputType, Int } from "type-graphql";
import { prop, getModelForClass, pre } from "@typegoose/typegoose";

import { DEFAULT_USER_AVATAR } from "../../utils";

@pre<User>("save", function () {
  this.updatedAt = Date.now();
  // Check that the password is being modified
  if (!this.isModified("password")) {
    return;
  }
  // TODO: Hash the password
})
@ObjectType({ description: "User object structure" })
export class User {
  @Field(() => ID)
  _id?: string;

  @Field(() => String)
  @prop({ default: () => DEFAULT_USER_AVATAR, required: true })
  avatar!: string;

  @Field(() => String)
  @prop({ required: false })
  name?: string;

  @Field(() => String)
  @prop({ required: true })
  username!: string;

  @Field()
  @prop({ required: true })
  email!: string;

  @Field(() => String)
  @prop({ required: true })
  password!: string;

  @Field(() => Int)
  @prop({ default: () => 0, required: true })
  followers?: number;

  @Field(() => Int)
  @prop({ default: () => 0, required: true })
  codespacesCount?: number;

  @Field(() => Date)
  @prop({ type: () => Date, default: () => Date.now(), required: true })
  createdAt?: number;

  @Field(() => Date)
  @prop({ type: () => Date, default: () => Date.now(), required: true })
  updatedAt?: number;
}

export const UserModel = getModelForClass<typeof User>(User);

@InputType()
export class CreateUserInput {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String)
  username: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  password: string;
}

@InputType()
export class UpdateUserInput {
  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  username: string;

  @Field(() => String, { nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  password: string;

  @Field(() => String, { nullable: true })
  avatar: string;
}
