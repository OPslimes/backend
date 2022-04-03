import { Field, ObjectType, ID, InputType, Int } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";

@ObjectType({ description: "Codespace structure" })
export class Codespace {
  @Field(() => ID)
  _id?: string;

  @Field(() => String)
  @prop({ required: true })
  title!: string;

  @Field(() => String)
  @prop({ default: () => "", required: false })
  description!: string;

  @Field(() => String)
  @prop({ required: true })
  code!: string;

  @Field(() => String)
  @prop({ required: true })
  language!: string;

  @Field(() => ID)
  @prop({ required: true })
  owner!: string;

  @Field(() => Int)
  @prop({ default: () => 0, required: true })
  stars?: number;

  @Field(() => Int)
  @prop({ default: () => 0, required: true })
  views?: number;

  @Field(() => Int)
  @prop({ default: () => 0, required: true })
  downloads?: number;

  @Field(() => Int)
  @prop({ default: () => 0, required: true })
  contributors?: number;

  @Field(() => Int)
  @prop({ default: () => 0, required: true })
  commits?: number;

  @Field(() => Date)
  @prop({ type: () => Date, default: () => Date.now(), required: true })
  createdAt?: number;

  @Field(() => Date)
  @prop({ type: () => Date, default: () => Date.now(), required: true })
  updatedAt?: number;
}

export const CodespaceModel = getModelForClass<typeof Codespace>(Codespace);

@InputType()
export class CreateCodespaceInput {
  @Field(() => String)
  title: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  language: string;
}
