import {
  getModelForClass,
  index,
  ModelOptions,
  prop,
  Ref,
  Severity,
} from "@typegoose/typegoose";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { User } from "../user/user.schema";
import { Conversation } from "../conversations/conversations.schema";

// Enum for message status
export enum MessageStatusEnum {
  SENT = "sent",
  DELIVERED = "delivered",
  SEEN = "seen",
}

registerEnumType(MessageStatusEnum, {
  name: "MessageStatusEnum",
  description: "Status of a chat message for each participant",
});

@ObjectType()
@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
export class Message {
  @Field(() => ID)
  _id: string;

  @Field(() => User)
  @prop({ ref: () => User, required: true })
  sender: Ref<User>;

  @Field(() => String)
  @prop({ required: true })
  text: string;

  @Field(() => MessageStatusEnum)
  @prop({
    enum: MessageStatusEnum,
    required: true,
    default: MessageStatusEnum.SENT,
  })
  status: MessageStatusEnum; // just one status for the receiver

  @Field(() => Conversation)
  @prop({ ref: () => Conversation, required: true })
  conversation: Ref<Conversation>;

  @Field(() => Date)
  @prop()
  createdAt: Date;
}

export const MessageModel = getModelForClass(Message, {
  schemaOptions: { timestamps: true },
});
