define(['logger', 'voc', 'underscore', 'jquery', 'data/Data', 'data/episode/EpisodeData', 'userParams', 'view/sss/EntityView'], function(Logger, Voc, _, $, Data, EpisodeData, userParams, EntityView){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize UserData");
        this.LOG.debug('this', this);
        this.LOG.debug('Data', Data);
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.hasEpisode, Voc.EPISODE, Voc.belongsToUser);
        this.setIntegrityCheck(Voc.currentVersion, Voc.VERSION);
        this.fetchAllUsers();
        this.recommendedTags = [];
        this.fetchRecommendedTags();
    };
    m.LOG = Logger.get('UserData');
    /** 
     * Filters user entities from added entities to vie.entities
     */
    m.filter= function(user, collection, options) {
        if( user.isof(Voc.USER) ) {
            this.LOG.debug('user added', user);
            this.checkIntegrity(user, options);
            if( !user.isNew() ) {
                // Only fetch additional data for current user
                if ( user === this.vie.entities.get(userParams.user) ) {
                    this.fetchEpisodes(user);
                    this.fetchCurrentVersion(user);
                    this.fetchRange(user);
                }
            } 
            user.sync = this.sync;
        }
    };
    m.sync= function(method, model, options) {
        m.LOG.debug("sync entity " + model.getSubject() + " by " + method);
        if( !options ) options = {};

        if( method === 'update' ) {
            var changed = model.changedAttributes();
            m.LOG.debug('changed', changed );
            if ( changed ) {
                m.LOG.debug('changed keys length', _.keys(changed).length );
                var currentVersionKey = this.vie.namespaces.uri(Voc.currentVersion);
                if( changed[currentVersionKey] ) {
                    m.saveCurrentVersion(model, options);
                }
                if( _.keys(changed).length > 1 ) {
                    // handle rest of changed attributes by generic sync
                    this.vie.Entity.prototype.sync(method, model, options);
                }
            }
        } else {
            this.vie.Entity.prototype.sync(method, model, options);
        }
    },
    m.saveCurrentVersion = function(model, options) {
        var currentVersion = model.get(Voc.currentVersion);
        var that = this;
        this.vie.onUrisReady(
            version.getSubject(),
            function(versionUri) {
                that.vie.save({
                    service : 'learnEpVersionCurrentSet',
                    data : {
                        'learnEpVersion' : versionUri
                    }
                }).to('sss').execute().success(function(result) {
                    if( options.success) {
                        options.success(result);
                    }
                });
            }
        );
    },
    m.fetchCurrentVersion = function(user) {
        this.vie.load({
            'service' : 'learnEpVersionCurrentGet'
        }).from('sss').execute().success(function(version) {
            user.set(Voc.currentVersion, version.id);
        });
    };
    /**
     * Fetch the episodes belonging to the user.
     * @params VIE.Entity user
     */
    m.fetchEpisodes= function(user) {
        // load Episodes of User
        var v = this.vie;
        var that = this;
        this.vie.load({
            'service': 'learnEpsGet'
        }).from('sss').execute().success(
            function(episodes) {
                that.LOG.debug("success fetchEpisodes");
                that.LOG.debug("episodes", episodes);
                if( _.isEmpty(episodes) ) {
                    user.set(Voc.hasEpisode, false);
                    return;
                }
                _.each(episodes, function(episode) {
                    episode['@type'] = Voc.EPISODE;
                });
                v.entities.addOrUpdate(episodes);
            }
        );
    };
    m.fetchAllUsers = function() {
        var that = this;
        this.vie.load({
            'service' : 'userAll',
        }).using('sss').execute().success(function(users){
            that.LOG.debug('user entities', users);
            that.allUsers = users;
        });
    };
    m.getAllUsers = function() {
        return _.clone(this.allUsers);
    };
    m.getSearchableUsers = function() {
        // TODO It might be a good idea to make the run only once
        // And then serve data from cache
        var searchableUsers = [];
        _.each(this.allUsers, function(user) {
            // Make sure to remove the currently logged in user
            // Sharing with self is not allowed
            // Also remove 'system' user
            if ( user.id !== userParams.user && user.id.indexOf('user/system', user.id.length - 'user/system'.length) === -1 ) {
                searchableUsers.push({
                    label: user.label,
                    value: user.id
                });
            }
        });

        return searchableUsers;
    };
    m.fetchRange= function( user, start, end, callbacks ) {
        var margin = 600000;
        var now = new Date((new Date()).getTime() + margin);
        if( !start ) start = new Date(0);
        if( !end ) end = now;
        if( typeof start !== Date ) start = new Date(start);
        if( typeof end !== Date ) end = new Date(end);
        // start and end of user store the timestamps of the last fetch
        var lastStart = user.get(Voc.start);
        var lastEnd = user.get(Voc.end);
        if( lastStart && start >= lastStart )  {
            start = new Date(lastEnd.getTime() - margin);
        }
        if( end > now ) end = now;
        if( start > end ) return;

        this.LOG.debug("fetchRange:", start, ";", end);
        // Fetch entities currently visible
        var forUser = user.getSubject();
        var that = this;
        this.vie.load({
            'service' : 'uEsGet',
            'data' : {
                'startTime' : start.getTime(),
                'endTime' : end.getTime(),
                'forUser' : forUser
            }
        }).from('sss').execute().success(
            function(entities) {
                // store the timestamps of this fetch
                if ( lastStart === undefined || start < lastStart ) user.set(Voc.start, start);
                if ( lastEnd === undefined || end > lastEnd ) user.set(Voc.end, end);
                that.LOG.debug('success fetchRange: ', _.clone(entities), 'user: ', user);
                var keys = _.keys(EntityView.prototype.icons);
                entities = _.filter(entities, function(entity) {
                    return _.contains( keys, entity['@type'] );
                });
                that.LOG.debug('filtered entities', entities);
                entities = that.vie.entities.addOrUpdate(entities, {'overrideAttributes': true});

                var currentEvents = user.get(Voc.hasUserEvent) || [];
                if( !_.isArray(currentEvents)) currentEvents = [currentEvents];
                currentEvents = _.union(currentEvents, entities);
                var entityUris = [];
                var uris = _.map(currentEvents, function(userEvent){
                    var entity = userEvent.get(Voc.hasResource);
                    if( entity.isEntity) entity = entity.getSubject();
                    entityUris.push(entity);
                    return userEvent.getSubject();
                });
                user.set(Voc.hasUserEvent, uris);
                if ( entityUris.length > 0 ) {
                    that.fetchData(user, entityUris);
                }
                if( callbacks && _.isFunction(callbacks.success) ) {
                    callbacks.success(entities);
                }
            }
        );
    };
    m.fetchData = function(user, entityUris) {
        var that = this;
        this.LOG.debug("UserData", this);
        this.vie.load({
            'service' : 'entityDescsGet',
            'data' : {
                'entities' : entityUris,
                'getTags' : true,
                'getThumb' : true, 
                'getFlags' : true  
            }
        }).from('sss').execute().success(function(entities) {
            that.vie.entities.addOrUpdate(entities);
        });
    };
    m.fetchRecommendedTags = function() {
        var that = this;
        this.vie.load({
            'service' : 'recommTags',
            'data' : {
                'forUser' : userParams.user,
                'maxTags' : 20
            }
        }).using('sss').execute().success(function(tags) {
            if ( tags && _.isArray(tags) && !_.isEmpty(tags) ) {
                var tagsLabels;
                tagsLabels = _.map(tags, function(tag) {
                    return tag.label;
                });
                that.recommendedTags = tagsLabels;
            }
        });
    };
    m.getRecommendedTags = function() {
        return _.clone(this.recommendedTags);
    };
    m.getCurrentUserTagFrequencies = function() {
        var that = this,
            defer = $.Deferred();
        this.vie.load({
            'service' : 'tagFrequsGet',
            'data' : {
                'forUser' : userParams.user,
                'useUsersEntities' : true
            }
        }).using('sss').execute().success(function(data) {
            that.LOG.debug('success tagFrequsGet', data);
            defer.resolve(data);
        }).fail(function(f) {
            that.LOG.debug('error tagFrequsGet', f);
            defer.reject(f);
        });

        return defer.promise();
    };
    return m;
});
