import {
  getModelForClass,
  index,
  ModelOptions,
  prop,
  Ref,
  Severity,
} from "@typegoose/typegoose";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import mongoose from "mongoose";
import { RequestStatus, UserType } from "./user.enum";
import { User } from "./user.schema";

// ============ ENUMS ============
registerEnumType(RequestStatus, {
  name: "RequestStatus",
  description: "Enum For Request status of followers",
});

@ObjectType()
@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
export class FriendReqeust {
  @Field(() => ID)
  _id: string;

  @Field(() => RequestStatus, { nullable: false })
  @prop({ required: true })
  status: UserType;

  @Field(() => User, { nullable: false })
  @prop({ ref: "User", required: true })
  senderId: Ref<User>;

  @Field(() => User, { nullable: false })
  @prop({ ref: "User", required: true })
  recieverId: Ref<User>;

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const FriendReqeustModal = getModelForClass(FriendReqeust, {
  schemaOptions: { timestamps: true },
});
