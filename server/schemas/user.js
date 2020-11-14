const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type User {
    id: ID!
    email: String
    username: String
    firstName: String!
    middleName: String
    lastName: String!
    dob: Date
    city: String
    state: String
    gender: String
    googleId: String
    facebookId: String
    appleId: String
    friends: [String!]
    confirmToken: String
    isProfilePublic: Boolean
    isActive: Boolean
    createdAt: Date!
    mustResetPassword: Boolean
  }

  type UserResolverResponse {
    ok: Boolean!
    user: User
    error: Error
  }

  type UsersResolverResponse {
    ok: Boolean!
    users: [Friend!]
    error: Error
  }

  input CreateUserInput {
    email: String!
    firstName: String!
    middleName: String
    lastName: String!
    password: String!
    googleId: String
    facebookId: String
    appleId: String
  }

  input UpdateUserInput {
    userId: String!
    email: String
    username: String
    firstName: String
    middleName: String
    lastName: String
    googleId: String
    facebookId: String
    appleId: String
    isProfilePublic: Boolean
    isActive: Boolean
    dob: Date
    city: String
    state: String
    gender: String
  }

  input UpdateUserPasswordInput {
    userId: String!
    password: String!
    isReset: Boolean
  }

  input UserSignupInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String
    facebookId: String
    facebookAuthToken: String
    googleId: String
    googleAuthToken: String
    appleId: String
    appleAuthToken: String
    appleIdentityToken: String
  }

  input AddPushToken {
    userId: String!
    pushToken: String!
  }

  input RequestFriendshipInput {
    requestorId: String!
    recipientId: String!
  }

  input ActivateUserAccountInput {
    confirmToken: String!
    email: String!
  }

  type Query {
    getUserById(userId: String!): UserResolverResponse!

    getPublicAndActiveNonFriendsByName(
      name: String!
      exact: Boolean
    ): UsersResolverResponse!
  }

  type Mutation {
    createUser(input: CreateUserInput!): UserResolverResponse!
    updateUser(input: UpdateUserInput!): UserResolverResponse!
    updateUserPassword(input: UpdateUserPasswordInput!): UserResolverResponse!
    resetPassword(email: String!): GeneralResolverResponse!
    userSignup(input: UserSignupInput!): GeneralResolverResponse!
    addPushToken(input: AddPushToken!): UserResolverResponse!
    activateUserAccount(
      input: ActivateUserAccountInput!
    ): AuthenticationResolverResponse!
  }
`;

module.exports = typeDefs;
