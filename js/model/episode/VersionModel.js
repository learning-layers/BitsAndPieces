define(['logger', 'voc', 'underscore', 'model/CopyMachine' ], function(Logger, Voc, _, CopyMachine){
    return {
        init : function(vie) {
            this.LOG.debug("initialize Version");
            this.vie = vie;
        },
        LOG : Logger.get('VersionModel'),
        newVersion: function(episode, fromVersion) {
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
            newVersion.set(Voc.hasWidget, []);

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
                    newWidgets.push(newWidget);
                    newWidgetUris.push(newWidget.getSubject());
                });
                newVersion.set(Voc.hasWidget, newWidgetUris);
            }
            this.vie.entities.addOrUpdate(newVersion);
            newVersion.save();
            // save widgets after version is added
            _.each(newWidgets, function(widget){widget.save()});
            // add Version to episode
            var versions = Backbone.Model.prototype.get.call(episode,
                this.vie.namespaces.uri(Voc.hasVersion)) || [];
            if(!_.isArray(versions)) versions = [versions];
            else versions = _.clone(versions);
            versions.push(newVersion.getSubject());
            episode.set(Voc.hasVersion, versions);
            
            return newVersion;
        },
        createWidget: function(widget, version) {
            widget.set(Voc.belongsToVersion, version.getSubject());
            this.LOG.debug("createWidget", widget, version);
            this.vie.entities.addOrUpdate(widget);
            var widgets = Backbone.Model.prototype.get.call(version, 
                this.vie.namespaces.uri(Voc.hasWidget)) || [];
            if( !_.isArray(widgets)) widgets = [widgets];
            else widgets = _.clone(widgets);
            widgets.push(widget.getSubject());
            version.set(Voc.hasWidget, widgets);

            var LOG = this.LOG;
            this.vie.save({
                'entity' : widget
            }).from('sss').execute().success(
                function(widget_uri) {
                    widget.set(widget.idAttribute, widget_uri['uri']);
                    LOG.debug('created', widget_uri, 'version', version.getSubject());
                    //version = vie.entities.get(version.getSubject());
                }
            );
        },
        getWidgets: function(version) {
            var conditions = {};
            conditions[Voc.belongsToVersion] = version.getSubject();
            conditions['@type'] = Voc.WIDGET;
            return new this.vie.Collection(this.vie.entities.where(conditions));
        }

    };
});
