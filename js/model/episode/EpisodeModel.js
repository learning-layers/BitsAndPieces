define(['logger', 'voc', 'underscore'], function(Logger, Voc, _){
    return {
        init : function(vie) {
            this.LOG.debug("initialize Episode");
            this.vie = vie;
            this.vie.entities.on('add', this.filter, this);
        },
        LOG : Logger.get('EpisodeModel'),
        /** 
         * Filters entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('@type').id) === Voc.EPISODE ) {
                this.LOG.debug('episode added', model);
                this.fetchVersions(model);
            }
        },
        fetchVersions: function(episode) {
            var em = this;
            this.vie.load({
                'episode' : episode,
                'type' : Voc.VERSION
            }).from('sss').execute().success(
                function(versions) {
                    episode.LOG.debug("success fetchVersions");
                    episode.LOG.debug("versions", versions);
                    if( versions.length === 0 ) {
                        em.newVersion(episode);
                    } else {
                        em.vie.entities.addOrUpdate(versions);
                    }
                }
            );

        },
        newEpisode: function(user, fromVersion) {
            var newEpisode;
            if( !fromVersion ){
                newEpisode = new this.vie.Entity();
            } else {
                var fromEpisode = fromVersion.get(Voc.belongsToEpisode);
                newEpisode = fromEpisode.clone();
            }
            this.LOG.debug("newEpisode", newEpisode);
            newEpisode.set(Voc.belongsToUser, user.getSubject());
            newEpisode.set('@type', Voc.EPISODE);
            newEpisode.set(Voc.label, "New Episode");

            var vie = this.vie;
            this.vie.save({
                'entity' : newEpisode
            }).from('sss').execute().success(
                function(episode) {
                    vie.entities.addOrUpdate(episode);
                    VersionModel.newVersion(episode, fromVersion);
                }
            );
            return newEpisode;
        },
        clone: function(fromEpisode) {
            
        },
        getFirstVersion: function(episode) {
            return this.getVersions().at(0);
        },

        getVersions: function(episode) {
            var conditions = {};
            conditions[Voc.belongsToEpisode] = episode.getSubject();
            var coll = new this.vie.Collection;
            coll.comparator = this.vie.namespaces.uri(Voc.timeStamp);
            coll.add(this.vie.entities.where(conditions));
            return coll;
        }
    };
});
