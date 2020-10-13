const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type ParentCompany {
    id: ID!
    name: String!
  }
`;

module.exports = typeDefs;
