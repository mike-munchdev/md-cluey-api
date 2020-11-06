const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  input MailInput {
    from: String!
    to: String!
  }
  type Mutation {
    sendMail(input: MailInput!): GeneralResolverResponse
  }
`;

module.exports = typeDefs;
