define(['logger', 'voc', 'model/Model', 'model/episode/EpisodeModel'], function(Logger, Voc, Model, EpisodeModel){
    var m = Object.create(Model);
    m.init = function(vie) {
        this.LOG.debug("initialize UserModel");
        this.LOG.debug('this', this);
        this.LOG.debug('Model', Model);
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.hasEpisode, Voc.EPISODE, Voc.belongsToUser);
        this.setIntegrityCheck(Voc.currentVersion, Voc.VERSION);
    };
    m.LOG = Logger.get('UserModel');
    /** 
     * Filters user entities from added entities to vie.entities
     */
    m.filter= function(user, collection, options) {
        if( this.vie.namespaces.curie(user.get('@type').id) === Voc.USER ) {
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
        if( this.vie.namespaces.curie(version.get('@type').id) !== Voc.VERSION ) return;

        if( !this.get(Voc.currentVersion) ) {
            this.save(Voc.currentVersion, version.getSubject());
        }
        this.stopListening(this.vie.entities, 'add', require('model/episode/UserModel').initCurrentVersion);
    };
    /**
     * Check if the user hasEpisode and create a new one if not.
     * Otherwise make sure that the episodes are loaded.
     */
    m.initEpisodes= function(user, episodes, options) {
        this.LOG.debug("initEpisodes");
        if( _.isEmpty(episodes) ) {
            user.set(Voc.hasEpisode, 
                EpisodeModel.newEpisode(user).getSubject());
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
            'type' : Voc.EPISODE
        }).from('sss').execute().success(
            function(episodes) {
                that.LOG.debug("success fetchEpisodes");
                that.LOG.debug("episodes", episodes);
                v.entities.addOrUpdate(episodes);
                if( episodes.length == 0 ) {
                    user.set(Voc.hasEpisode, false);
                }
            }
        );
    }
    return m;
});
