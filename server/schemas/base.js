const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Mutation {
    importBases: GeneralResponse
    importProducts: GeneralResponse
    importProductTypes: GeneralResponse
    importParentCompanies: GeneralResponse
    importTags: GeneralResponse
    importBrands: GeneralResponse
  }
`;

module.exports = typeDefs;
