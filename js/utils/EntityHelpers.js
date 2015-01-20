define(['logger','jquery', 'backbone', 'underscore', 'voc', 'userParams'],
function (Logger, $, Backbone, _, Voc, userParams) {
    return {
        LOG: Logger.get('EntityHelpers'),
        getEpisodeVisibility: function(episode) {
            var circleTypes = episode.get(Voc.circleTypes);

            if ( !_.isEmpty(circleTypes) ) {
                circleTypes = ( _.isArray(circleTypes) ) ? circleTypes : [circleTypes];
                if ( _.indexOf(circleTypes, 'group') !== -1 ) {
                    return 'shared';
                }
            }

            return 'private';
        },
        getSharedWithNames: function(episode) {
            var sharedWithNames = [],
                sharedWith = episode.get(Voc.hasUsers);

            if ( !_.isEmpty(sharedWith) ) {
                sharedWith = ( _.isArray(sharedWith) ) ? sharedWith : [sharedWith];
                var currentUserUri = userParams.user;

                _.each(sharedWith, function(user) {
                    if ( user.getSubject() !== currentUserUri ) {
                        sharedWithNames.push(user.get(Voc.label));
                    }
                });
            }

            return sharedWithNames;
        }
    };
});
