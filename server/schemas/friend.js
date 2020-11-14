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
    status: String
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
    notification: SystemNotification
    searchText: String
    error: Error
  }

  input RequestFriendshipInput {
    requestorId: String!
    recipientId: String!
  }

  input AcceptFriendshipInput {
    friendshipId: String!
    notificationId: String
  }
  input RejectFriendshipInput {
    friendshipId: String!
    notificationId: String
  }
  input DeleteFriendshipByIdInput {
    friendshipId: String!
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
    deleteFriendshipById(
      input: DeleteFriendshipByIdInput!
    ): FriendshipResolverResponse!
    acceptFriendship(input: AcceptFriendshipInput!): FriendshipResolverResponse!
    rejectFriendship(input: RejectFriendshipInput!): FriendshipResolverResponse!
  }
`;

module.exports = typeDefs;
