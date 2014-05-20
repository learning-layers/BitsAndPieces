define(['logger', 'voc', 'data/Data', 'data/episode/EpisodeData'], function(Logger, Voc, Data, EpisodeData){
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
            user.listenTo(this.vie.entities, 'add', this.initCurrentVersion);
            if( !user.isNew() ) {
                this.fetchEpisodes(user);
            } else {
                if( user.has(Voc.hasEpisode)) {
                    var eps = user.get(Voc.hasEpisode)||[];
                    if( !_.isArray(eps) ) eps = [eps];
                    this.initEpisodes(user, eps);
                }
            }
            user.on('change:'+this.vie.namespaces.uri(Voc.hasEpisode),
                this.initEpisodes, this);

        }
    };
    /**
     * To be called in the context of a user entity.
     * If user has no currentVersion set, use the given one.
     */
    m.initCurrentVersion= function(version) {
        if( !version.isof(Voc.VERSION)) return;

        if( !this.get(Voc.currentVersion) ) {
            this.save(Voc.currentVersion, version.getSubject());
        }
        this.stopListening(this.vie.entities, 'add', require('data/episode/UserData').initCurrentVersion);
    };
    /**
     * Check if the user hasEpisode and create a new one if not.
     * Otherwise make sure that the episodes are loaded.
     */
    m.initEpisodes= function(user, episodes, options) {
        this.LOG.debug("initEpisodes");
        if( _.isEmpty(episodes) ) {
            user.set(Voc.hasEpisode, 
                EpisodeData.newEpisode(user).getSubject());
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
    return m;
});
