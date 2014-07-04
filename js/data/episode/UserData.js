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
            if( !user.isNew() ) {
                this.fetchEpisodes(user);
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
    m.dataImportEvernote = function(user) {
        var that = this;
        this.vie.analyze({
            'service' : 'dataImportEvernote',
            'user' : user
        }).from('sss').execute().success(function(users) {
            // TODO fetch user events
            // update the set of user events in the user model
            // triggers update of timeline which listens to changes in user events array of its user
        });
    };
    return m;
});
