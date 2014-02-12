define(['logger', 'voc'], function(Logger, Voc){
    return {
        interity:{},
        setIntegrityCheck: function(key, type, foreignKey) {
            this.integrity[key] = [type, foreignKey];
        },
        checkIntegrity: function(model) {
            var key, value, that = this;
            for( var key in this.integrity ) {
                value = model.get(property);
                if( _.isEmpty(value) ) continue;
                if( _.isArray(value) ) {
                    _.each(value, function(v) {
                        that._checkValue(key, value);
                    });
                } else {
                    this._checkValue(key, value);
                }
            }
        },
        _checkValue: function(key, value) {
            var entity, foreign;
            if( !value.isEntity) {
                entity = new this.vie.Entity;
                entity.set(version.idAttribute, value );
                entity.set("@type", this.integrity[key][0]);
                entity.fetch();
                this.vie.entities.addOrUpdate(entity);
            } else if( this.integrity[key][1] ){
                foreign = value.get( this.integrity[key][1] );
                if( _.isArray(foreign)) {
                    var fkeys = [];
                    for( var i = 0; i < foreign.length; i++ ) {
                        if( foreign[i] === value ) return;
                        if( !foreign[i].isEntity && foreign[i] == value.getSubject()) return;
                        fKeys.push(foreign[i].isEntity ? foreign[i].getSubject() : foreign[i]);
                    }
                    fKeys.push(model.getSubject());
                    value.set(this.integrity[key][1], fKeys);
                } else {
                    if( foreign ) {
                        if( foreign === value ) return;
                        if( !foreign.isEntity && foreign == value.getSubject()) return;
                    }
                    value.set(this.integrity[key][1], model.getSubject());
                }
            }
        }
    };
});
