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
                if( !model.isNew()) {
                    this.fetchCircles(model);
                    this.fetchEntities(model);
                }
            }
        },
        createItem: function(organize, item, options, type, relation) {
            options = options || {};
            if( !item.isEntity) item = new this.vie.Entity(item);
            item.set({
                '@type': type,
            }, _.extend(options));
            item.set(Voc.belongsToOrganize , organize.getSubject());

            this.vie.entities.addOrUpdate(item);
            var items = Backbone.Model.prototype.get.call(
                organize, this.vie.namespaces.uri(relation));
            (items = _.clone(items)).push(item.getSubject());
            organize.set(relation, items);
            var vie = this.vie;
            this.vie.save({
                'entity' : item
            }).from('sss').execute().success(
                function(it) {
                    item.set(item.idAttribute, it['uri']);
                }
            );
            return item;
        },
        createCircle: function(organize, circle, options) {
            var type = organize.get(Voc.circleType);
            if( type.isEntity ) type = type.getSubject();
            return this.createItem(organize, circle, options, type, Voc.hasCircle);
        },
        createEntity: function(organize, entity, options) {
            var type = organize.get(Voc.orgaEntityType);
            if( type.isEntity ) type = type.getSubject();
            return this.createItem(organize, entity, options, type, Voc.hasEntity);
        },
        fetchStuff: function(organize, type, relation) {
            var that = this;
            this.vie.load({
                'organize' : organize.getSubject(),
                'type' : type
            }).from('sss').execute().success(
                function(items) {

                    that.LOG.debug('items fetched');
                    items = that.vie.entities.addOrUpdate(items);
                    var current = organize.get(relation) || [];
                    if( !_.isArray(current)) current = [current];
                    var added = _.difference(items, current);
                    _.each(added, function(c){
                        c.on('destroy', function(model, collection, options) {
                            that.LOG.debug('destroy fired', model);
                            var its = organize.get(relation) || [];
                            if( !_.isArray(its)) its = [its];
                            that.LOG.debug('its', its);
                            var newIts = _.without(its, model);
                            organize.set(relation, newIts, options);
                        });
                        that.LOG.debug('added', c.getSubject());
                    });
                    current = _.union(current, items).map(function(c){
                        return c.getSubject();
                    });
                    that.LOG.debug('current', current);
                    organize.set(relation, current);

                }
            );
        },
        fetchCircles: function(organize) {
            this.fetchStuff(organize, Voc.CIRCLE, Voc.hasCircle);
        },
        fetchEntities: function(organize) {
            this.fetchStuff(organize, Voc.ORGAENTITY, Voc.hasEntity);
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
