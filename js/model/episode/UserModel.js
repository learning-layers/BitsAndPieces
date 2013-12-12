define(['logger', 'types'], function(Logger, Types){
    var UserModel = function(vie) {
        this.LOG.debug("initialize UserModel");
        this.vie = vie;
        this.vie.entities.on('add', this.filter);
    };

    UserModel.prototype = {
        LOG : Logger.get('UserModel'),
        /** 
         * Filters user entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('type').id) === Types.USER ) {
                this.fetchEpisodes(model);
                /*
                model.on('change:' 
                    + this.vie.namespaces.uri(Types.CURRENTVERSION), 
                    function(model, value, options){
                        m.LOG.log('changed currentVersion', value);
                        m.setCurrentVersion(value);
                    });
                    */
)
            }
        },
        /**
         * Fetch the episodes belonging to the user.
         * On success load versions of each episode or create a new episode if none exists.
         * @params VIE.Entity user
         */
        fetchEpisodes: function(user) {
            var vie = this.vie;
            this.vie.load({
                'user': user.getSubject(),
                'type' : Types.EPISODE
            }).from('sss').execute().success(
                function(episodes) {
                    userModel.LOG.debug("success fetchEpisodes");
                    userModel.LOG.debug("episodes", episodes);
                    /* If no episodes exist create a new one */
                    if( episodes.length === 0 ) {
                        var ep = new this.vie.Entity({
                            'type' : Types.EPISODE,
                            'label' : 'Unnamed Episode'
                        });
                        userModel.LOG.debug("episode created", ep);
                        episodes.add(ep);
                        vie.save({
                            'entity' : ep
                        }.from('sss').execute().success(
                            function(episode) {
                                vie.entities.addOrUpdate(episode);
                            }
                        );
                    } else {
                        vie.entities.addOrUpdate(episodes);
                    }
                }
            );
        },
        setCurrentVersion: function(value) {
            var version = this.get('currentVersion');
            if( version && version.isEntity ) version = version.getSubject();
            this.LOG.debug('version', version, '= value ', value, '?');
            if( value && value != version)
                this.save('currentVersion', value);
        }
    };
    return UserModel;
});
