define(['logger', 'types', 'underscore'], function(Logger, Types, _){
    var VersionModel = function(vie) {
        this.LOG.debug("initialize Version");
        this.vie = vie;
        this.vie.entities.on('add', this.filter);
    };
    VersionModel.prototype = {
        LOG : Logger.get('VersionModel'),
        /** 
         * Filters user entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('type').id) === Types.VERSION ) {
                this.fetchWidgets(model);
            }
        },
        fetchWidgets: function(model) {
            var vie = this.vie;
            this.vie.load({
                'version' : model,
                'type' : Types.WIDGET
            }).from('sss').execute().success(
                function(widgets) {
                    vie.entities.addOrUpdate(widgets);
                }
            );
        },
        createWidget: function(widget, version) {
            widget.set(Types.belongstoVersion, version.getSubject());
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
    return VersionModel;
});
