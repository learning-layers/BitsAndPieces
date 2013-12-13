define(['logger', 'voc', 'underscore'], function(Logger, Voc, _){
    return {
        init : function(vie) {
            this.LOG.debug("initialize Episode");
            this.vie = vie;
            this.vie.entities.on('add', this.filter);
        },
        LOG : Logger.get('EpisodeModel'),
        /** 
         * Filters entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('@type').id) === Voc.EPISODE ) {
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
        newEpisode: function(user, fromEpisode) {
            var newEpisode;
            if( !fromEpisode ){
                newEpisode = new this.vie.Entity();
            } else {
                // TODO rename to deepCopy
                newEpisode = fromEpisode.clone();
            }
            this.LOG.debug("newEpisode", newEpisode);
            newEpisode.set(Voc.belongsToEpisode, episode.getSubject());
            newEpisode.set(Voc.label, "New Episode");

            var vie = this.vie;
            this.vie.save({
                'entity' : newEpisode
            }).from('sss').execute().success(
                function(episode) {
                    vie.entities.addOrUpdate(episode);
                    VersionModel.newVersion(episode);
                }
            );
            /*
             * TODO refactor widget deepcopy
            this.versionCollection.create(newEpisode, {
                'wait' : true,
                'success' : function(model, response, options) {
                    version.LOG.debug('version saved', model);
                    if( fromEpisode)
                        fromEpisode.widgetCollection.each(function(widget){
                            var newWidget = widget.clone({'version': model.getSubject()});
                            model.createWidget(newWidget);
                        });
            }});
            */
            return newEpisode;
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
