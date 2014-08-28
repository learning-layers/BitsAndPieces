// The SocialSemanticService wraps the SSS REST API v3.4.0

define(['logger', 'vie', 'underscore', 'voc', 'service/SocialSemanticServiceModel', 'jquery'], 
        function(Logger, VIE, _, Voc, SSSModel, $) {

// ## VIE.SocialSemanticService(options)
// This is the constructor to instantiate a new service.
// **Parameters**:
// *{object}* **options** Optional set of fields.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.SocialSemanticService}* : A **new** VIE.SocialSemanticService instance.
// **Example usage**:
//
//     var ssService = new vie.SocialSemanticService({<some-configuration>});
    VIE.prototype.SocialSemanticService = function(options) {
        var defaults = {
            'namespaces' : {
                'sss' : "http://20130930devDays.ll/",
                'evernote' : 'https://www.evernote.com/'
            }
        };
        /* the options are merged with the default options */
        this.options = jQuery.extend(true, defaults, options ? options : {});

        this.views = [];
        this.templates = {};

        this.vie = null; /* will be set via VIE.use(); */
        /* overwrite options.name if you want to set another name */
        this.name = this.options.name;
        
        this.user = this.options.user;
        this.userKey = this.options.userKey;

        this.buffer = {};
        
        if ( !this.user || !this.userKey )
            throw Error("No user/userKey given for SocialSemanicService");
    };

    VIE.prototype.SocialSemanticService.prototype = {

        LOG : Logger.get('SocialSemanticService'),
// ### init()
// This method initializes certain properties of the service and is called
// via ```VIE.use()```.
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.SocialSemanticService}* : The VIE.SocialSemanticService instance itself.
// **Example usage**:
//
//     var ssService = new vie.SocialSemanticService({<some-configuration>});
//     ssService.init();
//
        types: {
            THING : "owl:Thing",
            TIMELINE : "Timeline",
            ORGANIZE : "Organize",
            USEREVENT : "userEvent",
            EPISODE: "Episode",
            VERSION: "Version",
            USER: "user",
            ORGAENTITY: "OrgaEntity",
            CIRCLE: "Circle",
            WIDGET: "Widget",
            DOCUMENT: "Document"
        },
        pendingCalls: {},
        pendingCallsCount : 0,
        init: function() {
            for (var key in this.options.namespaces) {
                var val = this.options.namespaces[key];
                this.vie.namespaces.add(key, val);
            }
            this.hostREST = this.options.hostREST;
            if( !this.hostREST) {
                throw new Error("no REST endpoint for SocialSemanticService defined");
            }
        },
        resolve: function(serviceCall, resultHandler, errorHandler, params) {
            this.LOG.debug('resolve', this);
            var i = 0;
            var that = this;
            var found;
            this.LOG.debug('resolve', serviceCall, params);
            if( this.pendingCalls[serviceCall] ) {
                if( found = this.findPendingCall(serviceCall, params)) {
                    this.LOG.debug('resolve params found');
                    found.resultHandlers.push(resultHandler);
                    found.errorHandlers.push(errorHandler);
                    return;
                }
            } else {
                this.pendingCalls[serviceCall] = {};
            }
            var p = {
                'params' : _.clone(params), 
                'resultHandlers' : [resultHandler],
                'errorHandlers' : [errorHandler]
            };
            var pos = this.pendingCallsCount++;
            this.pendingCalls[serviceCall][pos] = p;
            this.LOG.debug('resolve pos', pos);
            this.send(serviceCall, params || {},
                    function(result) {
                        delete that.pendingCalls[serviceCall][pos];
                        that.LOG.debug("resolve resultHandlers", p);
                        _.each(p.resultHandlers, function(f) {
                            f(result);
                        });
                    },
                    function(result) {
                        delete that.pendingCalls[serviceCall][pos];
                        _.each(p.errorHandlers, function(f) {
                            f(result);
                        });
                    });
                    
        },
        findPendingCall: function(serviceCall, params) {
            for( var fp in this.pendingCalls[serviceCall] ) {
                if( _.isEqual(this.pendingCalls[serviceCall][fp].params, params) ) {
                    return this.pendingCalls[serviceCall][fp];
                }
            }
        }, /* AJAX request wrapper */
        send : function(op, par, success, error ){
            this.LOG.debug('par', par);
            var sss = this;
            this.vie.onUrisReady(
                this.user, 
                function(userUri) {
                    $.ajax({
                        'url' : sss.hostREST + op + "/",
                        'type': "POST",
                        'data' : JSON.stringify(_.extend(par, {
                            'op': op,
                            'user' : userUri || "mailto:dummyUser",
                            'key' : sss.userKey || "someKey"
                        })),
                        'contentType' : "application/json",
                        'async' : true,
                        'dataType': "application/json",
                        'complete' : function(jqXHR, textStatus) {

                            if( jqXHR.readyState !== 4 || jqXHR.status !== 200){
                                sss.LOG.error("sss json request failed");
                                return;
                            }

                            var result = $.parseJSON(jqXHR.responseText); 

                            if( result.error ) {
                                if( error ) error(result);
                                return;
                            }
                            success(result[op]);
                        }
                    });
                }
            );
        },

        getService: function(serviceName) {
            if( !SSSModel[serviceName] ) {
                throw new Error(serviceName + ' not found');
            }
            return SSSModel[serviceName];
        },

        decorateResult: function(able, result, service) {
            var sss = this,
                resultSet;
            this.LOG.debug('decorateResult', result, service);
            if( !_.isArray(result[service['resultKey']] )) {
                resultSet = [result[service['resultKey']]];
            } else {
                resultSet = result[service['resultKey']];
            }

            this.LOG.debug('resultSet', resultSet);

            _.each(resultSet, function(item) {
                sss.LOG.debug('item', item);
                // recursion
                if( service['subResults'] ) {
                    _.each(service['subResults'], function(subService) {
                        sss.decorateResult(able, item, subService);
                    });
                }
                if( service['decoration']) {
                    var i = 0, decorator;
                    for ( ; i < service['decoration'].length; i++) {
                        decorator = service['decoration'][i];
                        // invoke decorator with loadable as context on result and result meta data
                        if( !decorator.call(able, item, service['@id'], service['@type'] ) ) {
                            return;
                        }
                    }
                }
            });
        },

        invoke: function(able) {
            var params = able.options.data || {};

            var serviceName = able.options.service;
            var sss = this;
            var service = this.getService(serviceName);
            this.LOG.debug("service", service);
            if( service['preparation'] ) {
                _.each(service['preparation'], function(preparator) {
                    preparator.call(sss, params, service);
                });
            }
            this.LOG.debug('params', params);
            this.resolve(serviceName,
                function(result) {
                    sss.LOG.debug('result', result);
                    // TODO change to call in context of service, not able
                    sss.decorateResult(able, result, service);
                    able.resolve(result[service['resultKey']]);
                },
                function(result) {
                    able.reject(able.options);
                    sss.LOG.error('error:', result);
                },
                params
            );
        },

        analyze: function(analyzable) {
            var correct = analyzable instanceof this.vie.Analyzable 
            if (!correct) {
                throw new Error("Invalid Analyzable passed");
            }
            var sss = this;
            if ( analyzable.options.service == "entityShare" ) {
                var params = {
                    'entity' : analyzable.options.entity,
                    'users' : analyzable.options.users.join(',')
                };
                if( analyzable.options.comment ) {
                    params['comment'] = analyzable.options.comment;
                }
                sss.resolve('entityShare', 
                    function(object) {
                        sss.LOG.debug("entityShare success", object);
                    },
                    function(object) {
                        sss.LOG.debug("entityShare failed", object);
                    },
                    params
                );
            } else if ( analyzable.options.service == "entityCopy" ) {
                var params = {
                    'entity' : analyzable.options.entity,
                    'users' : analyzable.options.users.join(',')
                };
                if( analyzable.options.exclude ) {
                    params['entitiesToExclude'] = analyzable.options.exclude.join(',');
                }
                if( analyzable.options.comment ) {
                    params['comment'] = analyzable.options.comment;
                }
                sss.resolve('entityCopy', 
                    function(object) {
                        sss.LOG.debug("entityCopy success", object);
                    },
                    function(object) {
                        sss.LOG.debug("entityCopy failed", object);
                    },
                    params
                );
            } else if ( analyzable.options.service == "recommTagsBasedOnUserEntityTagTime" ) {
                var params = {};
                if( analyzable.options.forUser ) {
                    params['forUser'] = analyzable.options.forUser;
                }
                if( analyzable.options.entity ) {
                    params['entity'] = analyzable.options.entity; 
                }
                params['maxTags'] = analyzable.options.maxTags || 20;
                sss.resolve('scaffRecommTagsBasedOnUserEntityTagTime', 
                    function(object) {
                        sss.LOG.debug("recommTagsBasedOnUserEntityTagTime success", object);
                        analyzable.resolve(object.tags || []);
                    },
                    function(object) {
                        sss.LOG.debug("recommTagsBasedOnUserEntityTagTime failed", object);
                        analyzable.reject(object);
                    },
                    params
                );
            } else if ( analyzable.options.service == "ueCountGet" ) {
                var params = {};
                if( analyzable.options.forUser ) {
                    params['forUser'] = analyzable.options.forUser;
                }
                if( analyzable.options.entity ) {
                    params['entity'] = analyzable.options.entity;
                }
                if( analyzable.options.startTime ) {
                    params['startTime'] = analyzable.options.startTime;
                }
                if( analyzable.options.endTime ) {
                    params['endTime'] = analyzable.options.endTime;
                }
                if( analyzable.options.type ) {
                    params['type'] = analyzable.options.type;
                }
                sss.resolve('uECountGet', 
                    function(object) {
                        sss.LOG.debug("ueCountGet success", object);
                        analyzable.resolve(object.count || 0);
                    },
                    function(object) {
                        sss.LOG.debug("ueCountGet failed", object);
                        analyzable.reject(object);
                    },
                    params
                );
            }

        },
        load: function(loadable) {
            var correct = loadable instanceof this.vie.Loadable || loadable instanceof this.vie.Analyzable;
            if (!correct) {
                throw new Error("Invalid Loadable passed");
            }
            //if( !loadable.options.connector )
                //throw new Error("No connector given");
            this.LOG.debug("SocialSemanticService load");
            this.LOG.debug("loadable",loadable.options);
            try{
                this.invoke(loadable);
            } catch(e) {
                this.LOG.error(e);
            }
        },

        save: function(savable) {
            var correct = savable instanceof this.vie.Savable;
            if (!correct) {
                throw "Invalid Savable passed";
            }

            this.LOG.debug("SocialSemanticService save");
            this.LOG.debug("savable.options", savable.options);

            try{
                this.invoke(savable);
                return;
            }catch(e) {
                this.LOG.error(e);
            }

            var entity = savable.options.entity;

            this.LOG.debug("entity", entity, " is of ", entity.get("@type"));

            var sss = this;

            if ( entity.isof(Voc.ENTITY) || entity.isof(Voc.FILE)
                    || entity.isof(Voc.EVERNOTE_RESOURCE) || entity.isof(Voc.EVERNOTE_NOTE)
                    || entity.isof(Voc.EVERNOTE_NOTEBOOK) ) {
                if( savable.options.tag ) {
                    this.vie.onUrisReady(
                        entity.getSubject(),
                        function(entityUri) {
                            sss.resolve('tagAdd', 
                                function(object) {
                                    sss.LOG.debug('result addTag', object);
                                    savable.resolve(object);
                                },
                                function(object) {
                                    sss.LOG.warn('failed addTag', object);
                                    savable.reject(object);
                                },
                                {
                                    'entity' : entityUri,
                                    'label' : savable.options.tag,
                                    'space' : 'privateSpace' // XXX need to determine space!
                                }
                            );
                        }
                    );
                } else if ( savable.options.label ) {
                    this.vie.onUrisReady(
                        entity.getSubject(),
                        function(entityUri) {
                            sss.resolve('entityUpdate', 
                                function(object) {
                                    sss.LOG.debug('result entity setLabel', object);
                                    savable.resolve(object);
                                },
                                function(object) {
                                    sss.LOG.debug('railed entity setLabel', object);
                                    savable.reject(entity);
                                },
                                {
                                    'entity' : entityUri,
                                    'label' : savable.options.label
                                }
                            );
                        }
                    );
                } else if ( savable.options.importance ) {
                    this.vie.onUrisReady(
                        entity.getSubject(),
                        function(entityUri) {
                            sss.resolve('flagsSet', 
                                function(object) {
                                    sss.LOG.debug('setImportance success', object);
                                    savable.resolve(object);
                                },
                                function(object) {
                                    sss.LOG.debug('setImportance fail', object);
                                    savable.reject(entity);
                                },
                                {
                                    'entities' : entityUri,
                                    'types' : 'importance',
                                    'value' : savable.options.importance
                                }
                            );
                        }
                    );
                }
                
            } else {
                this.LOG.warn("SocialSemanticService save for " + type.id + " not implemented");
            }
        },

        remove: function(removable) {
            var correct = removable instanceof this.vie.Removable;
            if (!correct) {
                throw "Invalid Removable passed";
            }
            if ( !removable.options.entity ) 
                throw "Unable to write to server, no entity given";

            this.LOG.debug("SocialSemanticService save");
            this.LOG.debug("removable.options", removable.options);

            var entity = removable.options.entity;

            this.LOG.debug("entity", entity, " is of ", entity.get("@type"));

            var sss = this;

            if( entity.isof(Voc.CIRCLE )) {
                this.vie.onUrisReady(
                    entity.getSubject(),
                    function(uriUri){
                        sss.resolve('learnEpVersionRemoveCircle', 
                            function(object) {
                                sss.LOG.debug("handle result of LearnEpVersionRemoveCircle");
                                sss.LOG.debug("object", object);
                                removable.resolve(object);
                            },
                            function(object) {
                                sss.LOG.warn("error:");
                                sss.LOG.warn("object", object);
                                removable.reject(entity);
                            },
                            {'learnEpCircle' : uriUri}
                        );
                });
            } else if( entity.isof(Voc.ORGAENTITY )) {
                this.vie.onUrisReady(
                    entity.getSubject(),
                    function(uriUri){
                        sss.resolve('learnEpVersionRemoveEntity', 
                            function(object) {
                                sss.LOG.debug("handle result of LearnEpVersionRemoveEntity");
                                sss.LOG.debug("object", object);
                                removable.resolve(object);
                            },
                            function(object) {
                                sss.LOG.warn("error:");
                                sss.LOG.warn("object", object);
                                removable.reject(entity);
                            },
                            {'learnEpEntity' : uriUri}
                        );
                });
            } else if ( entity.isof(Voc.ENTITY) || entity.isof(Voc.FILE)
                    || entity.isof(Voc.EVERNOTE_RESOURCE) || entity.isof(Voc.EVERNOTE_NOTE)
                    || entity.isof(Voc.EVERNOTE_NOTEBOOK) ) {
                if( removable.options.tag ) {
                    this.vie.onUrisReady(
                        entity.getSubject(),
                        function(entityUri) {
                            sss.resolve('tagsRemove', 
                                function(object) {
                                    sss.LOG.debug('result removeTag', object);
                                    removable.resolve(object);
                                },
                                function(object) {
                                    sss.LOG.warn('failed removeTag', object);
                                    removable.reject(object);
                                },
                                {
                                    'entity' : entityUri,
                                    'label' : removable.options.tag
                                }
                            );
                        }
                    );
                }
            } else {
                this.LOG.warn("SocialSemanticService remove for " + type.id + " not implemented");
            }

        },


    };

    return VIE.prototype.SocialSemanticService;

});


