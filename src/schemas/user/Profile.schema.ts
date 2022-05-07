import { Field, ObjectType, ID, InputType, Int } from "type-graphql";
import { prop } from "@typegoose/typegoose";

@ObjectType({ description: "User Profile object structure" })
export class Profile {
  @Field(() => String)
  avatar!: string;

  @Field(() => String)
  name?: string;

  @Field(() => String)
  username!: string;

  @Field()
  email!: string;

  @Field(() => Int)
  followers?: number;

  @Field(() => Int)
  codespacesCount?: number;

  @Field(() => Date)
  createdAt?: number;

  @Field(() => Date)
  updatedAt?: number;
}
