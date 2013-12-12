define(['logger', 'types', 'underscore' ], function(Logger, Types, _){
    var OrganizeModel = function(vie) {
        this.LOG.debug("initialize OrganizeModel");
        this.vie = vie;
        this.vie.entities.on('add', this.filter);
    };
    OrganizeModel.prototype = {
        LOG : Logger.get('OrganizeModel'),
        /** 
         * Filters entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('type').id) === Types.ORGANIZE ) {
                this.fetchStuff(model);
            }
        },
        createCircle: function(organize, circle, options) {
            options = options || {};
            if( !circle.isEntity) circle = new this.vie.Entity(circle);
            var type = organize.get(Types.circleType);
            if( type.isEntity ) type = type.getSubject();
            circle.set({
                '@type': type,
                'organize' : organize.getSubject()
            }, _.extend(options));

            var vie = this.vie;
            this.vie.save({
                'entity' : circle
            }).from('sss').execute().success(
                function(circ) {
                    vie.entities.addOrUpdate(circ);
                }
            );
            return circle;
        },
        createEntity: function(entity, options) {
            options = options || {};
            if( !entity.isEntity) entity = new this.vie.Entity(entity);
            var type = organize.get(Types.orgaEntityType);
            if( type.isEntity ) type = type.getSubject();
            entity.set({
                '@type': type,
                'organize' : organize.getSubject()
            }, _.extend(options));

            var vie = this.vie;
            this.vie.save({
                'entity' : entity
            }).from('sss').execute().success(
                function(circ) {
                    vie.entities.addOrUpdate(circ);
                }
            );
            return entity;
        },
        fetchStuff: function(organize) {
            this.vie.load({
                'organize' : organize,
                'type' : Types.CIRCLE
            }).from('sss').execute().success(
                function(circles) {
                    this.vie.entities.addOrUpdate(circles);
                }
            );
            this.vie.load({
                'organize' : organize,
                'type' : Types.ORGAENTITY
            }).from('sss').execute().success(
                function(entities) {
                    this.vie.entities.addOrUpdate(entities);
                }
            );
        },
        clone: function(attributes) {
            // TODO to be done in vie.Entity
            return;
            /*
            var newAttr = _.clone(this.attributes);
            delete newAttr[VIE.prototype.Entity.prototype.idAttribute];
            newAttr = _.extend(newAttr, attributes);
            var circleCollection = 
                new this.vie.Collection([], {
                    'vie':this.vie,
                    'predicate': this.circleCollection.predicate
                });
            var orgaEntityCollection = 
                new this.vie.Collection([], {
                    'vie':this.vie,
                    'predicate': this.orgaEntityCollection.predicate
                });
            var OrganizeModel = require('./OrganizeModel');
            var newOrganize = new OrganizeModel(newAttr, {
                'circleCollection' : circleCollection,
                'orgaEntityCollection' : orgaEntityCollection
            });
            var organize = this;
            newOrganize.save(newOrganize, {'success':function(model, response, options){
                organize.LOG.debug('organize cloned');
                organize.circleCollection.each(function(item){
                    var newItem = _.clone(item.attributes);
                    delete newItem[VIE.prototype.Entity.prototype.idAttribute];
                    model.createCircle(newItem);
                });
                organize.orgaEntityCollection.each(function(item){
                    var newItem = _.clone(item.attributes);
                    delete newItem[VIE.prototype.Entity.prototype.idAttribute];
                    model.createEntity(newItem);
                });
            }});
            return newOrganize;
            */
        }
    };
    return OrganizeModel;
});
