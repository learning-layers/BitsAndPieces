define(['logger', 'voc', 'underscore', 'model/CopyMachine' ], function(Logger, Voc, _, CopyMachine){
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
            this.LOG.debug('options', options);
            if( !item.isEntity) item = new this.vie.Entity(item);
            item.set({
                '@type': type,
            }, _.extend(options));
            item.set(Voc.belongsToOrganize, organize.getSubject(), options);

            this.vie.entities.addOrUpdate(item);
            var items = Backbone.Model.prototype.get.call(
                organize, this.vie.namespaces.uri(relation));
            (items = _.clone(items)).push(item.getSubject());
            organize.set(relation, items, options);
            var vie = this.vie;
            item.save();
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
        copy: function(organize) {
            var newAttr = _.clone(organize.attributes);
            delete newAttr[organize.idAttribute];
            var newOrganize = new this.vie.Entity(newAttr);
            this.vie.entities.addOrUpdate(newOrganize);
            var that = this;
            _.each([Voc.hasCircle, Voc.hasEntity], function(rel) {
                var items = organize.get(rel) || [];
                if(!_.isArray(items)) items = [items];
                var newItems = [];
                _.each(items,function(item){
                    var newItem = CopyMachine.copy(item);
                    newItem.set(Voc.belongsToOrganize, newOrganize.getSubject());
                    newItems.push( newItem.getSubject() );
                    that.vie.entities.addOrUpdate(newItem);
                    newItem.save();
                });
                newOrganize.set(rel, newItems);
            });
            return newOrganize;
        }
    };
});
