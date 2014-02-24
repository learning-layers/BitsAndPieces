define(['logger', 'voc'], function(Logger, Voc){
    return {
        integrity:{},
        setIntegrityCheck: function(key, type, foreignKey) {
            this.integrity[key] = {
                'type': type, 
                'foreignKey': foreignKey
            };
        },
        checkIntegrity: function(model) {
            var key, value, that = this;
            for( var key in this.integrity ) {
                value = model.get(property);
                previous = model.previous(property);
                if( _.isEmpty(value) && _.isEmpty(previous)) continue;
                if( _.isArray(value) ) {
                    _.each(value, function(v) {
                        that._checkValue(key, v);
                    });
                } else {
                    this._checkValue(key, value);
                    if( this.integrity[key].foreignKey ) {
                        
                    }
                }
            }
        },
        _checkValue: function(key, value) {
            var entity, foreign;
            if( !value.isEntity) {
                entity = new this.vie.Entity;
                entity.set(entity.idAttribute, value );
                entity.set("@type", this.integrity[key].type);
                if( this.integrity[key].foreignKey ) {
                    entity.set(this.integrity[key].foreignKey, entity.getSubject());
                }
                entity.fetch();
                this.vie.entities.addOrUpdate(entity);
            } else if( this.integrity[key].foreignKey ){
                foreign = value.get( this.integrity[key].foreignKey );
                if( _.isArray(foreign)) {
                    var fkeys = [];
                    for( var i = 0; i < foreign.length; i++ ) {
                        if( foreign[i] === value ) return;
                        if( !foreign[i].isEntity && foreign[i] == value.getSubject()) return;
                        fKeys.push(foreign[i].isEntity ? foreign[i].getSubject() : foreign[i]);
                    }
                    fKeys.push(model.getSubject());
                    value.set(this.integrity[key].foreignKey, fKeys);
                } else {
                    if( foreign ) {
                        if( foreign === value ) return;
                        if( !foreign.isEntity && foreign == value.getSubject()) return;
                    }
                    value.set(this.integrity[key].foreignKey, model.getSubject());
                }
            }
        }
    };
});
