define(['logger', 'voc', 'underscore', 'model/CopyMachine', 'model/Model' ], function(Logger, Voc, _, CopyMachine, Model){
    var m = Object.create(Model);
    m.LOG = Logger.get('VersionModel');
    m.init = function(vie) {
        this.LOG.debug("initialize Version");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this );
        this.setIntegrityCheck(Voc.belongsToEpisode, Voc.EPISODE, Voc.hasVersion);
        this.setIntegrityCheck(Voc.hasWidget, null, Voc.belongsToVersion);

    };
    m.filter= function(model, collection, options ) {
        if( this.vie.namespaces.curie(model.get('@type').id) === Voc.VERSION ) {
            this.checkIntegrity(model);
            if(!model.isNew()) {
                this.fetchWidgets(model);
            } 
        }
    };
    /**
     * Fetches widget entities from server.
     * If no such entities exist, default Timeline and/or Organize are created.
     */
    m.fetchWidgets= function(version) {
        this.LOG.debug('fetchWidgets');
        var vie = this.vie;
        var that = this;
        this.vie.load({
            'version' : version.getSubject(),
            'type' : Voc.WIDGET
        }).from('sss').execute().success(
            function(widgets) {
                widgets = that.vie.entities.addOrUpdate(widgets);
                that.LOG.debug('success fetchWidgets', widgets);
                var ws = _.map(widgets, function(w){
                    return w.getSubject();
                });
                version.set(Voc.hasWidget, ws);
            }
        );
    };
    m.newVersion= function(episode, fromVersion) {
        var newVersion,
            attr = {};
        if( fromVersion ){
            attr = _.clone(fromVersion.attributes);
            delete attr[fromVersion.idAttribute];
        }
        newVersion = new this.vie.Entity(attr);
        this.LOG.debug("newVersion", newVersion);
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
                var newWidget = CopyMachine.copy(widget);
                newWidget.set(Voc.belongsToVersion, newVersion.getSubject());
                newWidget.save();
                //newWidgets.push(newWidget);
                //newWidgetUris.push(newWidget.getSubject());
            });
            //newVersion.set(Voc.hasWidget, newWidgetUris);
        }
        // save widgets after version is added
        //_.each(newWidgets, function(widget){widget.save()});
        // add Version to episode
        //var versions = Backbone.Model.prototype.get.call(episode,
            //this.vie.namespaces.uri(Voc.hasVersion)) || [];
        //if(!_.isArray(versions)) versions = [versions];
        //else versions = _.clone(versions);
        //versions.push(newVersion.getSubject());
        //episode.set(Voc.hasVersion, versions);
        
        return newVersion;
    };
    return m;

});
