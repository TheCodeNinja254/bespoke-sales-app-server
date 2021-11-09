const { gql } = require('apollo-server-koa');

const typeDefs = gql`
    scalar Date

#    scalar Upload
    
    enum UserRoles {
      superAdmin
      admin
      member
    }
    
     enum roles {
      Developer
      Admin
      Sales
    }
    
    enum ActiveStatus {
      active
      inactive
    }
    
    enum Visibility {
       Public
       Private
       Draft 
    }
    
    type Query {
       getSignedInUser: UserDataDetails
       getRegions: RegionsData
       getZones(regionId: String!, retrieveBy: String!): ZonesData
       getRouters(roundTime:Int!): RoutersData
       getRoutersDeliveryStatus(routerSerial: String!): RoutersDeliveryData
       getEstates(zoneId: Int!, retrieveByZone: String, pageSize: Int, pageNo: Int): EstatesData
       getSingleEstates(estateId: Int!): SingleEstatesData
       getMySales(pageSize: Int!, page: Int!, searchParam: String, searchValue: String): SalesData
       getAgencies: AgenciesData
       getUsers(agencyId: String!): UsersDataInfo
       getAllUsers(agencyId: String!): UsersDataInfo
    }
    
    type Mutation {
       createUser(input: UserDetails!): Result!
       editUser(input: UserDetails!): Result!
       createCustomer(input: CustomerDetails!): Result!
       updateRouterDelivery(input: RouterUpdateDetails!): Result!
       updateSimex(input: SimexUpdateDetails!): Result!
       updateCustomerMsisdn(input: CustomerMSISDNDetails!): Result!
       updateCustomerRouter(input: CustomerRouterDetails!): Result!
       simReplacement(input: SimReplacementDetails!): Result!
       uploadRouters(input: RoutersUploadData!): Result!
       uploadSingleRouter(input: SingleRouterUploadData!): Result!
       uploadRoutersAdmin(input: RoutersUploadData!): Result!
       uploadEstates(input: EstatesUploadData!): Result!
       addEstate(input: AddEstateData!): Result!
       createAgency(input: AgencyData!): Result!
       generateOTP(email: String!): Result!
       resetPassword(username: String!, passphrase: String!, otp: String!): Result!
       updateEstate(input: UpdateEstateData!): Result!
       signIn(email: String!, password: String!): Result!
       updateUserStatus(status: String!, userName: String!, msisdn: String, emailAddress: String): Result!
       changePassword(username: String!, newPassword: String!, currentPassword: String): Result!
       validateOTP(otp: String!): Result!
       routerTransfer(agencyId: Int!, serialNumber: String!): Result!
       deleteRegRecord(registrationId: Int!, reason: String!): Result!
       signOut: Boolean!
    }
   
    input UserDetails {
         firstName: String!
         lastName: String!
         userMsisdn: String!
         docType: String
         docNumber: String
         emailAddress: String
         userRole: String!
         passedAgencyId: String
         createdBy: String
         status: String
         userName: String
         fullName: String
         id: Int
    }
    
     input CustomerDetails {
      firstName: String!
      middleName: String
      lastName: String
      sponsorMsisdn: String!
      documentNumber: String!
      docTypeId: Int!
      emailAddress: String!
      benMsisdnSerialNumber: String
      houseNumber: String!
      productId: String!
      createdBy: String
      estateId: Int
      routerSerial: String
      dateOfBirth: String!
      simexSerialNumber: String
      routerSerialNumber: String
    }     
    
    input RouterUpdateDetails {
        routerSerial: String!
        statusId: Int
    }
    
    input SimexUpdateDetails {
        registrationId: Int!
        routerSerialNumber: String!
        simexSerialNumber: String!
    }
    
    input SimReplacementDetails {
        msisdn: String!
        iccid: String!
    }

    input CustomerMSISDNDetails {
        registrationId: Int!
        sponsorMsisdn: String!
    }

    input CustomerRouterDetails {
        registrationId: Int!
        serialNumber: String!
    }
    
    input RoutersUploadData {
       routersFile: Upload!
       agencyId: Int
       routerPrice: String
    }
    
    input SingleRouterUploadData {
       routerSerialNumber: String!
       agencyId: Int
       routerModel: String!
       routerPrice: String
    }
    
    input EstatesUploadData {
       estatesFile: Upload!
       regionId: String!
       zoneId: String!
       status: String!
    }   
    
    input AddEstateData {
        estateName: String!
        regionId: String!
        status: String!
        contractorAgencyId: String
        oltName: String
        noOfHouses: String
        occupancy: String
        coordinates: String
        houseNumbers: String
        zoneId: String!
        tierNumber: String
    }  
    
        input UpdateEstateData {
        id: Int!
        estateName: String!
        regionId: String!
        status: String!
        contractorAgencyId: String
        oltName: String
        noOfHouses: String
        occupancy: String
        coordinates: String
        houseNumbers: String
        zoneId: String!
        tierNumber: String
    }  
    
    type UserDataDetails {
      user: UserData
    }
    
    type UserData {
      id: Int!
      firstName: String
      fullname: String
      userName: String
      msisdn: String
      email: String
      lastName: String
      docNumber: String
      createdBy: String
      createdOn: String
      status: Int
      role: String
      agencyId: String
      agencyName: String
      userCategory: String!
    }
    
    type RegionsData {
     getRegionsStatus: Boolean!
     regions: [Regions]
    }   
    
    type EstatesData {
     getEstatesStatus: Boolean!
     getEstatesCount: Int
     estates: [Estates]
    }
    
    type SingleEstatesData {
     getEstatesStatus: Boolean!
     getEstatesCount: Int
     estates: Estates
    }
    
    type ZonesData {
     getZonesStatus: Boolean!
     zones: [Zones]
    }    
    
    type RoutersData {
     getRouterStatus: Boolean!
     routers: [Routers]
    }  
    
    type RoutersDeliveryData {
     getRoutersDeliveryStatus: Boolean!
     deliveryStatus: String
    }    
    
    type SalesData {
     getSalesDataStatus: Boolean!
     getSalesCount: Int!
     sales: [Sale]
    }
    
     type UsersDataInfo {
     getUsersStatus: Boolean!
     getUsersCount: Int
     users: [UserData]
    }
    
    type AgenciesData {
     getAgenciesStatus: Boolean!
     agencies: [Agency]
    }
    
    type Regions {
      regionId: String
      regionName: String
    } 
    
    type Estates {
      estateId: Int
      id: Int
      estateName: String!
      regionId: Int
      status: String
      contractorAgencyId: String
      oltName: String
      noOfHouses: String
      occupancy: String
      coordinates: String
      houseNumbers: String
      zoneId: Int
      tierNumber: String
      createdBy: String
      createdAt: String
      updatedAt: String
      deletedAt: String
    }
    
    type Routers {
      routerSerialNumber: String
    }   
    
    type Sale {
      registrationId: Int
      sponsorMsisdn: String
      routerSerialNumber: String
      paymentStatus: Int
      productName: String
      routerDeliveryStatus: Int
      saleDate: Date
      activationDate: Date
      paymmentDate: Date
      firstName: String
      lastName: String
      createdBy: String
      estateName: String
      houseNumber: String
      fullName: String
      beneficiaryMsisdn: String
    }    
    
     type Agency {
        agencyId: Int
        agencyName: String!
        agencyType: String
        msisdn: String
        dealerCode: String
        payBill: String
        bankName: String
        bankAccount: String
        createdBy: String
        bankAccountNumber: Int
    }  
    
    input AgencyData {
        agencyName: String!
        agencyType: String
        msisdn: String
        dealerCode: String
        payBill: String
        bankName: String
        bankAccountNumber: String
    } 
    
    type Zones {
      id: Int
      zoneName: String
      assignedDealerId: String
      status: Int
      createdAt: String
    }
    
    type Result {
      status: Boolean!
      message: String!
      role: String
    }
`;

module.exports = typeDefs;
