const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type PoliticalContributions {
    id: ID!
    cycle: Int
    org_id: String
    org_name: String
    total: Int
    democrats: Int
    republicans: Int
    third_party: Int
    indivs: Int
    indivs_dems: Int
    indivs_repubs: Int
    indivs_third: Int
    pacs: Int
    pacs_dems: Int
    pacs_repubs: Int
    pacs_third: Int
  }
`;

module.exports = typeDefs;
