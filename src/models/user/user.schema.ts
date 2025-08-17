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
import { UserType } from "./user.enum";
import { FriendReqeust } from "./friend-request.schema";

// ============ ENUMS ============
registerEnumType(UserType, {
  name: "UserType",
  description: "Enum For Type of User Artist or User",
});

// ============ EMBEDDED TYPES ============
@ObjectType()
export class Artist {
  @Field(() => String)
  @prop()
  id: string;

  @Field(() => String, { nullable: true })
  @prop()
  name?: string;

  @Field(() => Number, { nullable: true })
  @prop()
  followers?: number;

  @Field(() => [String], { nullable: true })
  @prop({ type: () => [String] })
  genres?: string[];

  @Field(() => [String], { nullable: true })
  @prop({ type: () => [String] })
  images?: string[];

  @Field(() => Number, { nullable: true })
  @prop()
  popularity?: number;

  @Field(() => String, { nullable: true })
  @prop()
  type?: string;
}

@ObjectType()
export class Album {
  @Field(() => String, { nullable: true })
  @prop()
  album_type?: string;

  @Field(() => String, { nullable: true })
  @prop()
  id?: string;

  @Field(() => String, { nullable: true })
  @prop()
  name?: string;

  @Field(() => [String], { nullable: true })
  @prop({ type: () => [String] })
  images?: string[];
}

@ObjectType()
export class TrackArtist {
  @Field(() => String, { nullable: true })
  @prop()
  id?: string;

  @Field(() => String, { nullable: true })
  @prop()
  name?: string;

  @Field(() => String, { nullable: true })
  @prop()
  type?: string;
}

@ObjectType()
export class Track {
  @Field(() => String)
  @prop()
  id: string;

  @Field(() => String)
  @prop()
  name: string;

  @Field(() => Number, { nullable: true })
  @prop()
  popularity?: number;

  @Field(() => Boolean, { nullable: true })
  @prop()
  is_local?: boolean;

  @Field(() => String, { nullable: true })
  @prop()
  preview_url?: string;

  @Field(() => String, { nullable: true })
  @prop()
  type?: string;

  @Field(() => Number, { nullable: true })
  @prop()
  track_number?: number;

  @Field(() => Album, { nullable: true })
  @prop({ _id: false })
  album?: Album;

  @Field(() => [TrackArtist], { nullable: true })
  @prop({ type: () => [TrackArtist], _id: false })
  artists?: TrackArtist[];
}

@ObjectType()
export class RecentlyPlayed extends Track {
  @Field(() => Date, { nullable: true })
  @prop()
  played_at?: Date;
}

// ============ USER SCHEMA ============
@index({ email: 1, username: 1, lastName: 1, firstName: 1 })
@ObjectType()
@ModelOptions({ options: { allowMixed: Severity.ALLOW } })
export class User {
  @Field(() => ID)
  _id: string;

  @Field(() => String, { nullable: true })
  @prop({ required: false, trim: true })
  username: string;

  @Field(() => String, { nullable: true })
  @prop({ required: false, trim: true })
  firstName: string;

  @Field(() => String, { nullable: true })
  @prop({ required: false, trim: true })
  lastName: string;

  @Field(() => String)
  @prop({ required: true, trim: true })
  spotifyId: string;

  @Field(() => String)
  @prop({ required: true, trim: true })
  email: string;

  @Field(() => String, { nullable: true })
  @prop({ required: false, trim: true })
  bio: string;

  @Field(() => Date, { nullable: true })
  @prop({ required: false })
  dob: Date;

  @Field(() => UserType, { nullable: true })
  @prop({ required: false })
  type?: UserType;

  @Field(() => Boolean, { nullable: true })
  @prop()
  isAccountVerified?: boolean;

  @Field(() => Boolean)
  @prop({ required: true, default: false })
  isProfileCompleted: boolean;

  @Field(() => String, { nullable: true })
  @prop()
  deviceDetails?: string;

  @Field(() => Boolean)
  @prop({ default: false })
  intro: boolean;

  @Field(() => String, { nullable: true })
  @prop({ required: false })
  instagramLink?: string;

  @Field(() => String, { nullable: false })
  @prop({ required: false })
  profilePic: string;

  @Field(() => FriendReqeust, { nullable: true, defaultValue: null })
  @prop({ ref: "FriendRequest", required: false })
  requestedTo: Ref<FriendReqeust>;

  @Field(() => Date, { nullable: true })
  @prop()
  lastLoggedIn?: Date;

  @Field(() => Date, { nullable: true })
  @prop()
  firstLoggedIn?: Date;

  @Field(() => Date, { nullable: true })
  @prop()
  lastLoggedOut?: Date;

  @Field(() => [Date], { nullable: true })
  @prop({ type: () => [Date] })
  delistDate?: mongoose.Types.Array<Date>;

  @Field(() => [Date], { nullable: true })
  @prop({ type: () => [Date] })
  relistDate?: mongoose.Types.Array<Date>;

  @Field(() => [Artist], { nullable: true })
  @prop({ type: () => [Artist], _id: false })
  topArtists?: Artist[];

  @Field(() => [Track], { nullable: true })
  @prop({ type: () => [Track], _id: false })
  topTracks?: Track[];

  @Field(() => [RecentlyPlayed], { nullable: true })
  @prop({ type: () => [RecentlyPlayed], _id: false })
  recentlyPlayed?: RecentlyPlayed[];

  @Field(() => [String], { nullable: true })
  @prop({ type: () => [String], default: [] })
  followers?: string[];

  @Field(() => [String], { nullable: true })
  @prop({ type: () => [String], default: [] })
  followings?: string[];

  @Field(() => [String], { nullable: true })
  @prop({ type: () => [String], default: [] })
  blockedByMe?: string[];

  @Field(() => Boolean, { nullable: true })
  @prop({ default: true })
  isPrivate?: boolean;

  @Field(() => String, { nullable: false })
  @prop({ required: true })
  spotifyAccessToken: string;

  @Field(() => String, { nullable: false })
  @prop({ required: true })
  spotifyRefreshToken: string;

  @Field(() => Date)
  @prop()
  createdAt: Date;

  @Field(() => Date)
  @prop()
  updatedAt: Date;
}

export const UserModel = getModelForClass(User, {
  schemaOptions: { timestamps: true },
});
