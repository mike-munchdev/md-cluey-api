const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Friend {
    id: ID!
    username: String
    firstName: String!
    lastName: String!
  }

  type Friendship {
    id: ID!
    requester: Friend
    recipient: Friend
    status: String!
  }

  type FriendshipsResolverResponse {
    ok: Boolean!
    friendships: [Friendship!]
    searchText: String
    error: Error
  }

  type FriendshipResolverResponse {
    ok: Boolean!
    friendship: Friendship
    searchText: String
    error: Error
  }

  input RequestFriendshipInput {
    requestorId: String!
    recipientId: String!
  }

  type Query {
    getUserFriends(userId: String!): FriendshipsResolverResponse!
    getFriendshipBetweenUsers(
      userId1: String!
      userId2: String!
    ): FriendshipResolverResponse!
  }
  type Mutation {
    requestFriendship(
      input: RequestFriendshipInput!
    ): FriendshipResolverResponse!
    deleteFriendshipById(friendshipId: String!): GeneralResolverResponse!
    acceptFriendship(friendshipId: String!): FriendshipResolverResponse!
    rejectFriendship(friendshipId: String!): FriendshipResolverResponse!
  }
`;

module.exports = typeDefs;
