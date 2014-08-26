define(['logger', 'voc', 'underscore', 'data/CopyMachine', 'data/Data' ], function(Logger, Voc, _, CopyMachine, Data){
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
        }
    };
    m.newVersion= function(episode, fromVersion) {
        var newVersion,
            attr = {};
        if( fromVersion ){
            attr = _.clone(fromVersion.attributes);
            delete attr[fromVersion.idAttribute];
            delete attr[this.vie.namespaces.uri(Voc.hasWidget)];
        } else {
            attr[this.vie.namespaces.uri(Voc.hasWidget)] = false;
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
                //newWidgets.push(newWidget);
                //newWidgetUris.push(newWidget.getSubject());
            });
            //newVersion.set(Voc.hasWidget, newWidgetUris);
        }
        // save widgets after version is added
        //_.each(newWidgets, function(widget){widget.save()});
        // add Version to episode
        //var versions = Backbone.Data.prototype.get.call(episode,
            //this.vie.namespaces.uri(Voc.hasVersion)) || [];
        //if(!_.isArray(versions)) versions = [versions];
        //else versions = _.clone(versions);
        //versions.push(newVersion.getSubject());
        //episode.set(Voc.hasVersion, versions);
        
        return newVersion;
    };
    return m;

});
