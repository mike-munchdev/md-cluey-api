const {
  AuthenticationError,
  SchemaError,
  ForbiddenError,
  ApolloError,
} = require('apollo-server-express');
const { validateToken, findUserByToken } = require('./authentication');

module.exports = async (args) => {
  try {
    let user;

    if (args.req) {
      const { query } = args.req.body;

      if (query) {
        const arr = query.split('\n');
        const req = args.req;
        const token = req.header('x-auth');
        const version = req.header('version');

        if (version !== process.env.API_VERSION)
          throw new AuthenticationError(
            `Version mismatch. Please update your application. Your Version:(${version}). Current Version:(${process.env.API_VERSION})`
          );

        // admin pass-through
        if (token === process.env.PASSTHROUGH_TOKEN)
          return { req, res: args.res, isAdmin: true };

        if (arr.length)
          if (
            arr[1].includes('getUserToken(') ||
            arr[1].includes('userSignup(') ||
            arr[1].includes('activateUserAccount(') ||
            arr[1].includes('resetPassword(') ||
            arr[1].includes('getCategories ') ||
            arr[1].includes('getProductTypesByCategory(') ||
            arr[1].includes('getCompaniesByProductType(') ||
            arr[1].includes('getCompanyById(') ||
            arr[0].includes('query IntrospectionQuery {')
          ) {
            return { req, res: args.res };
          } else {
            if (!token) throw new ForbiddenError('missing token');

            const decoded = await validateToken(token, process.env.JWT_SECRET);

            user = await findUserByToken(decoded);

            if (!user) {
              const ip =
                req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.ips;
              const errorMessage = `#badtoken User with token ${token} not found. IP: ${ip}`;

              throw new ForbiddenError(errorMessage);
            }

            return { user, req: args.req, res: args.res };
          }
      } else {
        throw new SchemaError('Schema invalid');
      }
    } else {
      const isAdmin = args.connection.context.isAdmin;
      const user = args.connection.context.user;
      return { user, isAdmin };
    }
  } catch (e) {
    throw e;
  }
};
