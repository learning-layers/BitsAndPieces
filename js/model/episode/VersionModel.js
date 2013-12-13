define(['logger', 'voc', 'underscore'], function(Logger, Voc, _){
    return {
        init : function(vie) {
            this.LOG.debug("initialize Version");
            this.vie = vie;
            this.vie.entities.on('add', this.filter);
        },
        LOG : Logger.get('VersionModel'),
        /** 
         * Filters entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('@type').id) === Voc.VERSION ) {
                this.fetchWidgets(model);
            }
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
            newVersion.set(Voc.belongsToEpisode, episode.getSubject());

            var vie = this.vie;
            this.vie.save({
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
        fetchWidgets: function(model) {
            var vie = this.vie;
            this.vie.load({
                'version' : model,
                'type' : Voc.WIDGET
            }).from('sss').execute().success(
                function(widgets) {
                    vie.entities.addOrUpdate(widgets);
                }
            );
        },
        createWidget: function(widget, version) {
            widget.set(Voc.belongstoVersion, version.getSubject());
            this.LOG.debug("createWidget", widget, version);
            var vie = this.vie;
            this.vie.save({
                'entity' : widget
            }).from('sss').execute().success(
                function(widget) {
                    vie.entities.addOrUpdate(widget);
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
        }

    };
});
