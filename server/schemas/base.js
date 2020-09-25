const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Mutation {
    importCategories: GeneralResponse
    importProducts: GeneralResponse
    importProductTypes: GeneralResponse
    importParentCompanies: GeneralResponse
    importTags: GeneralResponse
    importCompanies: GeneralResponse
  }
`;

module.exports = typeDefs;
