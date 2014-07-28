define(['logger', 'voc', 'underscore', 'data/Data', 'data/episode/EpisodeData'], function(Logger, Voc, _, Data, EpisodeData){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize UserData");
        this.LOG.debug('this', this);
        this.LOG.debug('Data', Data);
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.hasEpisode, Voc.EPISODE, Voc.belongsToUser);
        this.setIntegrityCheck(Voc.currentVersion, Voc.VERSION);
    };
    m.LOG = Logger.get('UserData');
    /** 
     * Filters user entities from added entities to vie.entities
     */
    m.filter= function(user, collection, options) {
        if( user.isof(Voc.USER) ) {
            this.LOG.debug('user added', user);
            this.checkIntegrity(user, options);
            //this.dataImportEvernote(user);
            if( !user.isNew() ) {
                this.fetchEpisodes(user);
                this.fetchRange(user);
            } 
        }
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
            'user': user.getSubject(),
            'type' : this.vie.types.get(Voc.EPISODE)
        }).from('sss').execute().success(
            function(episodes) {
                that.LOG.debug("success fetchEpisodes");
                that.LOG.debug("episodes", episodes);
                v.entities.addOrUpdate(episodes);
                if( _.isEmpty(episodes) ) {
                    user.set(Voc.hasEpisode, false);
                }
            }
        );
    }
    m.fetchAllUsers = function() {
        var that = this,
            defer = $.Deferred();
        this.vie.analyze({
            'service' : 'userAll',
        }).using('sss').execute().success(function(users){
            that.LOG.debug('user entities', users);
            //users = that.vie.entities.addOrUpdate(users);
            defer.resolve(users);
        });

        return defer;
    };
    m.dataImportEvernote = function(user, callbacks) {
        var that = this;
        this.vie.analyze({
            'service' : 'dataImportEvernote',
            'user' : user
        }).from('sss').execute().success(function(users) {
            that.fetchRange(user);
            if( callbacks && callbacks.success ) {
                callbacks.success(user);
            }
        }).fail(function() {
            if( callbacks && callbacks.error ) {
                callbacks.error()
            }
        });
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
            'type' : this.vie.types.get(Voc.USEREVENT),
            'start' : start.getTime(),
            'end' : end.getTime(),
            'forUser' : forUser
        }).from('sss').execute().success(
            function(entities) {
                // store the timestamps of this fetch
                if ( lastStart === undefined || start < lastStart ) user.set(Voc.start, start);
                if ( lastEnd === undefined || end > lastEnd ) user.set(Voc.end, end);
                that.LOG.debug('success fetchRange: ', _.clone(entities), 'user: ', user);
                entities = that.vie.entities.addOrUpdate(entities, {'overrideAttributes': true});
                var currentEvents = user.get(Voc.hasUserEvent) || [];
                if( !_.isArray(currentEvents)) currentEvents = [currentEvents];
                currentEvents = _.union(currentEvents, entities);
                var uris = _.map(currentEvents, function(userEvent){
                    return userEvent.getSubject();
                });
                user.set(Voc.hasUserEvent, uris);
                if( callbacks && _.isFunction(callbacks.success) ) {
                    callbacks.success(entities);
                }
            }
        );
    };
    return m;
});
