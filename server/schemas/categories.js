const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Category {
    id: ID!
    name: String!
    logoUrl: String
    isActive: Boolean
  }

  type CategoriesResponse {
    ok: Boolean!
    categories: [Category!]
    error: Error
  }
  type Query {
    getCategories: CategoriesResponse
  }
`;

module.exports = typeDefs;
