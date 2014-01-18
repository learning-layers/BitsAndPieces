define(['logger', 'voc'], function(Logger, Voc){
    return {
        init : function(vie) {
            this.LOG.debug("initialize UserModel");
            this.vie = vie;
            this.vie.entities.on('add', this.filter);
        },
        LOG : Logger.get('UserModel'),
        /** 
         * Filters user entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('@type').id) === Voc.USER ) {
                this.fetchEpisodes(model);
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
        },
        setCurrentVersion: function(value) {
            var version = this.get('currentVersion');
            if( version && version.isEntity ) version = version.getSubject();
            this.LOG.debug('version', version, '= value ', value, '?');
            if( value && value != version)
                this.save('currentVersion', value);
        }
    };
});
