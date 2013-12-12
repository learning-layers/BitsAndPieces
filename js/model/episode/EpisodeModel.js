define(['logger', 'types', 'underscore'], function(Logger, Types, _){
    var EpisodeModel = function(vie) {
        this.LOG.debug("initialize Episode");
        this.vie = vie;
        this.vie.entities.on('add', this.filter);
    };
    EpisodeModel.prototype = {
        LOG : Logger.get('EpisodeModel'),
        /** 
         * Filters user entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('type').id) === Types.EPISODE ) {
                this.fetchVersions(model);
            }
        },
        fetchVersions: function(episode) {
            this.vie.load({
                'episode' : episode,
                'type' : Types.VERSION
            }).from('sss').execute().success(
                function(versions) {
                    episode.LOG.debug("success fetchVersions");
                    episode.LOG.debug("versions", versions);
                    if( versions.length === 0 ) {
                        this.newVersion(episode);
                    } else {
                        this.vie.entities.addOrUpdate(versions);
                    }
                }
            );

        },
        newVersion: function(episode, fromVersion) {
            var newVersion;
            if( !fromVersion )
                newVersion = new this.vie.Entity({
                    'episode' : episode.getSubject()
                });
            else {
                // TODO rename to deepCopy
                newVersion = fromVersion.clone();
            }
            this.LOG.debug("newVersion", newVersion);
            newVersion.set({
                'timestamp': new Date(),
                'episode' : episode.getSubject()
            });
            var version = this;
            vie.save({
                'entity' : newVersion
            }).from('sss').execute().success(
                function(version) {
                    vie.entities.addOrUpdate(version);
                }
            );
            /*
             * TODO refactor widget deepcopy
            this.versionCollection.create(newVersion, {
                'wait' : true,
                'success' : function(model, response, options) {
                    version.LOG.debug('version saved', model);
                    if( fromVersion)
                        fromVersion.widgetCollection.each(function(widget){
                            var newWidget = widget.clone({'version': model.getSubject()});
                            model.createWidget(newWidget);
                        });
            }});
            */
            return newVersion;
        },
        getFirstVersion: function(episode) {
            return this.getVersions().at(0);
        },

        getVersions: function(episode) {
            var conditions = {};
            conditions[Types.belongsToEpisode] = episode.getSubject();
            var coll = new this.vie.Collection;
            coll.comparator = this.vie.namespaces.uri(Types.timeStamp);
            coll.add(this.vie.entities.where(conditions));
            return coll;
        }
    };
    return EpisodeModel;
});
