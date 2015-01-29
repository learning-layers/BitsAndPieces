define(['logger','jquery', 'backbone', 'underscore', 'voc', 'userParams'],
function (Logger, $, Backbone, _, Voc, userParams) {
    return {
        LOG: Logger.get('EntityHelpers'),
        isSharedEpisode: function(episode) {
            var circleTypes = episode.get(Voc.circleTypes);

            if ( !_.isEmpty(circleTypes) ) {
                circleTypes = ( _.isArray(circleTypes) ) ? circleTypes : [circleTypes];
                if ( _.indexOf(circleTypes, 'group') !== -1 ) {
                    return true;
                }
            }

            return false;
        },
        getEpisodeVisibility: function(episode) {
            if ( this.isSharedEpisode(episode) ) {
                return 'shared';
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
        },
        addBelongsToEpisode: function(entity, episode) {
            var belongsToEpisode = entity.get(Voc.belongsToEpisode),
                episodeSubject = episode.getSubject(),
                belongsToEpisodeUris = [];

            if ( _.isEmpty(belongsToEpisode) ) {
                entity.set(Voc.belongsToEpisode, episodeSubject);

                return true;
            } else {
                if ( !_.isArray(belongsToEpisode) ) {
                    belongsToEpisode = [belongsToEpisode];
                }

                _.each(belongsToEpisode, function(single) {
                    belongsToEpisodeUris.push(single.getSubject());
                });

                belongsToEpisodeUris.push(episodeSubject);
                entity.set(Voc.belongsToEpisode, belongsToEpisodeUris);

                return true;
            }

            return false;
        },
        removeBelongsToEpisode: function(entity, episode) {
            var belongsToEpisode = entity.get(Voc.belongsToEpisode),
                episodeSubject = episode.getSubject(),
                belongsToEpisodeUris = [];

            if ( _.isEmpty(belongsToEpisode) ) {
                return false;
            }

            if ( !_.isArray(belongsToEpisode) ) {
                belongsToEpisode = [belongsToEpisode];
            }

            _.each(belongsToEpisode, function(single) {
                belongsToEpisodeUris.push(single.getSubject());
            });

            var subjectIndex = _.indexOf(belongsToEpisodeUris, episodeSubject);
            if ( subjectIndex !== -1 ) {
                belongsToEpisodeUris.splice(subjectIndex, 1);
                entity.set(belongsToEpisodeUris);

                return true;
            }

            return false;
        }
    };
});
