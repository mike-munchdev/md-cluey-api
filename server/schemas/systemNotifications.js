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

  type SystemNotificationResolverResponse {
    ok: Boolean!
    notification: SystemNotification
    error: Error
  }
  type SystemNotificationsResolverResponse {
    ok: Boolean!
    notifications: [SystemNotification!]
    error: Error
  }

  input UpdateNotificationInput {
    notificationId: String!
    isRead: Boolean
  }

  type Query {
    getUserSystemNotifications(
      userId: String!
    ): SystemNotificationsResolverResponse!
  }
  type Mutation {
    addTestNotification(userId: String!): SystemNotificationResolverResponse!
    updateNotification(
      input: UpdateNotificationInput!
    ): SystemNotificationResolverResponse!
  }
`;

module.exports = typeDefs;
