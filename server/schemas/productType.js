const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type ProductType {
    id: ID!
    name: String!
    isActive: Boolean
  }

  type ProductTypesResolverResponse {
    ok: Boolean!
    productTypes: [ProductType!]
    error: Error
    searchText: String
  }
  type Query {
    getProductTypesByCategory(id: String!): ProductTypesResolverResponse
  }
`;

module.exports = typeDefs;
