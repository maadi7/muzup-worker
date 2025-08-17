import {
  getModelForClass,
  index,
  ModelOptions,
  prop,
  Ref,
  Severity,
} from "@typegoose/typegoose";
import { Field, ID, ObjectType } from "type-graphql";
import { User } from "../user/user.schema";
import { Message } from "../message/message.schema";

@ObjectType()
@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
@index({ participants: 1 })
export class Conversation {
  @Field(() => ID)
  _id: string;

  @Field(() => [User])
  @prop({ ref: () => User, required: true })
  participants: Ref<User>[];

  @Field(() => [Message], { nullable: true })
  @prop({ ref: () => Message, default: [] })
  messages: Ref<Message>[];

  @Field(() => Date)
  @prop()
  updatedAt: Date;

  @Field(() => Date)
  @prop()
  createdAt: Date;
}

export const ConversationModel = getModelForClass(Conversation, {
  schemaOptions: { timestamps: true },
});
