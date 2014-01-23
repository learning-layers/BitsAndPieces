define(['logger', 'voc', 'underscore'], function(Logger, Voc, _) {
    return {
        init : function(vie) {
            this.LOG.debug("initialize Version");
            this.vie = vie;
            this.vie.entities.on('add', this.filter, this);
        },
        LOG : Logger.get('CopyMachine'),
        deepCopy: function(entity, excludeEntity) {
            if( !entity.isEntity ) return;
            var newEntity = entity.clone();
            
            for( var attr in newEntity.attributes ) {
                if( attr[0] != '@' && this.vie.namespaces.isUri(res) ) {
                    var value = newEntity.get(attr);
                    if( value.isEntity && value !== excludeEntity) {
                        var newValue = this.deepCopy(value, excludeEntity);
                        newEntity.set(attr, value.getSubject());
                    }
                }
            }
            this.vie.save({
                'entity' : newEntity
            }).to('sss').execute();
           
        }
    };
});
