define(['logger', 'voc', 'underscore', 'data/CopyMachine', 'data/Data' ], function(Logger, Voc, _, CopyMachine, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize OrganizeData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasWidget);
        this.setIntegrityCheck(Voc.hasCircle, Voc.CIRCLE);
        this.setIntegrityCheck(Voc.hasEntity, Voc.ORGAENTITY);
    };
    m.LOG = Logger.get('OrganizeData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.ORGANIZE)){
            this.checkIntegrity(model, options);
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
        }, options);
        item.set(Voc.belongsToOrganize, organize.getSubject(), options);

        this.vie.entities.addOrUpdate(item, {'addOptions' : options});
        //var items = Backbone.Data.prototype.get.call(
            //organize, this.vie.namespaces.uri(relation)) || [];
        //if(!_.isArray(items)) items = [items];
        //else items = _.clone(items);
        //items.push(item.getSubject());
        //organize.set(relation, items, options);
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
            'type' : this.vie.types.get(type)
        }).from('sss').execute().success(
            function(items) {
                that.LOG.debug('items fetched', items);
                _.each(items, function(item){
                    item[Voc.belongsToOrganize] = organize.getSubject();
                });
                items = that.vie.entities.addOrUpdate(items);
                // Loading entities in case type is Organize Entity
                if ( type == Voc.ORGAENTITY ) {
                    var entityUris = [];
                    _.each(items, function(item){
                        var entity = item.get(Voc.hasResource);
                        if( entity.isEntity) entity = entity.getSubject();
                        entityUris.push(entity);
                    });

                    if ( !_.isEmpty(entityUris) ) {
                        that.fetchData(entityUris);
                    }
                }
            }
        );
    };
    m.fetchCircles= function(organize) {
        this.fetchStuff(organize, Voc.CIRCLE, Voc.hasCircle);
    };
    m.fetchEntities= function(organize) {
        this.fetchStuff(organize, Voc.ORGAENTITY, Voc.hasEntity);
    };
    m.copy= function(organize, overrideAttributes) {
        var newAttr = _.clone(organize.attributes);
        delete newAttr[organize.idAttribute];
        delete newAttr[this.vie.namespaces.uri(Voc.hasCircle)];
        delete newAttr[this.vie.namespaces.uri(Voc.hasEntity)];
        newAttr = _.extend(newAttr, overrideAttributes || {});
        
        var newOrganize = new this.vie.Entity(newAttr);
        this.vie.entities.addOrUpdate(newOrganize);
        newOrganize.save();
        var that = this;
        _.each([Voc.hasCircle, Voc.hasEntity], function(rel) {
            var items = organize.get(rel) || [];
            if(!_.isArray(items)) items = [items];
            var newItems = [];
            _.each(items,function(item){
                var overrideAttributes = {};
                overrideAttributes[that.vie.namespaces.uri(Voc.belongsToOrganize)] 
                    = newOrganize.getSubject();
                var newItem = CopyMachine.copy(item, overrideAttributes);
                newItems.push( newItem.getSubject() );
            });
            newOrganize.set(rel, newItems);
        });
        return newOrganize;
    };
    m.fetchData = function(entityUris) {
        var that = this;
        this.vie.load({
            'service' : 'entityDescsGet',
            'data' : {
                'entities' : entityUris
            }
        }).from('sss').execute().success(function(entities) {
            that.vie.entities.addOrUpdate(entities);
        });
    };
    return m;
});
