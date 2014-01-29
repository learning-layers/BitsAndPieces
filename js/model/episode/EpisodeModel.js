define(['logger', 'voc', 'underscore', 'model/episode/VersionModel'], function(Logger, Voc, _, VersionModel){
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
                if( !model.isNew() ) {
                    this.fetchVersions(model);
                }
            }
        },
        fetchVersions: function(episode) {
            var em = this;
            this.vie.load({
                'episode' : episode.getSubject(),
                'type' : Voc.VERSION
            }).from('sss').execute().success(
                function(versions) {
                    em.LOG.debug("success fetchVersions");
                    em.LOG.debug("versions", versions);
                    if( versions.length === 0 ) {
                        versions.push(VersionModel.newVersion(episode));
                    } else {
                        versions = em.vie.entities.addOrUpdate(versions);
                    }
                    var current = episode.get(Voc.hasVersion) || [];
                    versions = _.union(current, versions);
                    versions = versions.map(function(v){
                        return v.getSubject();
                    });
                    episode.set(Voc.hasVersion, versions);
                }
            );

        },
        newEpisode: function(user, fromVersion) {
            var newEpisode, attr = {};
            newEpisode = new this.vie.Entity();
            this.LOG.debug("newEpisode", newEpisode);
            newEpisode.set(Voc.label, "New Episode");
            newEpisode.set(Voc.belongsToUser, user.getSubject());
            newEpisode.set('@type', Voc.EPISODE);
            this.vie.entities.addOrUpdate(newEpisode);
            VersionModel.newVersion(newEpisode, fromVersion);

            newEpisode.save();

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
