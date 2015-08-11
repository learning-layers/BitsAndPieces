define(['logger', 'underscore', 'voc', 'vie'], function(Logger, _, Voc, VIE){
    AppLog = Logger.get('App');
    AddLog = Logger.get('Add');
    return {
        syncByVIE : function(v) {
            v.Entity.prototype.sync = function(method, model, options ) {
                AppLog.debug("sync entity " + model.getSubject() + " by " + method);
                if( !options) options = {};
                AppLog.debug("options", options);
                AppLog.debug("model", model);
                var that = this;
                switch(method) {
                    case 'create':
                        // ???
                        break;
                    case 'read':
                        this.vie.onUrisReady(
                            model.getSubject(),
                            function(modelUri) {
                                that.vie.load({
                                    'service' : 'entityDescGet',
                                    'data' : _.extend(options.data || {}, {
                                        'entity': modelUri,
                                        'setTags' : true,
                                        'setThumb' : true,
                                        'setFlags' : true
                                    })
                                }).from('sss').execute().success(function(readEntity){
                                    AppLog.debug("entity was read");
                                    AppLog.debug("readEntity", readEntity);
                                    model.set(readEntity)
                                    if(options.success) 
                                        options.success(readEntity);
                                });
                            }
                        );

                        break;
                    case 'update':
                        this.vie.onUrisReady(
                            model.getSubject(),
                            function(modelUri) {
                                that.vie.save({
                                    'service': 'entityUpdate',
                                    'data' : _.extend(options.data || {}, {
                                        'entity' : modelUri,
                                        'label' : model.get(Voc.label),
                                        'description' : model.get(Voc.description)
                                    })
                                }).to('sss').execute().success(function(result){
                                    AppLog.debug("entity updated");
                                    if(options.success) 
                                        options.success(result);
                                }).fail(function(result) {
                                    if(options.error)
                                        options.error(result);
                                });
                            }
                        );
                        break;
                    case 'delete':
                        // ???
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
        /**
         * Waits for the given blank node references in arguments to turn into URIs.
         * Then executes the last argument as a callback with the adapted arguments as parameter.
         */
        addOnUrisReady : function(v) {
            v.onUrisReady = function() {
                var that = this,
                    wait = false,
                    args = _.initial(arguments),
                    callback = _.last(arguments),
                    entity;
                _.each(args, function(arg) {
                    if( wait || !arg ) return;
                    wait = VIE.Util.isBlankNode(arg);
                });
                if( !wait ) {
                    callback.apply(this, args);
                    return;
                }

                // there is some blank node reference:
                var j, waitFor = 0;
                _.each(args, function(arg) {
                    if( !arg ) return;

                    if( VIE.Util.isBlankNode(arg) ) {
                        entity = that.entities.get(arg);
                        if( !entity ) return;

                        var func = function(ent, value) {
                            // replace argument by new URI
                            for( j = 0; j < args.length; j++ ) {
                                if( args[j] === arg ) {
                                    args[j] = that.namespaces.uri(value);
                                }
                            };
                            if( --waitFor == 0 ) {
                                callback.apply(that, args);
                            }
                            // turn off listener
                            entity.off('change:'+entity.idAttribute, func);
                        };
                        // add listener
                        entity.on('change:' + entity.idAttribute, func);
                        waitFor++;
                        if( !VIE.Util.isBlankNode(entity.getSubject()) )  {
                            func(entity, entity.getSubject());
                        }
                    }
                });
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
