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
        addBelongsToEpisode: function(entity, episode, addTimes) {
            var belongsToEpisode = entity.get(Voc.belongsToEpisode),
                episodeSubject = episode.getSubject(),
                belongsToEpisodeUris = [];

            if ( !addTimes ) {
                addTimes = 1;
            }

            var addedEpisodeSubjects = [];
            if ( addTimes === 1 ) {
                addedEpisodeSubjects.push(episodeSubject);
            } else {
                for ( var i = 0; i < addTimes; i++ ) {
                    addedEpisodeSubjects.push(episodeSubject);
                }
            }

            if ( _.isEmpty(belongsToEpisode) ) {
                entity.set(Voc.belongsToEpisode, addedEpisodeSubjects);

                return true;
            } else {
                if ( !_.isArray(belongsToEpisode) ) {
                    belongsToEpisode = [belongsToEpisode];
                }

                _.each(belongsToEpisode, function(single) {
                    belongsToEpisodeUris.push(single.getSubject());
                });

                entity.set(Voc.belongsToEpisode, belongsToEpisodeUris.concat(addedEpisodeSubjects));

                return true;
            }

            return false;
        },
        removeBelongsToEpisode: function(entity, episode, removeAll) {
            var belongsToEpisode = entity.get(Voc.belongsToEpisode),
                episodeSubject = episode.getSubject(),
                belongsToEpisodeUris = [];

            if ( !removeAll ) {
                removeAll = false;
            }

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
                if ( removeAll === true ) {
                    belongsToEpisodeUris = _.without(belongsToEpisodeUris, episodeSubject);
                } else {
                    belongsToEpisodeUris.splice(subjectIndex, 1);
                }

                entity.set(Voc.belongsToEpisode, belongsToEpisodeUris);

                return true;
            }

            return false;
        }
    };
});
