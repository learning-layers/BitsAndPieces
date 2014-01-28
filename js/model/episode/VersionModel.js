define(['logger', 'voc', 'underscore', 'model/CopyMachine' ], function(Logger, Voc, _, CopyMachine){
    return {
        init : function(vie) {
            this.LOG.debug("initialize Version");
            this.vie = vie;
        },
        LOG : Logger.get('VersionModel'),
        newVersion: function(episode, fromVersion) {
            var newVersion,
                attr = {}
            if( fromVersion ){
                attr = fromVersion.attributes;
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
            this.vie.entities.addOrUpdate(newVersion);
            newVersion.save();
            
            // add Version to episode
            var versions = Backbone.Model.prototype.get.call(episode,
                this.vie.namespaces.uri(Voc.hasVersion));
            versions.push(newVersion.getSubject());
            episode.set(Voc.hasVersion, versions);
            
            // copy widgets if fromVersion
            if( fromVersion) {
                var widgets = fromVersion.get(Voc.hasWidget) || [];
                if( !_.isArray(widgets)) widgets = [widgets];
                var newWidgets = [];
                _.each(widgets, function(widget) {
                    var newWidget = CopyMachine.copy(widget);
                    newWidget.set(Voc.belongsToVersion, newVersion.getSubject());
                    newWidget.save();
                    newWidgets.push(newWidget.getSubject());
                });
                newVersion.set(Voc.hasWidget, newWidgets);
            }
            return newVersion;
        },
        createWidget: function(widget, version) {
            widget.set(Voc.belongsToVersion, version.getSubject());
            this.LOG.debug("createWidget", widget, version);
            this.vie.entities.addOrUpdate(widget);
            var widgets = Backbone.Model.prototype.get.call(version, 
                this.vie.namespaces.uri(Voc.hasWidget)) || [];
            if( !_.isArray(widgets)) widgets = [widgets];
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
