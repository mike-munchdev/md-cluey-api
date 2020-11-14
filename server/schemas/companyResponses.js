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
    userId: String
    companyId: String
    response: String
  }
  input AddCompanyResponseInput {
    userId: String
    companyId: String
    response: String
  }

  input DeleteCompanyResponseInput {
    responseId: String
  }

  input GetCompanyResponseInput {
    userId: String!
    companyId: String
  }
  type Query {
    getUserCompanyResponses(userId: String!): CompanyResponsesResolverResponse!
    getUserCompanyResponse(
      input: GetCompanyResponseInput!
    ): CompanyResponseResolverResponse!
  }

  type Mutation {
    updateCompanyResponseForUser(
      input: UserCompanyResponseInput!
    ): CompanyResponseResolverResponse!
    addCompanyResponseForUser(
      input: UserCompanyResponseInput!
    ): CompanyResponseResolverResponse!
    deleteCompanyResponse(
      input: DeleteCompanyResponseInput!
    ): CompanyResponseResolverResponse!
  }
`;

module.exports = typeDefs;
