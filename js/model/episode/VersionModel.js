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
        /**
         * Fetches widget entities from server.
         * If no such entities exist, default Timeline and Organize are created.
         */
        fetchWidgets: function(version) {
            var VersionModel = this;
            var vie = this.vie;
            var LOG = this.LOG;
            this.vie.load({
                'version' : version,
                'type' : Voc.WIDGET
            }).from('sss').execute().success(
                function(widgets) {
                    LOG.debug("success of fetching widgets", widgets);
                    var types = widgets.pluck('@type');
                    types = types.map(function(type){return type.id? type.id: type;});

                    LOG.debug('types', types);
                    if( !_.contains(types, vie.namespaces.uri('sss:Organize'))) {
                        LOG.debug("creating default organize widget");
                        var newWidget = new vie.Entity;
                        newWidget.set('@type', AppView.vie.namespaces.uri('sss:Organize'));
                        newWidget.set(Voc.circleType, AppView.vie.namespaces.uri('sss:Circle'));
                        newWidget.set(Voc.entityType, AppView.vie.namespaces.uri('sss:OrgaEntity'));

                        VersionModel.createWidget(newWidget, version);
                        widgets.push(newWidget);
                    }
                    if( !_.contains(types, AppView.vie.namespaces.uri('sss:Timeline'))) {
                        LOG.debug("creating default timeline widget");
                        var newWidget = new vie.Entity;
                        newWidget.set('@type', AppView.vie.namespaces.uri('sss:Timeline'));
                        newWidget.set('user', AppView.model.getSubject());
                        newWidget.set('timeAttr',timestamp);
                        newWidget.set('predicate', AppView.vie.namespaces.uri('sss:userEvent'));
                            //'timelineCollection' : new AppView.vie.Collection([], {//new TL.Collection([], { 
                                //'model': Entity,
                                //'vie' : AppView.vie
                                //})},
                        newWidget.set('start', jSGlobals.getTime() - jSGlobals.dayInMilliSeconds);
                        newWidget.set('end', jSGlobals.getTime() + 3600000 );
                        version.createWidget(newWidget, version);
                        widgets.push(newWidget);
                    }
                    var ws = widgets.pluck(vie.Entity.prototype.idAttribute);
                    version.set(Voc.hasWidgets, ws);
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
                    var widgets = version.get(Voc.hasWidget);
                    widgets.push(widget.getSubject());
                    version.set(Voc.hasWidget, widgets);
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
        },
        getWidgets: function(version) {
            var conditions = {};
            conditions[Voc.belongsToVersion] = version.getSubject();
            conditions['@type'] = Voc.WIDGET;
            return new this.vie.Collection(this.vie.entities.where(conditions));
        }

    };
});
