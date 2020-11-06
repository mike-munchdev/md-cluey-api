const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Mutation {
    adminTransferCompanyResponses: GeneralResolverResponse
  }
`;

module.exports = typeDefs;
