define(['logger', 'voc', 'underscore', 'data/Data', 'data/episode/VersionData'], function(Logger, Voc, _, Data, VersionData){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize Episode");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToUser, Voc.USER, Voc.hasEpisode);
        this.setIntegrityCheck(Voc.hasVersion, Voc.VERSION, Voc.belongsToEpisode);
    };
    m.LOG = Logger.get('EpisodeData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.EPISODE)){
            this.checkIntegrity(model, options);
            if( !model.isNew() ) {
                this.fetchVersions(model);
            }
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
    },
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
    },
    m.fetchVersions= function(episode) {
        var em = this;
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
                var resourceUris = [];
                var resources = [];
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
                    em.vie.entities.addOrUpdate(circles);

                    var entityUris = [];
                    var entities = version[Voc.hasEntity];
                    _.each(version[Voc.hasEntity], function(entity) {
                        // Check if resource is an object
                        // If it is, then extract and add to resources if needed
                        // Replace object with URI
                        var resource = entity[Voc.hasResource];
                        if ( typeof resource === 'object' ) {
                            if ( resourceUris.indexOf(resource[em.vie.Entity.prototype.idAttribute]) === -1 ) {
                                resources.push(resource);
                            }
                            entity[Voc.hasResource] = resource[em.vie.Entity.prototype.idAttribute];
                        }
                        entityUris.push(entity[em.vie.Entity.prototype.idAttribute]);
                        entity[Voc.belongsToVersion] = version[em.vie.Entity.prototype.idAttribute];
                        entity['@type'] = Voc.ORGAENTITY;
                    });
                    version[Voc.hasEntity] = entityUris;

                    em.vie.entities.addOrUpdate(entities);
                });
                em.vie.entities.addOrUpdate(versions);

                // Add or update resources if any
                if ( resources.length > 0 ) {
                    em.vie.entities.addOrUpdate(resources);
                }
            }
        );

    };
    m.newEpisode= function(user, fromVersion) {
        var newEpisode, attr = {};
        newEpisode = new this.vie.Entity();
        this.LOG.debug("newEpisode", newEpisode);
        newEpisode.set(Voc.label, "New Episode");
        newEpisode.set(Voc.belongsToUser, user.getSubject());
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
                    'service' : 'entityShare',
                    'data' : {
                        'entity' : modelUri,
                        'users' : users,
                        'comment' : comment
                    }
                }).using('sss').execute().success(function(){
                    that.LOG.debug('success entityShare');
                    defer.resolve(true);
                }).fail(function() {
                    that.LOG.debug('error entityShare');
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
                        'users' : users,
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
    return m;
});
