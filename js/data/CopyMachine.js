define(['logger', 'voc', 'underscore', ], function(Logger, Voc, _, TimelineData, OrganizeData) {
    return {
        LOG : Logger.get('CopyMachine'),
        copy: function(entity, overrideAttributes) {
            if( !entity.isEntity ) return;
            
            if(entity.isof(Voc.TIMELINE)) {
                return require('data/timeline/TimelineData').copy(entity, overrideAttributes);
            }
            if(entity.isof(Voc.ORGANIZE)) {
                return require('data/organize/OrganizeData').copy(entity, overrideAttributes);
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
