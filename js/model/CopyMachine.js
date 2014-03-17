define(['logger', 'voc', 'underscore', ], function(Logger, Voc, _, TimelineData, OrganizeData) {
    return {
        LOG : Logger.get('CopyMachine'),
        copy: function(entity, overrideAttributes) {
            if( !entity.isEntity ) return;
            
            var type = entity.get('@type');
            if(type.id) type = entity.vie.namespaces.uri(type.id);

            if(type == entity.vie.namespaces.uri(Voc.TIMELINE)) {
                return require('model/timeline/TimelineData').copy(entity, overrideAttributes);
            }
            if(type == entity.vie.namespaces.uri(Voc.ORGANIZE)) {
                return require('model/organize/OrganizeData').copy(entity, overrideAttributes);
            }
            var newAttr = _.clone(entity.attributes);
            delete newAttr[entity.idAttribute];
            newAttr = _.extend(newAttr, overrideAttributes || {});
            var newEntity = new entity.vie.Entity(newAttr);
            entity.vie.entities.addOrUpdate(newEntity);
            newEntity.save();
            return newEntity;
        }
    };
});
