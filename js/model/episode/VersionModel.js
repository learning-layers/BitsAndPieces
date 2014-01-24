define(['logger', 'voc', 'underscore'], function(Logger, Voc, _){
    return {
        init : function(vie) {
            this.LOG.debug("initialize Version");
            this.vie = vie;
            this.vie.entities.on('add', this.filter, this);
        },
        LOG : Logger.get('VersionModel'),
        /** 
         * Filters entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
        },
        newVersion: function(episode, fromVersion) {
            var newVersion;
            if( !fromVersion ){
                newVersion = new this.vie.Entity();
            } else {
                // TODO rename to deepCopy
                newVersion = fromVersion.clone();
            }
            this.LOG.debug("newVersion", newVersion);
            newVersion.set(Voc.timestamp, new Date());
            newVersion.set('@type', Voc.VERSION);
            newVersion.set(Voc.belongsToEpisode, episode.getSubject());
            newVersion.set(Voc.hasWidget, []);

            var vie = this.vie;
            var vm = this;
            this.vie.save({
                'entity' : newVersion
            }).from('sss').execute().success(
                function(version) {
                    vie.entities.addOrUpdate(version);
                    if( fromVersion ) {
                        vm.getWidgets(fromVersion).each( function(widget){
                            var newWidget = CopyMachine.deepCopy(widget);
                            vie.save({
                                'entity' : newWidget
                            }).to('sss').execute();
                        });
                        
                    }
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
        createWidget: function(widget, version) {
            widget.set(Voc.belongsToVersion, version.getSubject());
            this.LOG.debug("createWidget", widget, version);
            var LOG = this.LOG;
            var vie = this.vie;
            this.vie.save({
                'entity' : widget
            }).from('sss').execute().success(
                function(widget_uri) {
                    widget.set(widget.idAttribute, widget_uri['uri']);
                    LOG.debug('created', widget_uri, 'version', version.getSubject());
                    version = vie.entities.get(version.getSubject());
                    var widgets = version.get(Voc.hasWidget) || [];
                    LOG.debug('widgets', JSON.stringify(widgets));
                    if( !_.isArray(widgets)) widgets = [widgets.getSubject()];
                    widgets.push(widget_uri['uri']);
                    vie.entities.addOrUpdate(widget);
                    version.set(Voc.hasWidget, widgets);
                    widgets = version.get( Voc.hasWidget) || [];
                    LOG.debug('widgets', JSON.stringify(widgets));
                }
            );
        },
        clone: function() {
            //TODO to be done in vie.Entity
            return; 
            /*
            var newAttr = _.clone(this.attributes);
            delete newAttr['@subject'];
            var VersionModel = require('./VersionModel');
            var newVersion = new VersionModel(newAttr, {
                'widgetCollection' : new this.vie.Collection([], {
                    'vie':this.vie,
                    'predicate': this.widgetCollection.predicate
                })
            });
            
            return newVersion;
            */
        },
        getWidgets: function(version) {
            var conditions = {};
            conditions[Voc.belongsToVersion] = version.getSubject();
            conditions['@type'] = Voc.WIDGET;
            return new this.vie.Collection(this.vie.entities.where(conditions));
        }

    };
});
