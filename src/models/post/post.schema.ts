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
import { PostType } from "./post.enum";

registerEnumType(PostType, {
  name: "PostType",
  description: "Enum For Type of Post i.e Image, Audio, Video",
});

@ObjectType()
class PostReaction {
  @Field(() => String)
  @prop({ required: true })
  emoji: string; // Example: "👍", "❤️", "😂" or even custom emoji IDs

  @Field(() => [User])
  @prop({ ref: () => User, default: [] })
  users: Ref<User>[]; // Users who reacted with this emoji
}

@ObjectType()
@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
export class Post {
  @Field(() => ID)
  _id: string;

  @Field(() => User, { nullable: false })
  @prop({ ref: "User", required: true })
  user: Ref<User>;

  @Field(() => String, { nullable: true })
  @prop({ required: false })
  caption: string;

  @Field(() => PostType, { nullable: true })
  @prop({ required: false })
  postType?: PostType;

  @Field(() => String, { nullable: false })
  @prop({ required: true })
  postUrl: string;

  @Field(() => String, { nullable: true })
  @prop({ required: false })
  waveUrl?: string;

  @Field(() => [User], { nullable: false })
  @prop({ ref: "User", required: true })
  visibleTo: Ref<User>[];

  // 🆕 Reactions field
  @Field(() => [PostReaction], { nullable: true })
  @prop({ type: () => [PostReaction], default: [] })
  reactions: PostReaction[];

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const PostModel = getModelForClass(Post, {
  schemaOptions: { timestamps: true },
});
