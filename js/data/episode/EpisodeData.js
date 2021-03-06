define(['logger', 'voc', 'underscore', 'jquery', 'data/Data', 'data/episode/VersionData', 'userParams', 'utils/EntityHelpers'], function(Logger, Voc, _, $, Data, VersionData, userParams, EntityHelpers){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize Episode");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.USER, Voc.USER, Voc.hasEpisode);
        this.setIntegrityCheck(Voc.hasVersion, Voc.VERSION, Voc.belongsToEpisode);
    };
    m.LOG = Logger.get('EpisodeData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.EPISODE)){
            this.checkIntegrity(model, options);
            model.sync = this.sync;
        }
    };
    m.sync= function(method, model, options) {
        m.LOG.debug("sync entity " + model.getSubject() + " by " + method);
        if( !options ) options = {};

        if( method === 'create' ) {
            m.createEpisode(model, options);
        } else {
            this.vie.Entity.prototype.sync(method, model, options);
        }
    };
    m.createEpisode= function(model, options) {
        this.vie.save({
            service : 'learnEpCreate',
            data : {
                'label' : model.get(Voc.label),
                'description' : ''
            }
        }).to('sss').execute().success(function(savedEntityUri) {
            model.set(model.idAttribute, savedEntityUri, options);
            if(options.success) {
                options.success(savedEntityUri);
            }
        });
    };
    m.handleVersions= function(episode, versions) {
        var em = this;
        var resourceUris = [];
        var resources = [];
        var resourceUriTimes = {};
        // put uris of circles/entities into version
        // and create circle/entity entities
        _.each(versions, function(version) {
            version['@type'] = Voc.VERSION;
            var circleUris = [];
            var circles = version[Voc.hasCircle];
            _.each(version[Voc.hasCircle], function(circle) {
                circleUris.push(circle[em.vie.Entity.prototype.idAttribute]);
                circle[Voc.belongsToVersion] = version[em.vie.Entity.prototype.idAttribute];
                circle['@type'] = Voc.CIRCLE;
            });
            version[Voc.hasCircle] = circleUris;
            em.vie.entities.addOrUpdate(circles, {'overrideAttributes': true});

            var entityUris = [];
            var entities = version[Voc.hasEntity];
            _.each(version[Voc.hasEntity], function(entity) {
                // Check if resource is an object
                // If it is, then extract and add to resources if needed
                // Replace object with URI
                var resource = entity[Voc.hasResource];
                if ( _.isObject(resource) ) {
                    if ( resourceUris.indexOf(resource[em.vie.Entity.prototype.idAttribute]) === -1 ) {
                        resources.push(resource);
                        resourceUris.push(resource[em.vie.Entity.prototype.idAttribute]);
                        resourceUriTimes[resource[em.vie.Entity.prototype.idAttribute]] = 1;
                    } else {
                        resourceUriTimes[resource[em.vie.Entity.prototype.idAttribute]] += 1;
                    }
                    entity[Voc.hasResource] = resource[em.vie.Entity.prototype.idAttribute];
                }
                entityUris.push(entity[em.vie.Entity.prototype.idAttribute]);
                entity[Voc.belongsToVersion] = version[em.vie.Entity.prototype.idAttribute];
                entity['@type'] = Voc.ORGAENTITY;
            });
            version[Voc.hasEntity] = entityUris;

            em.vie.entities.addOrUpdate(entities, {'overrideAttributes': true});
        });
        em.vie.entities.addOrUpdate(versions, {'overrideAttributes': true});

        // Add or update resources if any
        if ( resources.length > 0 ) {
            resources = em.vie.entities.addOrUpdate(resources, {'overrideAttributes': true});

            // Set resource as belonging to an episode
            _.each(resources, function(resource) {
                EntityHelpers.removeBelongsToEpisode(resource, episode, true);
                EntityHelpers.addBelongsToEpisode(resource, episode, resourceUriTimes[resource.getSubject()]);
            });
        }
    };
    m.fetchVersions= function(episode) {
        var em = this,
            defer = $.Deferred();
        this.vie.load({
            'service' : 'learnEpVersionsGet',
            'data' : {
                'learnEp' : episode.getSubject(),
            }
        }).from('sss').execute().success(
            function(versions) {
                em.LOG.debug("success fetchVersions");
                em.LOG.debug("versions", versions);
                if( _.isEmpty(versions) ) {
                    em.LOG.debug("versions empty");
                    episode.set(Voc.hasVersion, VersionData.newVersion(episode).getSubject());
                    return;
                }

                em.handleVersions(episode, versions);

                defer.resolve(true);
            }
        ).fail(function(f) {
            em.LOG.debug('fail fetchVersions', f);
            defer.reject(f);
        });

        return defer.promise();
    };
    m.newEpisode= function(user, fromVersion, attributes) {
        var newEpisode, attr = {};
        newEpisode = new this.vie.Entity();
        this.LOG.debug("newEpisode", newEpisode);
        newEpisode.set(Voc.label, attributes.label ? attributes.label : "New Episode");
        newEpisode.set(Voc.description, attributes.description ? attributes.description : '');
        newEpisode.set(Voc.author, user.getSubject());
        newEpisode.set(Voc.USER, user.getSubject());
        newEpisode.set(Voc.hasUsers, [user.getSubject()]);
        newEpisode.set('@type', Voc.EPISODE);
        this.vie.entities.addOrUpdate(newEpisode);
        newVersion = VersionData.newVersion(newEpisode, fromVersion).getSubject();
        newEpisode.set(Voc.hasVersion, newVersion);

        newEpisode.save();

        return newEpisode;
    };
    m.getFirstVersion= function(episode) {
        return this.getVersions(episode).at(0);
    };
    m.getVersions= function(episode) {

        var coll = new this.vie.Collection([],{'vie':this.vie});
        coll.comparator = this.vie.namespaces.uri(Voc.timestamp);
        coll.add(episode.get(Voc.hasVersion));
        return coll;
    };
    m.shareEpisode = function(model, users, comment) {
        var that = this,
            defer = $.Deferred();
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.save({
                    'service' : 'circleEntityShare',
                    'data' : {
                        'entity' : modelUri,
                        'users' : users,
                        'comment' : comment
                    }
                }).using('sss').execute().success(function(){
                    that.LOG.debug('success circleEntityShare');
                    defer.resolve(true);
                }).fail(function() {
                    that.LOG.debug('error circleEntityShare');
                    defer.reject(false);
                });
            }
        );

        return defer.promise();
    };
    m.copyEpisode = function(model, users, exclude, comment) {
        var that = this,
            defer = $.Deferred();
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.save({
                    'service' : 'entityCopy',
                    'data' : {
                        'entity' : modelUri,
                        'forUsers' : users,
                        'entitiesToExclude' : exclude,
                        'comment' : comment
                    }
                }).using('sss').execute().success(function(){
                    that.LOG.debug('success entityCopy');
                    defer.resolve(true);
                }).fail(function() {
                    that.LOG.debug('error entityCopy');
                    defer.reject(false);
                });
            }
        );

        return defer.promise();
    };
    m.setEpisodeLock = function(model) {
        var that = this,
            defer = $.Deferred();
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.save({
                    'service' : 'learnEpLockSet',
                    'data' : {
                        'learnEp' : modelUri
                    }
                }).using('sss').execute().success(function(result){
                    that.LOG.debug('success learnEpLockSet', result);
                    defer.resolve(result);
                }).fail(function(f) {
                    that.LOG.debug('error learnEpLockSet', f);
                    defer.reject(f);
                });
            }
        );

        return defer.promise();
    };
    m.removeEpisodeLock = function(model) {
        var that = this,
            defer = $.Deferred();
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.save({
                    'service' : 'learnEpLockRemove',
                    'data' : {
                        'learnEp' : modelUri
                    }
                }).using('sss').execute().success(function(result){
                    that.LOG.debug('success learnEpLockRemove', result);
                    defer.resolve(result);
                }).fail(function(f) {
                    that.LOG.debug('error learnEpLockRemove', f);
                    defer.reject(f);
                });
            }
        );

        return defer.promise();
    };
    m.learnEpLockHold = function(model) {
        var that = this,
            defer = $.Deferred();
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.save({
                    'service' : 'learnEpsLockHold',
                    'data' : {
                        'learnEp' : modelUri
                    }
                }).using('sss').execute().success(function(result){
                    that.LOG.debug('success learnEpsLockHold', result);

                    var lockData = result[0];

                    if ( true === model.get(Voc.isLocked) && false === model.get(Voc.isLockedByUser) ) {
                        if ( false === lockData['locked'] ) {
                            model.set(Voc.lockReleasedByOtherTime, new Date().getTime());
                        }
                    }

                    if ( model.get(Voc.isLocked) !== lockData['locked'] ) {
                        model.set(Voc.isLocked, lockData['locked']);
                    }

                    if ( model.get(Voc.isLockedByUser) !== lockData['lockedByUser'] ) {
                        model.set(Voc.isLockedByUser, lockData['lockedByUser']);
                    }

                    if ( model.get(Voc.remainingTime) !== lockData['remainingTime'] ) {
                        model.set(Voc.remainingTime, lockData['remainingTime']);
                    }

                    defer.resolve(result, lockData);
                }).fail(function(f) {
                    that.LOG.debug('error learnEpLockHold', f);
                    defer.reject(f);
                });
            }
        );

        return defer.promise();
    };
    m.removeEpisode = function(model, options) {
        options = options || {};
        var that = this,
            defer = $.Deferred();
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.remove({
                    'service' : 'learnEpRemove',
                    'data' : {
                        'learnEp' : modelUri
                    }
                }).using('sss').execute().success(function(result) {
                    that.LOG.debug('success learnEpRemove', result);
                    defer.resolve(true);
                }).fail(function(f) {
                    that.LOG.debug('error learnEpRemove', f);
                    defer.reject(f);
                });
            }
        );

        return defer.promise();
    };
    m.getDiscussionsData = function(model) {
        var that = this,
            defer = $.Deferred();
        this.vie.onUrisReady(
            model.getSubject(),
            function(modelUri) {
                that.vie.load({
                    service : 'discsFilteredGet',
                    data : {
                        'targets' : [modelUri],
                        'setEntries' : true,
                        'setReads' : true
                    }
                }).to('sss').execute().success(function(discussions) {
                    that.LOG.debug('success discsGet', discussions);
                    var dataSet = {
                        discussions: 0,
                        unreadEntries: 0,
                        entries: 0
                    };
                    _.each(discussions, function(discussion) {
                        dataSet.discussions += 1;
                        if ( discussion.entries.length > 0 ) {
                            _.each(discussion.entries, function(entry) {
                                dataSet.entries +=1;
                                if ( !entry.read && entry.author.id !== userParams.user ) {
                                    dataSet.unreadEntries += 1;
                                }
                            });
                        }
                    });
                    defer.resolve(dataSet);
                }).fail(function(f) {
                    that.LOG.debug('error discsGet', f);
                    defer.reject(f);
                });
            }
        );

        return defer.promise();
    };
    return m;
});
