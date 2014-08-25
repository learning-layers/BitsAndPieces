// The SocialSemanticService wraps the SSS Client API.

define(['logger', 'vie', 'underscore', 'voc', 'view/sss/EntityView', 'jquery',
        'sss.conns'], function(Logger, VIE, _, Voc, EntityView, $) {

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
        /**
         * Waits for the given blank node references in arguments to turn into URIs.
         * Then executes the last argument as a callback with the adapted arguments as parameter.
         */
        onUrisReady: function() {
            this.LOG.debug('onUrisReady', _.clone(arguments));
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
                this.LOG.debug('callback immediately, args = ', args);
                callback.apply(this, args);
                return;
            }

            // there is some blank node reference:
            var j, waitFor = 0;
            _.each(args, function(arg) {
                that.LOG.debug('parsing arg', arg);
                if( !arg ) return;

                if( VIE.Util.isBlankNode(arg) ) {
                    entity = that.vie.entities.get(arg);
                    if( !entity ) return;

                    that.LOG.debug('change listener for', entity );
                    
                    var func = function(ent, value) {
                        that.LOG.debug('changed from ', arg, 'to', value);
                        // replace argument by new URI
                        for( j = 0; j < args.length; j++ ) {
                            if( args[j] === arg ) {
                                args[j] = that.vie.namespaces.uri(value);
                            }
                        };
                        that.LOG.debug('args = ', _.clone(args));
                        that.LOG.debug('waitFor = ', waitFor);
                        if( --waitFor == 0 ) {
                            callback.apply(that, args);
                        }
                        // turn off listener
                        entity.off('change:'+entity.idAttribute, func);
                    };
                    // add listener
                    entity.on('change:' + entity.idAttribute, func);
                    waitFor++;
                    that.LOG.debug('waitFor = ', waitFor);
                    if( !VIE.Util.isBlankNode(entity.getSubject()) )  {
                        that.LOG.debug('URI changed meanwhile, so go on immediately');
                        func(entity, entity.getSubject());
                    }
                }
            });
        },
        resolve: function() {
            this.LOG.debug('resolve', this);
            var i = 0;
            var serviceCall;
            var resultHandler;
            var errorHandler;
            var params = [];
            for( var prop in arguments ) {
                if( i == 0 ) { serviceCall = arguments[i]; }
                if( i == 1 ) { resultHandler = arguments[i]; }
                if( i == 2 ) { errorHandler = arguments[i]; }
                if( i > 2 ) {
                    params.push(arguments[i]);
                }
                i++;
            }
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
                'params' : params, 
                'resultHandlers' : [resultHandler],
                'errorHandlers' : [errorHandler]
            };
            var pos = this.pendingCallsCount++;
            this.pendingCalls[serviceCall][pos] = p;
            this.LOG.debug('resolve pos', pos);
            var newParams = [
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
                    }]
                .concat(params);
            this.LOG.debug('resolve newParams', newParams);
            window[serviceCall].apply(window, newParams);
        },
        resolveNew: function(serviceCall, resultHandler, errorHandler, params) {
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
                'params' : params, 
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
        },
        /* AJAX request wrapper */
        send : function(op, par, success, error ){
            this.LOG.debug('par', par);
            $.ajax({
                'url' : this.hostREST + op + "/",
                'type': "POST",
                'data' : JSON.stringify(_.extend(par, {
                    'op': op,
                    'user' : this.user || "mailto:dummyUser",
                    'key' : this.userKey || "someKey"
                })),
                'contentType' : "application/json",
                'async' : true,
                'dataType': "application/json",
                'complete' : function(jqXHR, textStatus) {

                    if( jqXHR.readyState !== 4 || jqXHR.status !== 200){
                        sss.LOG.error("sss json request failed");
                        return;
                    }

                    var result = $.parseJson(jqXHR.responseText); 

                    if( result.error ) {
                        if( error ) error(result);
                        return;
                    }
                    success(result[op]);
                }
            });
        },

        analyze: function(analyzable) {
            var correct = analyzable instanceof this.vie.Analyzable 
            if (!correct) {
                throw new Error("Invalid Analyzable passed");
            }
            var sss = this;
            if( analyzable.options.service == "searchByTags" ) {
                this.onUrisReady(
                    this.user,
                    function(userUri) {
                        sss.resolve('SSSearchWithTags', 
                            function(object) {
                                sss.LOG.debug("searchResult", object);
                                var entities = [];
                                _.each(object['searchResults'], function(result) {
                                    entities.push(sss.fixForVIE(result, 'entity'));
                                });
                                analyzable.resolve(entities);
                            },
                            function(object) {
                                sss.LOG.warn("searchResult failed", object);
                                analyzable.reject(object);
                            },
                            userUri,
                            sss.userKey,
                            analyzable.options.op || "OR",
                            analyzable.options.tags,
                            analyzable.options.max
                        );
                    }
                );
            } else if ( analyzable.options.service == 'searchCombined' ) {
                this.onUrisReady(
                    this.user,
                    function(userUri) {
                        sss.resolve('SSSearchCombined',
                            function(object) {
                                sss.LOG.debug("searchResult", object);
                                var entities = [];
                                _.each(object['searchResults'], function(result) {
                                    entities.push(sss.fixForVIE(result, 'entity'));
                                });
                                analyzable.resolve(entities);
                            },
                            function(object) {
                                sss.LOG.warn("searchResult failed", object);
                                analyzable.reject(object);
                            },
                            userUri,
                            sss.userKey,
                            analyzable.options.tags,
                            [],
                            false,
                            analyzable.options.types || [],
                            true,
                            false,
                            true,
                            true,
                            false
                        );
                    }
                );
            } else if ( analyzable.options.service == "search" ) {
                this.onUrisReady(
                    this.user,
                    function(userUri) {
                        sss.resolve('SSSearch',
                            function(object) {
                                sss.LOG.debug("searchResult", object);
                                var entities = [];
                                _.each(object['entities'], function(result) {
                                    entities.push(sss.fixForVIE(result));
                                });
                                analyzable.resolve(entities);
                            },
                            function(object) {
                                sss.LOG.warn("searchResult failed", object);
                                analyzable.reject(object);
                            },
                            userUri,
                            sss.userKey,
                            analyzable.options.tags,
                            false,
                            null,
                            true,
                            null,
                            false,
                            null,
                            true,
                            null,
                            true,
                            null,
                            analyzable.options.types || [],
                            false,
                            null,
                            false,
                            false,
                            false
                        );
                    }
                );
            } else if ( analyzable.options.service == "entityShare" ) {
                this.onUrisReady(
                    function() {
                        sss.resolve('SSEntityShare', 
                            function(object) {
                                sss.LOG.debug("entityShare success", object);
                            },
                            function(object) {
                                sss.LOG.debug("entityShare failed", object);
                            },
                            sss.user,
                            sss.userKey,
                            analyzable.options.entity,
                            analyzable.options.users,
                            analyzable.options.comment || ''
                        );
                    }
                );
            } else if ( analyzable.options.service == "entityCopy" ) {
                this.onUrisReady(
                    function() {
                        sss.resolve('SSEntityCopy', 
                            function(object) {
                                sss.LOG.debug("entityCopy success", object);
                            },
                            function(object) {
                                sss.LOG.debug("entityCopy failed", object);
                            },
                            sss.user,
                            sss.userKey,
                            analyzable.options.entity,
                            analyzable.options.users,
                            analyzable.options.exclude || [],
                            analyzable.options.comment || ''
                        );
                    }
                );
            } else if ( analyzable.options.service == "userAll" ) {
                this.onUrisReady(
                    function() {
                        sss.resolve('SSUserAll', 
                            function(object) {
                                sss.LOG.debug("userAll success", object);
                                var users = [];
                                _.each(object['users'], function(result) {
                                    // Required parameter type is missing
                                    //result['type'] = 'user';
                                    //users.push(sss.fixForVIE(result, 'id'));
                                    users.push(result);
                                });
                                analyzable.resolve(users);

                            },
                            function(object) {
                                sss.LOG.debug("userAll failed", object);
                                analyzable.reject(object);
                            },
                            sss.user,
                            sss.userKey
                        );
                    }
                );
            } else if ( analyzable.options.service == "recommTagsBasedOnUserEntityTagTime" ) {
                this.onUrisReady(
                    function() {
                        sss.resolve('SSScaffRecommTagsBasedOnUserEntityTagTime', 
                            function(object) {
                                sss.LOG.debug("recommTagsBasedOnUserEntityTagTime success", object);
                                analyzable.resolve(object.tags || []);
                            },
                            function(object) {
                                sss.LOG.debug("recommTagsBasedOnUserEntityTagTime failed", object);
                                analyzable.reject(object);
                            },
                            sss.user,
                            sss.userKey,
                            analyzable.options.forUser || null,
                            analyzable.options.entity || null,
                            analyzable.options.maxTags || 20
                        );
                    }
                );
            } else if ( analyzable.options.service == "ueCountGet" ) {
                this.onUrisReady(
                    function() {
                        sss.resolve('SSUECountGet', 
                            function(object) {
                                sss.LOG.debug("ueCountGet success", object);
                                analyzable.resolve(object.count || 0);
                            },
                            function(object) {
                                sss.LOG.debug("ueCountGet failed", object);
                                analyzable.reject(object);
                            },
                            sss.user,
                            sss.userKey,
                            analyzable.options.forUser || null,
                            analyzable.options.entity || null,
                            analyzable.options.startTime || null,
                            analyzable.options.endTime || null,
                            analyzable.options.type || null
                        );
                    }
                );
            } else if ( analyzable.options.service == "categoriesPredefinedGet" ) {
                sss.resolveNew('categoriesPredefinedGet', 
                    function(result) {
                        sss.LOG.debug("categoriesPredefinedGet success", result);
                        analyzable.resolve(result.categories);
                    },
                    function(result) {
                        sss.LOG.error("categoriesPredefinedGet error", result);
                        analyzable.reject(result);
                    }
                );
            } else if ( analyzable.options.service == "EntityDescsGet" ) {
                sss.resolve('SSEntityDescsGet', 
                    function(result) {
                        var entities = [];
                        _.each(result['descs'], function(object) {
                            sss.fixEntityDesc(object);
                            var entity = sss.fixForVIE(object, 'entity', 'type');
                            entities.push(entity);
                        });
                        analyzable.resolve(entities);
                    },
                    function(result) {
                        sss.LOG.error("EntityDescsGet", result);
                        analyzable.reject(result);
                    },
                    sss.user,
                    sss.userKey,
                    analyzable.options.entities,
                    analyzable.options.types,
                    true,   //getTags
                    false,  //getOverallRating
                    false,   //getDiscs
                    false,  //getUEs
                    true,   //getThumb
                    true    //getFlags
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

            loadable.options.data = loadable.options.data || {};

            try {
                if ( loadable.options.resource ) {
                    this.ResourceGet(loadable);
                } else if ( loadable.options.type ) {
                    this.TypeGet(loadable);
                }
            } catch(e) {
                this.LOG.error(e);
            }
        },

        // Gets resource of given uri
        ResourceGet : function(loadable) {
            this.LOG.debug("ResourceGet");
            var entity = this.vie.entities.get(loadable.options.resource);
            this.LOG.debug("entity", entity, ' is of ', entity.get("@type"));
            var sss = this;
            if ( entity.isof('owl:Thing')){
                this.onUrisReady(
                    this.user,
                    loadable.options.resource,
                    function(userUri, resourceUri) {
                        sss.resolve('SSEntityDescGet', 
                            function(object) {
                                sss.LOG.debug("handle result of EntityDescGet");
                                sss.LOG.debug("object", object);
                                if( _.isEmpty(object['desc'] ) )  {
                                    loadable.reject(entity);
                                    sss.LOG.error("error:",resourceUri, " is empty");
                                    return;
                                }

                                sss.fixEntityDesc(object['desc']);

                                var entity = sss.fixForVIE(object['desc'], 'entity', 'type');
                                var entityUri = object['desc']['entity'];
                                //var vieEntity = new sss.vie.Entity(entity);//SSS.Entity(entity);
                                var type = object['desc']['type'];
                                sss.LOG.debug('desc.type', type);
                                if( type && type == sss.types.USER )  {
                                    sss.resolve('SSLearnEpVersionCurrentGet',
                                        function(object2) {
                                            sss.LOG.debug("handle result of VersionCurrentGet");
                                            sss.LOG.debug("object", object2);
                                            entity[Voc.currentVersion] = object2['learnEpVersion']['id'];
                                            loadable.resolve(entity);
                                        },
                                        function(object2) {
                                            sss.LOG.warn("error:", object2);
                                            loadable.resolve(entity);
                                        },
                                        entityUri,
                                        sss.userKey 
                                        );
                                } else if( type && type == sss.types.USEREVENT )  {
                                    sss.resolve('SSUserEventGet', 
                                        function(object2) {
                                            sss.LOG.debug("handle result of UserEventTypeGet");
                                            sss.LOG.debug("object", object2);

                                            if(!object2['uE']['timestamp'])
                                                delete object2['uE']['timestamp'];
                                            // XXX Possibly need to change uri to something else
                                            var entity = sss.fixForVIE(object2['uE'], 'uri');
                                            //var vieEntity = new sss.vie.Entity(entity);//SSS.Entity(entity);
                                            loadable.resolve(entity);
                                        },
                                        function(object2) {
                                            sss.LOG.warn("error:", object2);
                                            loadable.resolve(entity);
                                        },
                                        sss.vie.namespaces.uri(sss.user),
                                        sss.userKey ,
                                        entity.getSubject()
                                        );
                                } else
                                    loadable.resolve(entity);
                            },
                            function(object) {
                                loadable.reject(entity);
                                sss.LOG.warn("error:",object);
                            },
                            userUri,
                            sss.userKey,
                            resourceUri,
                            true, // tags
                            false, // rating
                            false, // discussions
                            false, // events
                            true, // thumbnail
                            true // flags
                        );
                });
            } else {
                this.LOG.warn("SocialSemanticService load for " + type.id + " not implemented");
            }
        },

        // Gets entities of a specific type
        TypeGet : function(loadable) {
            var type = loadable.options.type;

            var sss = this;
            if( type.isof(Voc.USEREVENT)) {
                this.LOG.debug("SSUserEventsGet");
                this.onUrisReady(
                    this.user,
                    loadable.options.forUser,
                    loadable.options.resource,
                    function(userUri, forUserUri, resourceUri) {
                        sss.resolve('SSUserEventsGet', 
                            function(objects) {
                                sss.LOG.debug("handle result of userEventsOfUser");
                                sss.LOG.debug("objects", objects);
                                var entityInstances = [];
                                _.each(objects['uEs'], function(object) {
                                    var entity = sss.fixForVIE(object);
                                    sss.LOG.debug('entity', _.clone(entity));
                                    if(!_.contains( _.keys(EntityView.prototype.icons), entity['@type'])) {
                                            sss.LOG.debug(entity['@type'], 'filtered');
                                            return;
                                            }
                                    //var vieEntity = new sss.vie.Entity(entity);
                                    entityInstances.push(entity);
                                });
                                loadable.resolve(entityInstances);
                            },
                            function(object) {
                                sss.LOG.warn("error:");
                                sss.LOG.warn(object);
                            },
                            userUri,
                            sss.userKey,
                            forUserUri,
                            resourceUri ? resourceUri : null,
                            loadable.options.start,
                            loadable.options.end
                        );
                });
            } else if( type.isof(Voc.EPISODE )) {
                this.LOG.debug("SSLearnEpsGet");
                this.onUrisReady(
                    this.user,
                    function(userUri) {
                        sss.resolve('SSLearnEpsGet', 
                            function(objects) {
                                sss.LOG.debug("handle result of epsGet");
                                sss.LOG.debug("objects", objects);
                                var entityInstances = [];
                                _.each(objects['learnEps'], function(object) {
                                    object[Voc.belongsToUser] = object['user'];
                                    delete object['user'];
                                    var entity = sss.fixForVIE(object, 'id');
                                    //var vieEntity = new sss.vie.Entity(entity);
                                    entity['@type'] = Voc.EPISODE;
                                    entityInstances.push(entity);
                                });
                                loadable.resolve(entityInstances);
                            },
                            function(object) {
                                sss.LOG.warn("error on SSLearnEpsGet (perhaps just empty):");
                                sss.LOG.warn(object);
                                loadable.resolve([]);
                            },
                            userUri,
                            sss.userKey
                        );
                });

            } else if( type.isof(Voc.VERSION )) {
                this.LOG.debug("SSLearnEpVersionsGet");
                this.onUrisReady(
                    this.user,
                    loadable.options.episode,
                    function(userUri, episodeUri) {
                        sss.resolve('SSLearnEpVersionsGet', 
                            function(objects) {
                                sss.LOG.debug("handle result of epVersionsGet");
                                sss.LOG.debug("objects", objects);
                                var entityInstances = [];
                                _.each(objects['learnEpVersions'], function(object) {
                                    object[Voc.belongsToEpisode] = object['learnEp'];
                                    delete object['learnEp'];
                                    delete object['circles'];
                                    delete object['entities'];
                                    var entity = sss.fixForVIE(object, 'id');
                                    //var vieEntity = new sss.vie.Entity(entity);
                                    entity['@type'] = Voc.VERSION;
                                    entityInstances.push(entity);
                                    // each version has a organize component
                                    // that would look like as if this object already exists on the server

                                });
                                loadable.resolve(entityInstances);
                            },
                            function(object) {
                                sss.LOG.warn("error:");
                                sss.LOG.warn(object);
                            },
                            userUri,
                            sss.userKey,
                            episodeUri
                        );
                });

            } else if (type.isof(Voc.WIDGET )){
                // fetches Organize and Timeline stuff manually
                // and buffers the data for later fetch 

                this.LOG.debug('load timeline and organize');

                var entities = [];
                var finishedCalls = [];
                var resolve = function(finished, entity) {
                    if( _.contains(finishedCalls, finished)) return;
                    finishedCalls.push(finished);
                    sss.LOG.debug('resolved', entity);
                    if( entity ) entities.push(entity);
                    if( _.contains(finishedCalls, 'versionget') &&  
                        _.contains(finishedCalls, 'timelineget') ) {
                        loadable.resolve(entities);
                        }
                };
                var organize;
                for( var organizeId in this.buffer )
                    if( this.buffer[organizeId]['belongsToVersion'] == loadable.options.version) {
                        organize = this.buffer[organizeId];
                        break;
                    }
                    
                if( !organize ) {
                    organize = {
                        'uri' : sss.vie.namespaces.get('sss') + _.uniqueId('OrganizeWidget'),
                        'type' : Voc.ORGANIZE,
                        'circleType' : Voc.CIRCLE,
                        'orgaEntityType' : Voc.ORGAENTITY,
                        'belongsToVersion' : loadable.options.version 
                    };
                    sss.LOG.debug('buffer organize', organize);
                    // we buffer that object for explicit retrieval of organize
                    // and store it in memory as it would come from the server
                    sss.buffer[organize.uri] = organize;
                }
                resolve('versionget',this.fixForVIE(organize, 'uri'));

                this.LOG.log("SSLearnEPGetTimelineState");
                this.onUrisReady(
                    this.user,
                    loadable.options.version,
                    function(userUri, versionUri) {
                        sss.resolve('SSLearnEpVersionGetTimelineState', 
                            function(object) {
                                sss.LOG.debug("handle result of LearnEpGetTimelineState");
                                sss.LOG.debug("object", object);

                                var entity = {};
                                entity[VIE.prototype.Entity.prototype.idAttribute] = object.id;
                                entity['@type'] = Voc.TIMELINE;
                                entity[Voc.belongsToUser] = sss.user;
                                entity[Voc.timeAttr]= Voc.creationTime;
                                entity[Voc.predicate] = Voc.USEREVENT;
                                entity[Voc.belongsToVersion] = loadable.options.version;

                                if( !object['learnEpTimelineState']) {
                                    // init time range
                                    //entity[Voc.start] = jSGlobals.getTime() - jSGlobals.dayInMilliSeconds;
                                    //entity[Voc.end] = jSGlobals.getTime() + 3600000;

                                } else {
                                    object = object['learnEpTimelineState'];
                                    //var vieEntity = new sss.vie.Entity(sss.fixForVIE({
                                    entity[Voc.start] = object.startTime;                            
                                    entity[Voc.end] = object.endTime
                                }

                                //entity = sss.fixForVIE(entity);

                                //sss.buffer[vieEntity.getSubject()] = object;
                                //loadable.resolve(vieEntity);
                                resolve('timelineget', entity);
                            },
                            function(object) {
                                sss.LOG.warn("error:", object);
                                resolve('timelineget');
                            },
                            userUri,
                            sss.userKey,
                            versionUri
                        );
                });

            } else if (type.isof(Voc.CIRCLE)){
                if (!loadable.options.organize) {
                    this.LOG.warn("no organize reference");
                    loadable.reject();
                    return;
                }
                //map organize id to version id
                this.LOG.debug('buffer', JSON.stringify(this.buffer));
                this.LOG.debug('organize to find', loadable.options.organize);
                var version = this.buffer[loadable.options.organize]['belongsToVersion']; 
                this.LOG.debug('version found', version);
                var entities = [];
                this.onUrisReady(
                    this.user,
                    version,
                    function(userUri, versionUri) {
                        sss.resolve('SSLearnEpVersionGet',
                            function(object) {
                                sss.LOG.debug("handle result of LearnEpVersionGet");
                                sss.LOG.debug("objects", object);
                                var key, idAttr;
                                _.each(object['learnEpVersion']['circles'], function(item){
                                    var fixEntity = {};
                                    fixEntity.Label = item['label'];
                                    fixEntity.LabelX = item['xLabel'];
                                    fixEntity.LabelY = item['yLabel'];
                                    fixEntity.rx = item['xR'];
                                    fixEntity.ry = item['yR'];
                                    fixEntity.cx = item['xC'];
                                    fixEntity.cy = item['yC'];
                                    fixEntity.id = item['id'];
                                    fixEntity = sss.fixForVIE(fixEntity, 'id');
                                    fixEntity[Voc.belongsToOrganize] = loadable.options.organize;
                                    //var vieEntity = new sss.vie.Entity(fixEntity);
                                    fixEntity['@type'] = Voc.CIRCLE;
                                    entities.push(fixEntity);
                                });
                                loadable.resolve(entities);
                            },
                            function(object) {
                                sss.LOG.warn("error:", object);
                            },
                            userUri,
                            sss.userKey,
                            versionUri
                        );
                });
            } else if (type.isof(Voc.ORGAENTITY)){
                if (!loadable.options.organize) {
                    this.LOG.warn("no organize reference");
                    loadable.reject();
                    return;
                }
                //map organize id to version id
                var version = this.buffer[loadable.options.organize]['belongsToVersion']; 
                var entities = [];
                this.onUrisReady(
                    this.user,
                    version,
                    function(userUri, versionUri) {
                        sss.resolve('SSLearnEpVersionGet',
                            function(object) {
                                sss.LOG.debug("handle result of LearnEpVersionGet");
                                sss.LOG.debug("objects", object);
                                var key, idAttr;
                                _.each(object['learnEpVersion']['entities'], function(item){
                                    var fixEntity = {};
                                    fixEntity = sss.fixForVIE(item, 'id');
                                    fixEntity[Voc.hasResource] = item['entity'];
                                    fixEntity[Voc.belongsToOrganize] = loadable.options.organize;
                                    //var vieEntity = new sss.vie.Entity(fixEntity);
                                    fixEntity['@type'] = Voc.ORGAENTITY;
                                    entities.push(fixEntity);
                                });
                                loadable.resolve(entities);
                            },
                            function(object) {
                                sss.LOG.warn("error:", object);
                            },
                            userUri,
                            sss.userKey,
                            versionUri
                        );
                });


            } else {
                this.LOG.warn("SocialSemanticService load for " + type.id + " not implemented");
            }

        },
        save: function(savable) {
            var correct = savable instanceof this.vie.Savable;
            if (!correct) {
                throw "Invalid Savable passed";
            }

            if ( !savable.options.entity ) 
                throw "Unable to write to server, no entity given";

            this.LOG.debug("SocialSemanticService save");
            this.LOG.debug("savable.options", savable.options);

            var entity = savable.options.entity;

            this.LOG.debug("entity", entity, " is of ", entity.get("@type"));

            var sss = this;

            if( entity.isof(Voc.TIMELINE) ) {
                this.LOG.debug("saving timeline");
                var obj = _.clone(entity.attributes);
                obj.uri = entity.isNew() ? this.vie.namespaces.get('sss') + _.uniqueId('TimelineWidget')
                                         : obj.uri;
                this.buffer[obj.uri] = obj;
                var start = obj[this.vie.namespaces.uri(Voc.start)];
                var end = obj[this.vie.namespaces.uri(Voc.end)];
                this.onUrisReady(
                    this.user,
                    obj[this.vie.namespaces.uri(Voc.belongsToVersion)],
                    function(userUri, versionUri) {
                        sss.resolve('SSLearnEpVersionSetTimelineState', 
                                function(object) {
                                    sss.LOG.debug("handle result of LearnEpVersionSetTimelinState");
                                    sss.LOG.debug("object", object);
                                    if( entity.isNew() )
                                        savable.resolve({'uri':obj.uri}); //timeline was created
                                    else 
                                        savable.resolve(true); //timeline was updated
                                },
                                function(object) {
                                    sss.LOG.warn("error:", object);
                                },
                                userUri,
                                sss.userKey,
                                versionUri,
                                _.isDate(start) ? (start - 0) : start,
                                _.isDate(end) ? (end - 0) : end
                            );
                });
            } else if( entity.isof(Voc.ORGANIZE )) {
                this.LOG.debug("saving organize", entity);
                var obj = _.clone(entity.attributes);
                obj.uri = entity.isNew() ? this.vie.namespaces.get('sss') + _.uniqueId('OrganizeWidget')
                                         : obj.uri;
                this.onUrisReady(
                    obj[this.vie.namespaces.uri(Voc.belongsToVersion)],
                    function() {
                        sss.buffer[obj.uri] = obj;
                        if( entity.isNew() )
                            savable.resolve({'uri':obj.uri}); // organize was created
                        else
                            savable.resolve(true); // organize was updated
                });
            } else if( entity.isof(Voc.EPISODE )) {
                this.LOG.debug("saving episode");
                if( entity.isNew() ) {
                    this.onUrisReady(
                        this.user,
                        function(userUri) {
                            sss.resolve('SSLearnEpCreate', 
                                function(object) {
                                    sss.LOG.debug("handle result of LearnEpCreate");
                                    sss.LOG.debug("object", object);
                                    savable.resolve({'uri':object['learnEp']});
                                },
                                function(object) {
                                    sss.LOG.warn("error:");
                                    sss.LOG.warn("object", object);
                                    savable.reject(entity);
                                },
                                userUri,
                                sss.userKey,
                                entity.get(Voc.label),
                                'privateSpace'
                            );
                    });
                } else {
                    this.onUrisReady(
                        this.user,
                        entity.getSubject(),
                        function(userUri, entityUri){
                            sss.resolve('SSEntityUpdate', 
                                function(object) {
                                    sss.LOG.debug("handle result of SSLabelSet");
                                    sss.LOG.debug("object", object);
                                    savable.resolve(object);
                                },
                                function(object) {
                                    sss.LOG.warn("error:");
                                    sss.LOG.warn("object", object);
                                    savable.reject(entity);
                                },
                                userUri,
                                sss.userKey,
                                entityUri,
                                savable.options.label || null,
                                savable.options.description || null
                            );
                    });
                }
            } else if( entity.isof(Voc.VERSION )) {
                this.LOG.debug("saving version");
                var episode = entity.get(Voc.belongsToEpisode);
                if( episode.isEntity ) episode = episode.getSubject();
                this.onUrisReady(
                    this.user,
                    episode,
                    function( userUri, episodeUri) {
                        sss.resolve('SSLearnEpVersionCreate', 
                                function(object) {
                                    sss.LOG.debug("handle result of LearnEpVersionCreate");
                                    sss.LOG.debug("object", object);
                                    savable.resolve({'uri':object['learnEpVersion']});
                                },
                                function(object) {
                                    sss.LOG.warn("error:");
                                    sss.LOG.warn("object", object);
                                    savable.reject(entity);
                                },
                                userUri,
                                sss.userKey,
                                episodeUri
                            );
                });
            } else if( entity.isof(Voc.CIRCLE )) {
                this.LOG.debug("saving circle");
                var organize = entity.get(Voc.belongsToOrganize);
                if( organize.isEntity ) organize = organize.getSubject();

                this.onUrisReady(
                    organize,
                    function(organizeUri) {
                        // map internal organize model to its version
                        if( !sss.buffer[organizeUri]) {
                            sss.LOG.warn("circle can't be saved because no organize exists");
                            savable.reject(entity);
                            return;
                        }

                        var version = sss.buffer[organizeUri]['belongsToVersion'];
                        // Newly created episode case
                        // Namespace URI is used instead
                        if (version === undefined) {
                            version = sss.buffer[organizeUri][sss.vie.namespaces.uri(Voc.belongsToVersion)];
                        }
                        // end map

                        if( entity.isNew() )
                            sss.onUrisReady(
                                sss.user,
                                version,
                                function(userUri, versionUri) {
                                    sss.resolve('SSLearnEpVersionAddCircle', 
                                        function(object) {
                                            sss.LOG.debug("handle result of LearnEpVersionAddCircle");
                                            sss.LOG.debug("object", object);
                                            savable.resolve({'uri': object['learnEpCircle']});
                                        },
                                        function(object) {
                                            sss.LOG.warn("error:");
                                            sss.LOG.warn("object", object);
                                            savable.reject(entity);
                                        },
                                        userUri,
                                        sss.userKey,
                                        versionUri,
                                        entity.get(Voc.Label),
                                        entity.get(Voc.LabelX),
                                        entity.get(Voc.LabelY),
                                        entity.get(Voc.rx),
                                        entity.get(Voc.ry),
                                        entity.get(Voc.cx),
                                        entity.get(Voc.cy)

                                    );
                            });
                        else
                            sss.onUrisReady(
                                sss.user,
                                entity.getSubject(),
                                function(userUri, uriUri ) {
                                    sss.resolve('SSLearnEpVersionUpdateCircle', 
                                        function(object) {
                                            sss.LOG.debug("handle result of LearnEpVersionUpdateCircle");
                                            sss.LOG.debug("object", object);
                                            savable.resolve(object);
                                        },
                                        function(object) {
                                            sss.LOG.warn("error:");
                                            sss.LOG.warn("object", object);
                                            savable.reject(entity);
                                        },
                                        userUri,
                                        sss.userKey,
                                        uriUri,
                                        entity.get(Voc.Label),
                                        entity.get(Voc.LabelX),
                                        entity.get(Voc.LabelY),
                                        entity.get(Voc.rx),
                                        entity.get(Voc.ry),
                                        entity.get(Voc.cx),
                                        entity.get(Voc.cy)

                                    );
                            });
                });

            } else if( entity.isof(Voc.ORGAENTITY )) {
                this.LOG.debug("saving orgaentity");
                var organize = entity.get(Voc.belongsToOrganize);
                if( organize.isEntity ) organize = organize.getSubject();

                this.onUrisReady(
                    organize,
                    function(organizeUri) {
                        // map internal organize model to its version
                        if( !sss.buffer[organizeUri]) {
                            sss.LOG.warn("orgaentity can't be saved because no organize exists");
                            savable.reject(entity);
                            return;
                        }
                        var version = sss.buffer[organizeUri]['belongsToVersion'];
                        // This deals with case of newly added version
                        // For some reason NAMESPACE URI is used instead of PARAMETER
                        if (version === undefined) {
                            version = sss.buffer[organizeUri][sss.vie.namespaces.uri(Voc.belongsToVersion)];
                        }
                        // end map
                        //
                        var resourceUri = entity.get(Voc.hasResource);
                        if( resourceUri.isEntity ) resourceUri = resourceUri.getSubject();

                        if(entity.isNew() )
                            sss.onUrisReady(
                                sss.user,
                                version,
                                resourceUri,
                                function(userUri, versionUri, resourceUri){
                                    sss.resolve('SSLearnEpVersionAddEntity', 
                                        function(object) {
                                            sss.LOG.debug("handle result of LearnEpVersionAddEntity");
                                            sss.LOG.debug("object", object);
                                            savable.resolve({'uri': object['learnEpEntity']});
                                        },
                                        function(object) {
                                            sss.LOG.warn("error:");
                                            sss.LOG.warn("object", object);
                                            savable.reject(entity);
                                        },
                                        userUri,
                                        sss.userKey,
                                        versionUri,
                                        resourceUri,
                                        entity.get(Voc.x),
                                        entity.get(Voc.y)

                                    );
                            });
                        else
                            sss.onUrisReady(
                                sss.user,
                                entity.getSubject(),
                                resourceUri,
                                function(userUri,uriUri,resourceUri){
                                    sss.resolve('SSLearnEpVersionUpdateEntity', 
                                        function(object) {
                                            sss.LOG.debug("handle result of LearnEpVersionUpdateEntity");
                                            sss.LOG.debug("object", object);
                                            savable.resolve(object);
                                        },
                                        function(object) {
                                            sss.LOG.warn("error:");
                                            sss.LOG.warn("object", object);
                                            savable.reject(entity);
                                        },
                                        userUri,
                                        sss.userKey,
                                        uriUri,
                                        resourceUri,
                                        entity.get(Voc.x),
                                        entity.get(Voc.y)

                                    );
                            });
                });

            } else if ( entity.isof(Voc.USER )) {
                var versionUri = entity.get(Voc.currentVersion);
                if( versionUri.isEntity ) versionUri = versionUri.getSubject();
                if( versionUri ) {
                    this.onUrisReady(
                        this.user,
                        versionUri,
                        function(userUri, versionUri) {
                            sss.resolve('SSLearnEpVersionCurrentSet', 
                                function(object) {
                                    sss.LOG.debug("handle result of VersionCurrentSet");
                                    sss.LOG.debug("object", object);
                                    savable.resolve(true);
                                },
                                function(object) {
                                    sss.LOG.warn("error:", object);
                                },
                                userUri,
                                sss.userKey,
                                versionUri
                            );
                    });
                } else
                    savable.resolve(true);
            } else if ( entity.isof(Voc.ENTITY) || entity.isof(Voc.FILE)
                    || entity.isof(Voc.EVERNOTE_RESOURCE) || entity.isof(Voc.EVERNOTE_NOTE)
                    || entity.isof(Voc.EVERNOTE_NOTEBOOK) ) {
                if( savable.options.tag ) {
                    this.onUrisReady(
                        this.user,
                        entity.getSubject(),
                        function(userUri, entityUri) {
                            sss.resolve('SSTagAdd', 
                                function(object) {
                                    sss.LOG.debug('result addTag', object);
                                    savable.resolve(object);
                                },
                                function(object) {
                                    sss.LOG.warn('failed addTag', object);
                                    savable.reject(object);
                                },
                                userUri,
                                sss.userKey,
                                entityUri,
                                savable.options.tag,
                                'privateSpace' // XXX need to determine space!
                            );
                        }
                    );
                } else if ( savable.options.label ) {
                    this.onUrisReady(
                        entity.getSubject(),
                        function(entityUri) {
                            sss.resolve('SSEntityUpdate', 
                                function(object) {
                                    sss.LOG.debug('result entity setLabel', object);
                                    savable.resolve(object);
                                },
                                function(object) {
                                    sss.LOG.debug('railed entity setLabel', object);
                                    savable.reject(entity);
                                },
                                sss.user,
                                sss.userKey,
                                entityUri,
                                savable.options.label
                            );
                        }
                    );
                } else if ( savable.options.importance ) {
                    this.onUrisReady(
                        entity.getSubject(),
                        function(entityUri) {
                            sss.resolve('SSFlagsSet', 
                                function(object) {
                                    sss.LOG.debug('setImportance success', object);
                                    savable.resolve(object);
                                },
                                function(object) {
                                    sss.LOG.debug('setImportance fail', object);
                                    savable.reject(entity);
                                },
                                sss.user,
                                sss.userKey,
                                [entityUri],
                                ['importance'],
                                null,
                                savable.options.importance
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
                this.onUrisReady(
                    this.user,
                    entity.getSubject(),
                    function(userUri,uriUri){
                        sss.resolve('SSLearnEpVersionRemoveCircle', 
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
                            userUri,
                            sss.userKey,
                            uriUri
                        );
                });
            } else if( entity.isof(Voc.ORGAENTITY )) {
                this.onUrisReady(
                    this.user,
                    entity.getSubject(),
                    function(userUri,uriUri){
                        sss.resolve('SSLearnEpVersionRemoveEntity', 
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
                            userUri,
                            sss.userKey,
                            uriUri
                        );
                });
            } else if ( entity.isof(Voc.ENTITY) || entity.isof(Voc.FILE)
                    || entity.isof(Voc.EVERNOTE_RESOURCE) || entity.isof(Voc.EVERNOTE_NOTE)
                    || entity.isof(Voc.EVERNOTE_NOTEBOOK) ) {
                if( removable.options.tag ) {
                    this.onUrisReady(
                        this.user,
                        entity.getSubject(),
                        function(userUri, entityUri) {
                            sss.resolve('SSTagsRemove', 
                                function(object) {
                                    sss.LOG.debug('result removeTag', object);
                                    removable.resolve(object);
                                },
                                function(object) {
                                    sss.LOG.warn('failed removeTag', object);
                                    removable.reject(object);
                                },
                                userUri,
                                sss.userKey,
                                entityUri,
                                removable.options.tag
                            );
                        }
                    );
                }
            } else {
                this.LOG.warn("SocialSemanticService remove for " + type.id + " not implemented");
            }

        },
        fixEntityDesc: function(object) {
            // Extract importance from flags
            // Remove flags from object
            if ( _.isArray(object['flags']) ) {
                if ( !_.isEmpty(object['flags']) ) {
                    var importance;
                        creationTime = 1;
                    _.each(object['flags'], function(flag) {
                        // In case multiple are provided
                        if ( flag.type === 'importance'  && flag.creationTime > creationTime) {
                            importance = flag.value;
                            creationTime = flag.creationTime;
                        }
                    });
                    if ( importance ) {
                        object['importance'] = importance;
                    }
                }
                delete object['flags'];
            }

        },
        /**
         * Workaround for VIE's non-standard json-ld values and parsing behaviour.
         * @param {type} object
         * @return {undefined}
         */
        fixForVIE: function(object, idAttr, typeAttr) {
            var entity = _.clone(object);
            if( !idAttr) idAttr = 'id';
            if( !typeAttr) typeAttr = 'type';
            entity[VIE.prototype.Entity.prototype.idAttribute] = object[idAttr];
            if (object[typeAttr]) {
                entity['@type'] = object[typeAttr].indexOf('sss:') === 0 ? object[typeAttr] : "sss:"+object[typeAttr];
                delete entity[typeAttr];
            }
            delete entity[idAttr];

            for( var prop in entity ) {
                if( prop.indexOf('@') === 0 ) continue;
                if( prop.indexOf('sss:') === 0 ) continue;
                if( prop.indexOf('http:') === 0 ) continue;
                entity['sss:'+prop] = entity[prop];
                delete entity[prop];
            }

            return entity;
        },

        /**
         * Workaround for VIE's non-standard json-ld values and parsing behaviour.
         * @param {type} object
         * @return {undefined}
         */
        fixFromVIE: function(entity) {
            var object = _.clone(entity.attributes);
            this.LOG.debug('fixFromVIE', JSON.stringify(object));
            for( var prop in object ) {
                var curie = this.vie.namespaces.curie(prop);
                if( curie.indexOf('sss:') === 0 ) curie = curie.substring(4);
                object[curie] = object[prop];
                delete object[prop];
            }
            object['type'] = entity.get('@type').id;
            object['id'] = entity.getSubject();
            delete object['@type'];
            delete object[VIE.prototype.Entity.prototype.idAttribute];
            return object;
        }


    };

    return VIE.prototype.SocialSemanticService;

});

