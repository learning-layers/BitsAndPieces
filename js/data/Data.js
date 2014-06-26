define(['logger', 'voc', 'underscore'], function(Logger, Voc, _){
    return {
        LOG: Logger.get('Data'),
        setIntegrityCheck: function(key, type, foreignKey) {
            this.integrity = this.integrity || {};
            this.integrity[key] = {
                'type': type, 
                'foreignKey': foreignKey
            };
        },
        checkIntegrity: function(model, options) {
            var key;
            this._checkIntegrity(model, options);
            for( key in this.integrity ) {
                model.on('change:' + model.vie.namespaces.uri(key), this._changeIntegrity, this);
            }
            model.on('destroy', this._removeIntegrity, this);
        },
        _checkIntegrity: function(model, options) {
            this.LOG.debug('checkIntegrity', model);
            var key, foreign, that = this;
            for( key in this.integrity ) {
                this.LOG.debug('check', key, this.integrity[key]);
                foreign = model.get(key) || [];
                if( !_.isArray(foreign)) foreign = [foreign];
                if( !_.isEmpty(foreign)) {
                    _.each(foreign, function(f) {
                        that._checkValue(model, key, f, options);
                    });
                }
            }
        },
        _changeIntegrity: function(model, value, options) {
            this.LOG.debug('changeIntegrity', model, options);
            var toRemove, toCheck, key, that = this; 
            for( key in this.integrity ) {
                if( !model.hasChanged(model.vie.namespaces.uri(key))) continue;
                this.LOG.debug('check', key, this.integrity[key]);
                foreign = model.get(key) || [];
                if( !_.isArray(foreign)) foreign = [foreign];

                previous = model.previous(key) || [];
                if( !_.isArray(previous)) previous = [previous];

                toCheck = _.difference(foreign, previous);

                _.each(toCheck, function(c) {
                    that._checkValue(model, key, c, options);
                });

                toRemove = _.difference(previous, foreign);

                _.each(toRemove, function(r){
                    that._removeValue(r, key, model, options);
                });

                if( this.integrity[key].foreignKey ) {
                    _.each(toRemove, function(r){
                        that._removeForeignValue(model, key, r, options);
                    });
                }
            }
        },
        _removeIntegrity: function(model, collection, options) {
            this.LOG.debug('removeIntegrity', model);
            var key,
                that;
            that = this;
            for( key in this.integrity ) {
                if( this.integrity[key].foreignKey ) {
                    this.LOG.debug('check', key, this.integrity[key].foreignKey);
                    foreign = model.get(key) || [];
                    if( !_.isArray(foreign)) foreign = [foreign];
                    _.each(foreign, function(f) {
                        that._removeForeignValue(model, key, f, options);
                    });
                }

            }
            
        },
        /**
         * Check integrity for given foreign entity
         */
        _checkValue: function(model, key, foreign, options) {
            this.LOG.debug('_checkValue', key, _.clone(foreign), options);
            // If the foreign entity does not exist, 
            // create it with the type associated with key
            if( !foreign.isEntity) {
                this.LOG.debug('foreign is not Entity');
                var value = foreign;
                foreign = new this.vie.Entity;
                foreign.set(foreign.idAttribute, value );
                if( this.integrity[key].type ) {
                    foreign.set("@type", this.integrity[key].type);
                }
                this.vie.entities.addOrUpdate(foreign);
            } 

            // If there is a foreignKey 
            if( this.integrity[key].foreignKey ){
                var fValue = foreign.get( this.integrity[key].foreignKey ) || [];
                this.LOG.debug('foreign got a foreignKey', this.integrity[key].foreignKey, fValue);
                if( !_.isArray(fValue)) fValue = [fValue];
                var fValues = [];
                // check that model is contained in foreignKey field
                for( var i = 0; i < fValue.length; i++ ) {
                    if( fValue[i] && this._isIdentical(fValue[i], model)) return;
                    fValues.push(fValue[i].isEntity ? fValue[i].getSubject() : fValue[i] );
                }
                // add model reference if not contained
                this.LOG.debug('add model to foreign', model.getSubject());
                fValues.push(model.getSubject());
                foreign.set(this.integrity[key].foreignKey, fValues.length > 1 ? fValues : fValues[0], options);
            } 
            // if the foreign entity is destroyed, remove it from this model
            foreign.on('destroy', function() {this._removeValue(model, key, foreign)}, this);

        },
        _isIdentical: function( entity1, entity2 ) {
            return entity1 === entity2 ||
                !entity1.isEntity && entity2.isEntity &&
                    entity1 == entity2.getSubject() ||
                entity1.isEntity && !entity2.isEntity &&
                    entity1.getSubject() == entity2; 
        },
        /**
         * Remove foreign from key of model.
         */
        _removeValue: function( model, key, foreign, options) {
            if(_.isEmpty(foreign) ) return;
            var value = model.get(key) || [];
            if( !_.isArray(value)) value = [value];
            if(_.isEmpty(value) ) return;
            var values = [];
            for( var i = 0; i < value.length; i++ ) {
                if( !value[i] || this._isIdentical(value[i], foreign)) continue;
                values.push(value[i].isEntity ? value[i].getSubject() : value[i] );
            }
            model.set(key, values.length > 1 ? values : values[0], options);
        },
        /**
         * Removes the foreignKey references of the foreign entity to model.
         */
        _removeForeignValue: function( model, key, foreign, options ) {
            var fValue = foreign.get( this.integrity[key].foreignKey ) || [];
            this.LOG.debug('_removeForeignValue', key, _.clone(foreign), _.clone(fValue));
            if( !_.isArray(fValue)) fValue = [fValue];
            var fValues = [];
            // remove model from foreignKey field
            for( var i = 0; i < fValue.length; i++ ) {
                if( !fValue[i] || this._isIdentical(fValue[i], model)) continue;
                fValues.push(fValue[i].isEntity ? fValue[i].getSubject() : fValue[i] );
            }
            this.LOG.debug('_newKeys', fValues);
            foreign.set(this.integrity[key].foreignKey, fValues.length > 1 ? fValues : fValues[0], options);
        }
    };
});
