import {
  getModelForClass,
  index,
  ModelOptions,
  prop,
  Ref,
  Severity,
} from "@typegoose/typegoose";
import { Field, ID, ObjectType } from "type-graphql";
import { Message } from "../message/message.schema";
import { User } from "../user/user.schema";

@ObjectType()
@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
@index({ participants: 1 })
export class Conversation {
  @Field(() => ID)
  _id: string;

  @Field(() => [User])
  @prop({ ref: () => User, required: true })
  participants: Ref<User>[];

  // last message info for fast inbox UI
  @Field(() => Message, { nullable: true })
  @prop({ ref: () => Message })
  lastMessage?: Ref<Message>;

  @prop({
    map: Number, // specify value type
    default: () => new Map<string, number>(),
  })
  unreadCount: Map<string, number>;

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
