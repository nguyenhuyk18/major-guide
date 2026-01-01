export const GRPC_MESSAGE_AUTHORIZER = {
    'VERIFY_TOKEN_USER': {
        service_name: 'AuthorizerService',
        method: 'verifyUserToken'
    },


}


export const GRPC_MESSAGE_USER_ACCESS = {
    'GET_USER_BY_ID': {
        service_name: 'UserAccessService',
        method: 'findUserById'
    }
}