const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Company {
    id: ID!
    name: String!

    brandUrl: String
    brandLogoUrl: String
  }

  type CompaniesResponse {
    ok: Boolean!
    companies: [Company!]
    error: Error
    searchText: String
  }
  type Query {
    getCompaniesByName(name: String!, exact: Boolean): CompaniesResponse
    getCompaniesByCategory(id: String!): CompaniesResponse
  }
`;

module.exports = typeDefs;
