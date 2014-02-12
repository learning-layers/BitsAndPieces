define(['logger', 'voc', 'model/Model', 'model/episode/EpisodeModel'], function(Logger, Voc, EpisodeModel){
    return _.extend(Model, {
        init : function(vie) {
            this.LOG.debug("initialize UserModel");
            this.vie = vie;
            this.vie.entities.on('add', this.filter, this);
            this.setIntegrityCheck(Voc.hasEpisode, Voc.EPISODE, Voc.belongsToUser);
            this.setIntegrityCheck(Voc.currentVersion, Voc.VERSION);
        },
        LOG : Logger.get('UserModel'),
        /** 
         * Filters user entities from added entities to vie.entities
         */
        filter: function(user, collection, options) {
            if( this.vie.namespaces.curie(user.get('@type').id) === Voc.USER ) {
                this.checkIntegrity();
                user.listenTo(this.vie.entities, 'add', this.initCurrentVersion);
                if( !user.isNew() ) {
                    this.fetchEpisodes(model);
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
        },
        /**
         * To be called in the context of a user entity.
         * If user has no currentVersion set, use the given one.
         */
        initCurrentVersion: function(version) {
            if( this.vie.namespaces.curie(version.get('@type').id) !== Voc.VERSION ) return;

            if( !this.get(Voc.currentVersion) ) {
                this.save(Voc.currentVersion, version.getSubject());
            }
            this.stopListening(this.vie.entities, 'add', UserModel.initCurrentVersion);
        },
        /**
         * Check if the user hasEpisode and create a new one if not.
         * Otherwise make sure that the episodes are loaded.
         */
        initEpisodes: function(user, episodes, options) {
            if( _.isEmpty(episodes) ) {
                user.set(Voc.hasEpisode, 
                    EpisodeModel.newEpisode(user).getSubject());
            }
        },
        /**
         * Fetch the episodes belonging to the user.
         * On success load versions of each episode or create a new episode if none exists.
         * @params VIE.Entity user
         */
        fetchEpisodes: function(user) {
            // load Episodes of User
            var v = this.vie;
            this.vie.load({
                'user': user.getSubject(),
                'type' : Voc.EPISODE
            }).from('sss').execute().success(
                function(episodes) {
                    Logger.debug("success fetchEpisodes");
                    Logger.debug("episodes", episodes);
                    v.entities.addOrUpdate(episodes);
                    var eps = episodes.map(function(ep){
                        return ep.getSubject();
                    });
                    user.set(Voc.hasEpisode, eps);
                }
            );
        }
    });
});
