import { Field, ObjectType, ID, InputType, Int } from "type-graphql";
import { IsEmail, MinLength, MaxLength } from "class-validator";
import { prop, getModelForClass, pre } from "@typegoose/typegoose";

@pre<User>("save", function () {
	this.updatedAt = Date.now();
	// Check that the password is being modified
	if (!this.isModified("password")) {
		return;
	}
	// TODO: Hash the password
})
@ObjectType({ description: "User object" })
export class User {
	@Field(() => ID)
	_id?: string;

	@Field(() => String)
	@prop({ required: true })
	name!: string;

	@Field(() => String)
	@prop({ required: true })
	username!: string;

	@Field()
	@prop({ required: true })
	email!: string;

	@Field(() => String)
	@prop({ required: true })
	password!: string;

	@Field(() => Date)
	@prop({ type: () => Date, default: () => Date.now() })
	createdAt?: number;

	@Field(() => Date)
	@prop({ type: () => Date, default: () => Date.now() })
	updatedAt?: number;
}

export const UserModel = getModelForClass<typeof User>(User);

@InputType()
export class CreateUserInput {
	@Field(() => String)
	name: string;

	@Field(() => String, { nullable: false })
	username: string;

	@Field(() => String)
	email: string;

	@Field(() => String)
	password: string;
}

@InputType()
export class LoginUserInput {
	@Field(() => String)
	email: string;

	@Field(() => String)
	password: string;
}
