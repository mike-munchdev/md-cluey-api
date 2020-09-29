const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type User {
    id: ID!
    email: String
    firstName: String!
    middleName: String
    lastName: String!
    dob: Date
    city: String
    state: String
    gender: String
    googleId: String
    facebookId: String
    pushTokens: [String!]
    responses: [CompanyResponse!]
    confirmToken: String
    isProfilePublic: Boolean
    isActive: Boolean
    createdAt: Date!
  }

  type CompanyResponse {
    id: ID!
    companyId: ID!
    response: String!
  }

  type UserResponse {
    ok: Boolean!
    user: User
    error: Error
  }

  type CompanyResponseResponse {
    ok: Boolean!
    response: CompanyResponse!
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
  }

  input UpdateUserInput {
    userId: String!
    email: String
    firstName: String
    middleName: String
    lastName: String
    googleId: String
    facebookId: String
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
  }

  input AddPushToken {
    userId: String!
    pushToken: String!
  }

  input UserCompanyResponseInput {
    userId: String!
    companyId: String!
    response: String!
  }
  type Query {
    getUserById(userId: String!): UserResponse!
  }

  type Mutation {
    createUser(input: CreateUserInput!): UserResponse!
    updateUser(input: UpdateUserInput!): UserResponse!
    updateUserPassword(input: UpdateUserPasswordInput!): GeneralResponse!
    userSignup(input: UserSignupInput!): GeneralResponse!
    addPushToken(input: AddPushToken!): UserResponse!
    activateUserAccount(confirmToken: String!): GeneralResponse!
    updateCompanyResponseForUser(
      input: UserCompanyResponseInput!
    ): CompanyResponseResponse!
  }
`;

module.exports = typeDefs;
