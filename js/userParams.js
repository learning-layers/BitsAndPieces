define(['UserAuth'],
function (UserAuth) {
    return {
        user : UserAuth.getUser(),
        userKey : UserAuth.getUserKey(),
        isAuthenticated: UserAuth.isAuthenticated()
    }
});
