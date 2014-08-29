define(['logger', 'voc', 'underscore', 'data/CopyMachine', 'data/Data' ], function(Logger, Voc, _, CopyMachine, Data){
    var m = Object.create(Data);
    m.init = function(vie) {
        this.LOG.debug("initialize OrganizeData");
        this.vie = vie;
        this.vie.entities.on('add', this.filter, this);
        this.setIntegrityCheck(Voc.belongsToVersion, Voc.VERSION, Voc.hasWidget);
    };
    m.LOG = Logger.get('OrganizeData');
    /** 
     * Filters entities from added entities to vie.entities
     */
    m.filter= function(model, collection, options) {
        if(model.isof(Voc.ORGANIZE)){
            this.checkIntegrity(model, options);
        }
    };
    m.createItem= function(organize, item, options, type, relation) {
        options = options || {};
        this.LOG.debug('options', options);
        if( !item.isEntity) item = new this.vie.Entity(item);
        item.set({
            '@type': type,
        }, options);
        var version = organize.get(Voc.belongsToVersion);
        item.set(Voc.belongsToVersion, version.getSubject(), options);

        this.vie.entities.addOrUpdate(item, {'addOptions' : options});
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
