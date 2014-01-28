define(['logger', 'voc', 'underscore', ], function(Logger, Voc, _, TimelineModel, OrganizeModel) {
    return {
        LOG : Logger.get('CopyMachine'),
        copy: function(entity) {
            if( !entity.isEntity ) return;
            
            var type = entity.get('@type');
            if(type.id) type = entity.vie.namespaces.uri(type.id);

            if(type == entity.vie.namespaces.uri(Voc.TIMELINE)) {
                return require('model/timeline/TimelineModel').copy(entity);
            }
            if(type == entity.vie.namespaces.uri(Voc.ORGANIZE)) {
                return require('model/organize/OrganizeModel').copy(entity);
            }
            var newAttr = _.clone(entity.attributes);
            delete newAttr[entity.idAttribute];
            return new entity.vie.Entity(newAttr);
        }
    };
});
