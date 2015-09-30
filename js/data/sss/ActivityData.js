define(['logger', 'voc', 'underscore', 'jquery', 'data/Data', 'userParams' ], function(Logger, Voc, _, $, Data, userParams){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize ActivityData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.author, Voc.USER);
    };
    m.LOG = Logger.get('ActivityData');
    /**
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.ACTIVITY)){
            this.checkIntegrity(model, options);
            // TODO Not sure about this one
            if ( model.has(Voc.author) ) {
                this.initUser(model);
            }
            // TODO Not sure about this one
            model.on('change:'+this.vie.namespaces.uri(Voc.author), this.initUser, this);
        }
    };
    m.initUser = function(model, value, options) {
        var user = model.get(Voc.author);
        if( user.isEntity ) {
            user.fetch();
        }
    };
    m.getActivities = function(data) {
        var that = this,
            defer = $.Deferred();

        data = data || {};

        this.vie.onUrisReady(
            function() {
                that.vie.analyze({
                    'service' : 'activitiesGet',
                    'data' : data
                }).using('sss').execute().success(function(activities, passThrough){
                    that.LOG.debug('activitiesGet success', activities, passThrough);

                    var suitableActivities = [];

                    if ( !_.isEmpty(activities) ) {
                        var combinedUrisToBeAdded = [];
                            combinedToBeAdded = [];

                        _.each(activities, function(activity) {
                            // Check if acceptable activity
                            if ( activity[Voc.author] === userParams.user ) {
                                if ( activity[Voc.hasActivityType] !== 'shareLearnEpWithUser' && activity[Voc.hasActivityType] !== 'copyLearnEpForUsers' && activity[Voc.hasActivityType] !== 'messageSend' ) {
                                    return;
                                }
                            } else {
                                if ( activity[Voc.hasActivityType] === 'messageSend' ) {
                                    return;
                                }
                            }

                            suitableActivities.push(activity);

                            var users = activity[Voc.hasUsers];
                            var entities = activity[Voc.hasEntities];
                            var containedEntity = activity[Voc.hasResource];

                            if ( !_.isEmpty(users) ) {
                                var userUris = [];

                                _.each(users, function(user) {
                                    var userUri = user[that.vie.Entity.prototype.idAttribute];

                                    userUris.push(userUri);
                                    
                                    if ( _.indexOf(combinedUrisToBeAdded, userUri) === -1 ) {
                                        combinedUrisToBeAdded.push(userUri);
                                        combinedToBeAdded.push(user);
                                    }
                                });
                                activity[Voc.hasUsers] = userUris;
                            }

                            if ( !_.isEmpty(entities) ) {
                                var entityUris = [];

                                _.each(entities, function(entity) {
                                    var entityUri = entity[that.vie.Entity.prototype.idAttribute];

                                    // IMPORATNT
                                    // This fixes a problem of empty attributes
                                    // overwriting the loaded meaningful values
                                    that.__fixEpisodeByRemovingEmptyAttributes(entity);

                                    entityUris.push(entityUri);

                                    if ( _.indexOf(combinedUrisToBeAdded, entityUri) === -1 ) {
                                        combinedUrisToBeAdded.push(entityUri);
                                        combinedToBeAdded.push(entity);
                                    }
                                });
                                activity[Voc.hasEntities] = entityUris;
                            }

                            if ( !_.isEmpty(containedEntity) ) {

                                // IMPORATNT
                                // This fixes a problem of empty attributes
                                // overwriting the loaded meaningful values
                                that.__fixEpisodeByRemovingEmptyAttributes(containedEntity);

                                var entityUri = containedEntity[that.vie.Entity.prototype.idAttribute];

                                if ( _.indexOf(combinedUrisToBeAdded, entityUri) === -1 ) {
                                    combinedUrisToBeAdded.push(entityUri);
                                    combinedToBeAdded.push(containedEntity);
                                }
                                activity[Voc.hasResource] = entityUri;
                            }
                        });

                        if ( !_.isEmpty(combinedToBeAdded) ) {
                            that.vie.entities.addOrUpdate(combinedToBeAdded, {'overrideAttributes': true});
                        }

                        suitableActivities = that.vie.entities.addOrUpdate(suitableActivities, {'overrideAttributes': true});
                    }

                    defer.resolve(suitableActivities, passThrough);
                }).fail(function(f) {
                    that.LOG.debug('activitiesGet fail', f);
                    defer.reject(f);
                });
            }
        );
        return defer.promise();
    };
    m.__fixEpisodeByRemovingEmptyAttributes = function(entity) {
        if (entity['@type'] === Voc.EPISODE ) {
            for ( var key in entity ) {
                if ( _.isEmpty(entity[key]) ) {
                    delete entity[key];
                } else if ( key === Voc.hasUsers ) {
                    delete entity[key];
                }
            }
        }
    };

    return m;
});
