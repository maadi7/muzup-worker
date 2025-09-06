// src/modules/notification/schema/notification.schema.ts
import {
  getModelForClass,
  index,
  ModelOptions,
  prop,
  Ref,
  Severity,
} from "@typegoose/typegoose";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import { GraphQLJSON } from "graphql-scalars";
import { User } from "../user/user.schema";

/** -------------------------------
 * Enums
 * ------------------------------- */
export enum NotificationType {
  POST_LIKE = "POST_LIKE",
  POST_COMMENT = "POST_COMMENT",
  COMMENT_REPLY = "COMMENT_REPLY",
  MESSAGE = "MESSAGE",
  FOLLOW = "FOLLOW",
}

export enum NotificationEntityType {
  POST = "POST",
  COMMENT = "COMMENT",
  MESSAGE = "MESSAGE",
  USER = "USER",
}

// GraphQL enum registration
registerEnumType(NotificationType, {
  name: "NotificationType",
  description:
    "Type of notification event (like, comment, reply, message, follow, etc.)",
});

registerEnumType(NotificationEntityType, {
  name: "NotificationEntityType",
  description:
    "Entity referenced by the notification (post, comment, message, user).",
});

/** -------------------------------
 * Notification Schema
 * ------------------------------- */
@ObjectType()
@index({ receiver: 1, isRead: 1, createdAt: -1 })
@index({ receiver: 1, createdAt: -1 })
@index({ receiver: 1, type: 1, createdAt: -1 })
@index({ dedupeKey: 1 }, { unique: true, sparse: true })
@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
export class Notification {
  @Field(() => ID)
  _id: string;

  // who gets notified
  @Field(() => User)
  @prop({ ref: () => User, required: true })
  receiver: Ref<User>;

  // who triggered the event
  @Field(() => User)
  @prop({ ref: () => User, required: true })
  sender: Ref<User>;

  @Field(() => NotificationType)
  @prop({ required: true, enum: NotificationType })
  type: NotificationType;

  // what object this notification points to (post/comment/message/user)
  @Field(() => NotificationEntityType)
  @prop({ required: true, enum: NotificationEntityType })
  entityType: NotificationEntityType;

  // id of that object (postId/commentId/messageId/userId)
  @Field(() => String, { nullable: true })
  @prop({ required: false })
  entityId?: string;

  // optional pre-rendered text (can also generate on client)
  @Field(() => String, { nullable: true })
  @prop()
  text?: string;

  // extra details you might need (e.g., postPreview, messageSnippet, chatId, commentId)
  @Field(() => GraphQLJSON, { nullable: true })
  @prop({ type: () => Object })
  metadata?: Record<string, any>;

  // idempotency: helps avoid duplicate likes spam ("POST_LIKE:sender:receiver:postId")
  @Field(() => String, { nullable: true })
  @prop({ index: true })
  dedupeKey?: string;

  // read state
  @Field(() => Boolean)
  @prop({ default: false })
  isRead: boolean;

  @Field(() => Date, { nullable: true })
  @prop()
  readAt?: Date;

  // allow hiding without deleting
  @Field(() => Boolean)
  @prop({ default: false })
  isArchived?: boolean;

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const NotificationModel = getModelForClass(Notification, {
  schemaOptions: { timestamps: true },
});
