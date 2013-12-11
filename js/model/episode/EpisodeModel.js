define(['vie', 'logger', 'model/episode/VersionModel'], function(VIE, Logger, VersionModel){
    return VIE.prototype.Entity.extend({
        LOG : Logger.get('EpisodeModel'),
        initialize: function(attributes, options ) {
            this.LOG.debug("initialize Episode");
            if( !options) options = {};
            this.LOG.debug("options", options);
            this.LOG.debug("attributes",attributes);
            // kind of super constructor:
            VIE.prototype.Entity.prototype.initialize.call(this, attributes, options );
            this.set('@type', 'sss:Episode');
            this.versionCollection = options.versionCollection || 
                new this.vie.Collection([], {
                    'vie':this.vie,
                    'model' : VersionModel,
                    'predicate': this.vie.namespaces.uri('sss:Version')
                });
            this.versionCollection.comparator = this.vie.namespaces.uri('sss:timestamp');

            // when the model has got a URI from the server:
            //this.on('change:' + VIE.prototype.Entity.prototype.idAttribute, function(model, value, options ){
                //model.versionCollection.each(function(version) {
                    // save version to the server
                    //model.LOG.debug("changing id to ", value);
                    //version.save({'episode': value});
                //});
            //});
            var epModel = this;
            this.versionCollection.on('add', function(model, collection, options ){
               epModel.LOG.debug('version added');
               epModel.trigger('addVersion', model, collection, options);
            }, this);


        },
        load: function() {
            var epModel = this;
            if( this.isNew() ) {
                //this.on('sync', function(model, resp, options ){
                  //  epModel.LOG.debug('sync') ;
                 //   if( !model.isNew() && model.versionCollection.length == 0 )
                        this.newVersion();
                //});
            } else {
                this.fetchVersions();
            }
        },
        fetchVersions: function(data) {
            if( !data ) data = {};
            if( !data.data ) data.data = {};
            data.data.episode = this.getSubject();
            var episode = this;
            data.success = function(collection, response, options) {
                                episode.LOG.debug("success fetchVersions");
                                episode.LOG.debug("collection", collection);
                                if( collection.length == 0 ) {
                                    episode.newVersion();
                                } 
                            };
            this.versionCollection.fetch(data);

        },
        newVersion: function(fromVersion) {
            var newVersion;
            if( !fromVersion )
                newVersion = new VersionModel({
                    'episode' : this.getSubject()
                });
            else {
                newVersion = fromVersion.clone();
            }
            this.LOG.debug("newVersion", newVersion);
            newVersion.set({
                'timestamp': new Date(),
                'episode' : this.getSubject()
            });
            var version = this;
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
            return newVersion;
        },
        getFirstVersion: function() {
            return this.versionCollection.at(0);
        }

    });
});
