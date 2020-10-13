const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Friend {
    id: ID!
    username: String!
    firstName: String!
    lastName: String!
  }

  type Friendship {
    id: ID!
    requester: Friend
    recipient: Friend
    status: String!
  }

  type FriendshipsResponse {
    ok: Boolean!
    friendships: [Friendship!]
    searchText: String
    error: Error
  }

  type FriendshipResponse {
    ok: Boolean!
    friendship: Friendship!
    searchText: String
    error: Error
  }
`;

module.exports = typeDefs;
