EP = window.EP || {};
EP.UserModel = VIE.prototype.Entity.extend({
    LOG : Logger.get('UserModel'),
    initialize: function(attributes, options) {
        this.LOG.debug("initialize UserModel");
        if( !options) options = {};
        this.LOG.debug("options", options);
        this.LOG.debug("attributes", attributes);
        // kind of super constructor:
        VIE.prototype.Entity.prototype.initialize.call(this, attributes, options );
        this.episodeCollection = options.episodeCollection || 
            new this.vie.Collection([], {
                'vie':this.vie,
                'model' : EP.EpisodeModel,
                'predicate': this.vie.namespaces.uri('sss:Episode')
            });
            var model = this;

        var m = this;
        this.episodeCollection.on('change:' + this.vie.namespaces.uri('sss:currentVersion'), function(model, value, options){
            m.LOG.log('changed currentVersion', value);
            m.setCurrentVersion(value);
        });
    },
    fetchEpisodes: function() {
        var userModel = this;
        this.episodeCollection.fetch({
                                'data':{'user':this.getSubject()},
                                'reset' : true,
                                'silent' : false,
                                'success' : function(collection, response, options) {
                                    userModel.LOG.debug("success fetchEpisodes");
                                    userModel.LOG.debug("collection", collection);
                                    if( collection.length == 0 ) {
                                        var ep = new EP.EpisodeModel({
                                            'label' : 'Unnamed Episode'
                                        });
                                        userModel.LOG.debug("episode created");
                                        //ep.once('addVersion', function(version, collection, options ) {
                                            //userModel.LOG.debug('Version added', version.getSubject());
                                            //userModel.setCurrentVersion(version.getSubject());
                                        //});
                                        collection.create(ep, {
                                            'success': function(episode) {
                                                episode.load();
                                            }
                                        });
                                    } else {
                                        collection.each(function(episode){
                                            episode.load();
                                        });
                                    }

                                }
        });
    },
    setCurrentVersion: function(value) {
        var version = this.get('currentVersion');
        if( version && version.isEntity ) version = version.getSubject();
        this.LOG.debug('version', version, '= value ', value, '?');
        if( value && value != version)
            this.save('currentVersion', value);
    }
});
