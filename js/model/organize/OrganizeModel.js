define(['require', 'vie', 'logger', 'tracker', 'underscore' ], function(require, VIE, Logger, tracker, _){
    return VIE.prototype.Entity.extend({
        LOG : Logger.get('OrganizeModel'),
        initialize: function(attributes, options ) {
            this.LOG.debug("initialize ORGANIZEModel");
            if( !options) options = {};
            this.LOG.debug("options",options);
            this.LOG.debug("attributes",attributes);
            // kind of super constructor:
            VIE.prototype.Entity.prototype.initialize.call(this, attributes, options );
            this.circleCollection = options.circleCollection || 
                new this.vie.Collection([], {
                    'vie':this.vie,
                    'predicate': this.vie.namespaces.uri('sss:Circle')
                });
            this.orgaEntityCollection = options.orgaEntityCollection || 
                new this.vie.Collection([], {
                    'vie':this.vie,
                    'predicate': this.vie.namespaces.uri('sss:OrgaEntity')
                });


        },
        createCircle: function(circle, options) {
            options = options || {};
            if( !circle.isEntity) circle = new this.vie.Entity(circle);
            var type = this.get('circleType');
            if( type.isEntity ) type = type.getSubject();
            circle.set({
                '@type': type,
                'organize' : this.getSubject()
            }, _.extend(options, {'silent' : true}));
            this.circleCollection.create(circle, _.extend(options, {'silent' : false}));
            //this.vie.entities.add(circle);
            return circle;
        },
        createEntity: function(entity, options) {
            options = options || {};
            if( !entity.isEntity) entity = new this.vie.Entity(entity);
            var type = this.get('entityType');
            if( type.isEntity ) type = type.getSubject();
            entity.set({
                '@type': type,
                'organize' : this.getSubject()
            }, _.extend(options, {'silent' : true}));
            this.LOG.debug('createEntity', entity.getSubject());
            this.orgaEntityCollection.create(entity,_.extend(options, {'silent' : false}));
            //this.vie.entities.add(entity);
            return entity;
        },
        fetchStuff: function(data) {
            if( !data ) data = {};
            if( !data.data ) data.data = {};
            data.data.organize = this.getSubject();
            this.circleCollection.fetch(data);
            this.orgaEntityCollection.fetch(data);
        },
        clone: function(attributes) {
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

        }
    });
});
