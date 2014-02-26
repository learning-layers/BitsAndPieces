define(['logger', 'voc'], function(Logger, Voc){
    return {
        LOG: Logger.get('Model'),
        integrity:{},
        setIntegrityCheck: function(key, type, foreignKey) {
            this.integrity[key] = {
                'type': type, 
                'foreignKey': foreignKey
            };
        },
        checkIntegrity: function(model) {
            var key;
            this.LOG.debug('checkIntegrity', model);
            this._checkIntegrity(model);
            for( key in this.integrity ) {
                model.on('change:' + model.vie.namespaces.uri(key), this._changeIntegrity, this);
            }
            model.on('destroy', this._removeIntegrity, this);
        },
        // TODO: simplify algorithm by normalizing values to arrays
        _checkIntegrity: function(model) {
            var key, foreign, that = this;
            for( key in this.integrity ) {
                this.LOG.debug('check', key, this.integrity[key]);
                foreign = model.get(key) || [];
                if( !_.isArray(foreign)) foreign = [foreign];
                if( !_.isEmpty(foreign)) {
                    _.each(foreign, function(f) {
                        that._checkValue(model, key, f);
                    });
                }
            }
        },
        _changeIntegrity: function(model) {
            var toRemove, toCheck, key, that = this; 
            for( key in this.integrity ) {
                if( !model.hasChanged(model.vie.namespaces.uri(key))) continue;
                foreign = model.get(key) || [];
                if( !_.isArray(foreign)) foreign = [foreign];

                previous = model.previous(key) || [];
                if( !_.isArray(previous)) previous = [previous];

                toCheck = _.difference(foreign, previous);

                _.each(toCheck, function(c) {
                    that._checkValue(model, key, c);
                });

                if( this.integrity[key].foreignKey ) {
                    toRemove = _.difference(previous, foreign);

                    _.each(toRemove, function(r){
                        that._removeValue(model, key, r);
                    });
                }
            }
        },
        _removeIntegrity: function(model) {
            var key;
            for( key in this.integrity ) {
                if( this.integrity[key].foreignKey ) {
                    foreign = model.get(key);
                    if( !_.isArray(foreign)) foreign = [foreign];
                    _.each(foreign, function(f) {
                        that._removeValue(model, key, f);
                    });
                }

            }
            
        },
        /**
         * Check integrity for given foreign entity
         */
        _checkValue: function(model, key, foreign) {
            var value;
            // If the foreign entity does not exist, 
            // create it with the type associated with key
            if( !foreign.isEntity) {
                value = foreign;
                foreign = new this.vie.Entity;
                foreign.set(foreign.idAttribute, value );
                foreign.set("@type", this.integrity[key].type);
                foreign.fetch();
                this.vie.entities.addOrUpdate(foreign);
            } 

            // If there is a foreignKey 
            if( this.integrity[key].foreignKey ){
                fkEntity = foreign.get( this.integrity[key].foreignKey );
                if( !_.isArray(fkEntity)) fkEntity = [fkEntity];
                var fkeys = [];
                // check that model is contained in foreignKey field
                for( var i = 0; i < fkEntity.length; i++ ) {
                    if( fkEntity[i] && this._isIdentical(fkEntity[i], model)) return;
                }
                // add model reference if not contained
                fKeys.push(model.getSubject());
                foreign.set(this.integrity[key].foreignKey, fKeys);
            }
        },
        _isIdentical: function( entity1, entity2 ) {
            return entity1 === entity2 ||
                !entity1.isEntity && entity2.isEntity &&
                    entity1 == entity2.getSubject() ||
                entity1.isEntity && !entity2.isEntity &&
                    entity1.getSubject() == entity2; 
        },
        /**
         * Removes the foreignKey references of the foreign entity to model.
         */
        _removeValue: function( model, key, foreign ) {
            var fkEntity = foreign.get( this.integrity[key].foreignKey );
            if( !_.isArray(fkEntity)) fkEntity = [fkEntity];
            var fkeys = [];
            // remove model from foreignKey field
            for( var i = 0; i < fkEntity.length; i++ ) {
                if( fkEntity[i] && this._isIdentical(fkEntity[i], model)) continue;
                fKeys.push(fkEntity[i].isEntity ? fkEntity[i].getSubject() : fkEntity[i] );
            }
            foreign.set(this.integrity[key].foreignKey, fKeys);
        }
    };
});
