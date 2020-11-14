const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type CompanyResponse {
    id: ID!
    user: User
    company: Company
    response: String!
  }

  type CompanyResponseResolverResponse {
    ok: Boolean!
    companyResponse: CompanyResponse!
    error: Error
  }

  type CompanyResponsesResolverResponse {
    ok: Boolean!
    companyResponses: [CompanyResponse!]
    error: Error
  }

  input UserCompanyResponseInput {
    responseId: String
    userId: String!
    companyId: String!
    response: String!
  }

  type Query {
    getUserCompanyResponses(userId: String!): CompanyResponsesResolverResponse!
  }

  type Mutation {
    updateCompanyResponseForUser(
      input: UserCompanyResponseInput!
    ): CompanyResponseResolverResponse!
  }
`;

module.exports = typeDefs;
