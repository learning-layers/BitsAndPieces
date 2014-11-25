define(['logger','jquery', 'backbone', 'underscore', 'userParams',
        'data/episode/UserData'],
function (Logger, $, Backbone, _, userParams, UserData) {
    return {
        LOG: Logger.get('SearchHelper'),
        getSearchableUsers: function() {
            return UserData.getSearchableUsers();
        },
        userAutocompleteSource: function(request, response) {
            var pattern = new RegExp(request.term, 'i');

            response(
                _.filter(UserData.getSearchableUsers(), function(user) {
                    return pattern.test(user.label);
               })
            ); 
        }
    };
});