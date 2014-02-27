define(['logger', 'voc', 'underscore', 'model/CopyMachine', 'model/Model' ], function(Logger, Voc, _, CopyMachine, Model){
    var m = Object.create(Model);
    m.init = function(vie) {
        this.LOG.debug("initialize OrganizeModel");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasWidget);
        this.setIntegrityCheck(Voc.hasCircle, Voc.CIRCLE);
        this.setIntegrityCheck(Voc.hasEntity, Voc.ORGAENTITY);
    };
    m.LOG = Logger.get('OrganizeModel');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if( this.vie.namespaces.curie(model.get('@type').id) === Voc.ORGANIZE ) {
            this.checkIntegrity(model);
            if( !model.isNew()) {
                this.fetchCircles(model);
                this.fetchEntities(model);
            }
        }
    };
    m.createItem= function(organize, item, options, type, relation) {
        options = options || {};
        this.LOG.debug('options', options);
        if( !item.isEntity) item = new this.vie.Entity(item);
        item.set({
            '@type': type,
        }, _.extend(options));
        item.set(Voc.belongsToOrganize, organize.getSubject(), options);

        this.vie.entities.addOrUpdate(item);
        var items = Backbone.Model.prototype.get.call(
            organize, this.vie.namespaces.uri(relation)) || [];
        if(!_.isArray(items)) items = [items];
        else items = _.clone(items);
        items.push(item.getSubject());
        organize.set(relation, items, options);
        var vie = this.vie;
        item.save();
        return item;
    };
    m.createCircle= function(organize, circle, options) {
        var type = organize.get(Voc.circleType);
        if( type.isEntity ) type = type.getSubject();
        return this.createItem(organize, circle, options, type, Voc.hasCircle);
    };
    m.createEntity= function(organize, entity, options) {
        var type = organize.get(Voc.orgaEntityType);
        if( type.isEntity ) type = type.getSubject();
        return this.createItem(organize, entity, options, type, Voc.hasEntity);
    };
    m.fetchStuff= function(organize, type, relation) {
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
                    if( type == Voc.ORGAENTITY ) {
                        var resource = c.get(Voc.hasResource);
                        if( !resource.isEntity ) {
                            var entity = new that.vie.Entity;
                            entity.set(entity.idAttribute, resource);
                            that.LOG.debug('xyz1', _.clone(entity.attributes));
                            entity.fetch();
                            that.LOG.debug('xyz3', entity);
                            resource = entity;
                            that.vie.entities.addOrUpdate(resource);
                        }
                    }

                });
                current = _.union(current, items).map(function(c){
                    return c.getSubject();
                });
                that.LOG.debug('current', current);
                organize.set(relation, current);

            }
        );
    };
    m.fetchCircles= function(organize) {
        this.fetchStuff(organize, Voc.CIRCLE, Voc.hasCircle);
    };
    m.fetchEntities= function(organize) {
        this.fetchStuff(organize, Voc.ORGAENTITY, Voc.hasEntity);
    };
    m.copy= function(organize) {
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
    };
    return m;
});
