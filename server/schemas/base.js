const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Mutation {
    importAll: GeneralResolverResponse
    importCategories: GeneralResolverResponse
    importProducts: GeneralResolverResponse
    importProductTypes: GeneralResolverResponse
    importParentCompanies: GeneralResolverResponse
    importTags: GeneralResolverResponse
    importCompanies: GeneralResolverResponse
    importLogos: GeneralResolverResponse
    importPoliticalContributionData: GeneralResolverResponse
    getMissingLogos: GeneralResolverResponse
  }
`;

module.exports = typeDefs;
