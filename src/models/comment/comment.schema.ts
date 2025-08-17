import {
  getModelForClass,
  ModelOptions,
  prop,
  Ref,
  Severity,
} from "@typegoose/typegoose";
import { Field, ID, ObjectType } from "type-graphql";
import { User } from "../user/user.schema";
import { Post } from "../post/post.schema";

@ObjectType()
@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
export class Comment {
  @Field(() => ID)
  _id: string;

  // Post
  @Field(() => Post)
  @prop({ ref: () => Post, required: true })
  postId: Ref<Post>;

  // User (who made the comment)
  @Field(() => User)
  @prop({ ref: () => User, required: true })
  userId: Ref<User>;

  // Comment (parent comment, nullable for top-level comments)
  @Field(() => Comment, { nullable: true })
  @prop({ ref: () => Comment, required: false })
  parentId?: Ref<Comment>;

  // User (the person this comment is replying to)
  @Field(() => User, { nullable: true })
  @prop({ ref: () => User, required: false })
  replyToUserId?: Ref<User>;

  // The comment text itself
  @Field(() => String)
  @prop({ required: true })
  content: string;

  @Field(() => [User], { nullable: true })
  @prop({ ref: () => User, default: [] })
  taggedUserIds?: Ref<User>[];

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const CommentModel = getModelForClass(Comment, {
  schemaOptions: { timestamps: true },
});
