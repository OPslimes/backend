import { Field, ObjectType, ID, InputType, Int } from "type-graphql";
import { prop, getModelForClass, pre } from "@typegoose/typegoose";

import { encode } from "../../utils/utils";

/**
 * this function gets called before saving the model to the database
 */
@pre<Codespace>("save", function () {
  this.updatedAt = Date.now();

  if (!this.isModified("code")) return;

  this.code = encode(this.code!);
})
@ObjectType({ description: "Codespace structure" })
export class Codespace {
  @Field(() => ID)
  _id?: string;

  @Field(() => String)
  @prop({ required: true })
  title?: string;

  @Field(() => String)
  @prop({ default: () => "", required: false })
  description?: string;

  @Field(() => String)
  @prop({ required: true })
  code?: string;

  @Field(() => String)
  @prop({ required: true })
  language?: string;

  @Field(() => ID)
  @prop({ required: true })
  owner!: string;

  @Field(() => Boolean)
  @prop({ default: () => false, required: true })
  isPublic!: boolean;

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
  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => String, { nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  code: string;

  @Field(() => String, { nullable: true })
  language: string;

  @Field(() => Boolean, { nullable: true })
  isPublic: boolean;
}
