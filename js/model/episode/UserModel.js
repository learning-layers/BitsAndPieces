define(['logger', 'voc', 'model/episode/EpisodeModel'], function(Logger, Voc, EpisodeModel){
    return {
        init : function(vie) {
            this.LOG.debug("initialize UserModel");
            this.vie = vie;
            this.vie.entities.on('add', this.filter, this);
        },
        LOG : Logger.get('UserModel'),
        /** 
         * Filters user entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('@type').id) === Voc.USER ) {
                //this.fetchEpisodes(model);
                /*
                model.on('change:' 
                    + this.vie.namespaces.uri(Voc.CURRENTVERSION), 
                    function(model, value, options){
                        m.LOG.log('changed currentVersion', value);
                        m.setCurrentVersion(value);
                    });
                    */
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
                    /* If no episodes exist create a new one */
                    if( episodes.length === 0 ) {
                        var ep = EpisodeModel.newEpisode(model);
                        Logger.debug("episode created", ep);
                    } else {
                        v.entities.addOrUpdate(episodes);
                    }
                }
            );
        }
    };
});
