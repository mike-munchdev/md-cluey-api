const { gql } = require('apollo-server-express');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type SystemNotification {
    id: ID!
    message: String
    notificationType: String
    linkId: String
    isRead: Boolean
    createdAt: Date
    updatedAt: Date
  }

  type SystemNotificationsResolverResponse {
    ok: Boolean!
    systemNotifications: [SystemNotification!]
    error: Error
  }
  type Query {
    getUserSystemNotifications(
      userId: String!
    ): SystemNotificationsResolverResponse!
  }
`;

module.exports = typeDefs;
