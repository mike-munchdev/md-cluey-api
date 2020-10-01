const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Mutation {
    importAll: GeneralResponse
    importCategories: GeneralResponse
    importProducts: GeneralResponse
    importProductTypes: GeneralResponse
    importParentCompanies: GeneralResponse
    importTags: GeneralResponse
    importCompanies: GeneralResponse
    importLogos: GeneralResponse
  }
`;

module.exports = typeDefs;
