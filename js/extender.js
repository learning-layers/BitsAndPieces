define(['logger', 'underscore'], function(Logger, _){
    AppLog = Logger.get('App');
    AddLog = Logger.get('Add');
    return {
        syncByVIE : function(v) {
            v.Entity.prototype.sync = function(method, model, options ) {
                AppLog.debug("sync entity " + model.getSubject() + " by " + method);
                if( !options) options = {};
                AppLog.debug("options", options);
                AppLog.debug("model", model);
                switch(method) {
                    case 'create':
                        this.vie.save({
                            'entity': model
                        }).to('sss').execute().success(function(savedEntity){
                            AppLog.debug("entity created");
                            AppLog.debug("savedEntity", savedEntity);
                            model.set('@subject', savedEntity['uri'], {'silent':false});
                            if(options.success) 
                                options.success(model);
                        });
                        break;
                    case 'read':
                        this.vie.load({
                            'resource' : model.getSubject(),
                            'data' : options.data
                        }).from('sss').execute().success(function(readEntity){
                            AppLog.debug("entity was read");
                            AppLog.debug("readEntity", readEntity);
                            model.set(readEntity)
                            if(options.success) 
                                options.success(readEntity);
                        })
                        break;
                    case 'update':
                        this.vie.save({
                            'entity': model
                        }).to('sss').execute().success(function(savedEntity){
                            AppLog.debug("entity updated");
                            if(options.success) 
                                options.success(savedEntity);
                        });
                        break;
                    case 'delete':
                        this.vie.remove({
                            'entity': model
                        }).from('sss').execute().success(function(savedEntity){
                            AppLog.debug("entity removed");
                            if(options.success) 
                                options.success(savedEntity);
                        });
                        break;
                }
            };

            v.Collection.prototype.sync = function(method, collection, options ) {
                AppLog.debug("sync collection by " + method);
                AppLog.debug("options", options);
                options = options || {'parse':false};
                switch(method) {
                    case 'create':
                        // ???
                        break;
                    case 'read':
                        this.vie.load(_.extend(options.data, {
                            'type' : this.predicate
                        })).from('sss').execute().success(function(readEntities){
                            AppLog.debug("entities were read for ", collection);
                            AppLog.info("readEntities", readEntities);
                            //collection.add(readEntities);
                            //AppLog.debug("added to ", collection);
                            if(options.success)
                                //options.ssuccess(collection, readEntities, options);
                                options.success(readEntities);
                        })
                        break;
                    case 'update':
                        // ???
                        break;
                    case 'delete':
                        // ???
                        break;
                }

            };
        },
        autoResolveReferences: function(v) {
            v.Collection.prototype.set = function(models, options) {
                AddLog.info("adding to collection ", this.predicate);
                if (!_.isArray(models)) models = models ? [models] : [];
                for (var i = 0, l = models.length; i < l; i++) {
                    var model = models[i];
                    AddLog.info("model", model);

                    var attributes;
                    if ( model.attributes ) attributes = model.attributes;
                    else attributes = model;

                    // make sure each uri refers to a model object
                    AddLog.debug("resolving references to objects of " + attributes[VIE.prototype.Entity.prototype.idAttribute]);
                    for( var attr in attributes ) {
                        var res = attributes[attr];
                        if( attr[0] != '@' && this.vie.namespaces.isUri(res) ) {
                            AddLog.debug(attr + ":" + res );
                            if( !this.vie.entities.get(res) )
                                //this.vie.entities.addOrUpdate(new this.vie.Entity({//SSS.Entity({
                                this.vie.entities.set({//SSS.Entity({
                                    '@subject' : res
                                }, {'remove': false});
                        }
                    }
                    if(this !== this.vie.entities)
                        //this.vie.entities.addOrUpdate(model);
                        this.vie.entities.set(model, {'remove': false});
                }
                AddLog.debug("adding to original collection", this, models);
                return Backbone.Collection.prototype.set.call(this, models, options);
                //return this.addOrUpdate( model, options);
            }
        }
    };
});
