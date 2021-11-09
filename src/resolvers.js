const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

module.exports = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value); // value from the client
    },
    serialize(value) {
      return value; // value sent to the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10); // ast value is always in string format
      }
      return null;
    },
  }),
  roles: {
    Developer: 0,
    Admin: 1,
    Sales: 2,
  },
  ActiveStatus: {
    active: 1,
    inactive: 0,
  },
  Query: {
    getSignedInUser: (_, __, { dataSources }) => dataSources.usersSession.getSignedInUser(),
    getRegions: (_, args, { dataSources }) => dataSources.locations.getRegions(),
    getEstates: (_, args, { dataSources }) => dataSources.locations.getEstates(args),
    getSingleEstates: (_, args, { dataSources }) => dataSources.locations.getSingleEstates(args),
    getZones: (_, args, { dataSources }) => dataSources.locations.getZones(args),
    getRouters: (_, args, { dataSources }) => dataSources.routers.getRouters(),
    getRoutersDeliveryStatus: (_, args, { dataSources }) => dataSources.routers.getRoutersDeliveryStatus(args),
    getMySales: (_, args, { dataSources }) => dataSources.customers.getMySales(args),
    getAgencies: (_, args, { dataSources }) => dataSources.agencies.getAgencies(),
    getUsers: (_, __, { dataSources }) => dataSources.manageUsers.getUsers(),
    getAllUsers: (_, args, { dataSources }) => dataSources.manageUsers.getAllUsers(args),
  },
  Mutation: {
    signIn: (_, args, { dataSources }) => dataSources.usersSession.signIn(args),
    updateUserStatus: (_, args, { dataSources }) => dataSources.manageUsers.updateUserStatus(args),
    changePassword: (_, args, { dataSources }) => dataSources.manageUsers.changePassword(args),
    createUser: (_, args, { dataSources }) => dataSources.manageUsers.createUser(args),
    editUser: (_, args, { dataSources }) => dataSources.editUserInfo.editUser(args),
    validateOTP: (_, args, { dataSources }) => dataSources.authentication.validateOTP(args),
    signOut: (_, __, { dataSources }) => dataSources.usersSession.signOut(),
    generateOTP: (_, args, { dataSources }) => dataSources.passwordManagement.generateOTP(args),
    resetPassword: (_, args, { dataSources }) => dataSources.passwordManagement.resetPassword(args),
    createCustomer: (_, args, { dataSources }) => dataSources.customers.createCustomer(args),
    simReplacement: (_, args, { dataSources }) => dataSources.simReplacement.simReplacement(args),
    updateRouterDelivery: (_, args, { dataSources }) => dataSources.routers.updateRouterDelivery(args),
    updateSimex: (_, args, { dataSources }) => dataSources.routers.updateSimex(args),
    updateCustomerRouter: (_, args, { dataSources }) => dataSources.customerInfo.updateCustomerRouter(args),
    updateCustomerMsisdn: (_, args, { dataSources }) => dataSources.customerInfo.updateCustomerMsisdn(args),
    uploadRouters: (_, args, { dataSources }) => dataSources.routers.uploadRouters(args),
    uploadSingleRouter: (_, args, { dataSources }) => dataSources.routers.uploadSingleRouter(args),
    uploadRoutersAdmin: (_, args, { dataSources }) => dataSources.routers.uploadRoutersAdmin(args),
    uploadEstates: (_, args, { dataSources }) => dataSources.locations.uploadEstates(args),
    addEstate: (_, args, { dataSources }) => dataSources.locations.addEstate(args),
    createAgency: (_, args, { dataSources }) => dataSources.agencies.createAgency(args),
    updateEstate: (_, args, { dataSources }) => dataSources.locations.updateEstate(args),
    routerTransfer: (_, args, { dataSources }) => dataSources.routersTransfer.routerTransfer(args),
    deleteRegRecord: (_, args, { dataSources }) => dataSources.customerInfo.deleteRegRecord(args),
  },
};
