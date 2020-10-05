const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type ParentCompany {
    id: ID!
    name: String!
    politicalContributions: [PoliticalContributions!]
  }
  type PoliticalContributions {
    id: ID!
    cycle: Int
    orgId: String
    subsidiaryId: String
    subsidiary: String
    total: Int
    indivs: Int
    pacs: Int
    democrats: Int
    republicans: Int
    thirdParty: Int
  }
`;

module.exports = typeDefs;
