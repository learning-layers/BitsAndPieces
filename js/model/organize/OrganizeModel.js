define(['logger', 'voc', 'underscore' ], function(Logger, Voc, _){
    return {
        init : function(vie) {
            this.LOG.debug("initialize OrganizeModel");
            this.vie = vie;
            this.vie.entities.on('add', this.filter, this);
        },
        LOG : Logger.get('OrganizeModel'),
        /** 
         * Filters entities from added entities to vie.entities
         */
        filter: function(model, collection, options) {
            if( this.vie.namespaces.curie(model.get('@type').id) === Voc.ORGANIZE ) {
                this.fetchStuff(model);
            }
        },
        createCircle: function(organize, circle, options) {
            options = options || {};
            if( !circle.isEntity) circle = new this.vie.Entity(circle);
            var type = organize.get(Voc.circleType);
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
                    circle.set(circle.idAttribute, circ['uri']);
                    vie.entities.addOrUpdate(circle);
                    var circles = Backbone.Model.prototype.get.call(this.model, Voc.hasCircle);
                    circles = circles.push(circ['uri']);
                    organize.set(Voc.hasCircle, circles);
                }
            );
            return circle;
        },
        createEntity: function(organize, entity, options) {
            options = options || {};
            if( !entity.isEntity) entity = new this.vie.Entity(entity);
            var type = organize.get(Voc.orgaEntityType);
            if( type.isEntity ) type = type.getSubject();
            entity.set({
                '@type': type,
                'organize' : organize.getSubject()
            }, _.extend(options));

            var vie = this.vie;
            this.vie.save({
                'entity' : entity
            }).from('sss').execute().success(
                function(ent) {
                    entity.set(entity.idAttribute, ent['uri']);
                    vie.entities.addOrUpdate(entity);
                    var entities = Backbone.Model.prototype.get.call(this.model, Voc.hasOrgaEntity);
                    entities = entities.push(ent['uri']);
                    organize.set(Voc.hasOrgaEntity, entities);
                }
            );
            return entity;
        },
        fetchStuff: function(organize) {
            this.vie.load({
                'organize' : organize.getSubject(),
                'type' : Voc.CIRCLE
            }).from('sss').execute().success(
                function(circles) {
                    this.vie.entities.addOrUpdate(circles);
                }
            );
            this.vie.load({
                'organize' : organize.getSubject(),
                'type' : Voc.ORGAENTITY
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
});
