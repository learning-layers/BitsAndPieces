define(['logger', 'voc', 'underscore', 'data/CopyMachine', 'data/Data', 'utils/EntityHelpers' ], function(Logger, Voc, _, CopyMachine, Data, EntityHelpers){
    var m = Object.create(Data);
    m.LOG = Logger.get('VersionData');
    m.init = function(vie) {
        this.LOG.debug("initialize Version");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this );
        this.setIntegrityCheck(Voc.belongsToEpisode, Voc.EPISODE, Voc.hasVersion);
        this.setIntegrityCheck(Voc.hasWidget, null, Voc.belongsToVersion);

    };
    m.filter= function(model, collection, options ) {
        if( model.isof(Voc.VERSION) ) {
            this.checkIntegrity(model, options);
            model.sync = this.sync;
        }
    };
    m.sync= function(method, model, options) {
        m.LOG.debug("sync entity " + model.getSubject() + " by " + method);
        if( !options ) options = {};

        if( method === 'create' ) {
            m.createVersion(model, options);
        } else {
            this.vie.Entity.prototype.sync(method, model, options);
        }
    },
    m.createVersion= function(model, options) {
        var episode = model.get(Voc.belongsToEpisode);
        var that = this;
        this.vie.onUrisReady(
            episode.getSubject(),
            function(episodeUri) {
                that.vie.save({
                    service : 'learnEpVersionCreate',
                    data : {
                        'learnEpId' : EntityHelpers.getIdFromUri(episodeUri)
                    }
                }).to('sss').execute().success(function(savedEntityUri) {
                    model.set(model.idAttribute, savedEntityUri, options);
                    if(options.success) {
                        options.success(savedEntityUri);
                    }
                });
            }
        );
    },
    m.newVersion= function(episode, fromVersion) {
        var newVersion,
            attr = {};
        if( fromVersion ){
            attr = _.clone(fromVersion.attributes);
            delete attr[fromVersion.idAttribute];
            delete attr[this.vie.namespaces.uri(Voc.hasWidget)];
        } 
        newVersion = new this.vie.Entity(attr);

        this.LOG.debug("newVersion", newVersion, fromVersion);
        this.LOG.debug("has Widgets", newVersion.get(Voc.hasWidget));
        newVersion.set(Voc.timestamp, new Date());
        newVersion.set('@type', Voc.VERSION);
        newVersion.set(Voc.belongsToEpisode, episode.getSubject());
        this.vie.entities.addOrUpdate(newVersion);
        newVersion.save();

        var vie = this.vie;
        var vm = this;

        // copy widgets if fromVersion
        var newWidgets = [];
        if( fromVersion) {
            var newWidgetUris = [];
            var widgets = fromVersion.get(Voc.hasWidget) || [];
            if( !_.isArray(widgets)) widgets = [widgets];
            _.each(widgets, function(widget) {
                var overrideAttributes = {};
                overrideAttributes[vm.vie.namespaces.uri(Voc.belongsToVersion)] 
                    = newVersion.getSubject();
                var newWidget = CopyMachine.copy(widget, overrideAttributes);
            });
        }
        
        return newVersion;
    };
    return m;

});
