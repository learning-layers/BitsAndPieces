// The SocialSemanticService wraps the SSS Client API.

define(['logger', 'vie', 'underscore', 'voc', 'view/sss/EntityView',
        'sss.conn.entity', 'sss.conn.userevent', 'sss.conn.learnep'], function(Logger, VIE, _, Voc, EntityView) {

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
        init: function() {
            for (var key in this.options.namespaces) {
                var val = this.options.namespaces[key];
                this.vie.namespaces.add(key, val);
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
        analyze: function(analyzable) {
            // in a certain way, analyze is the same as load
            return this.load(analyzable);
        },
        load: function(loadable) {
            var correct = loadable instanceof this.vie.Loadable || loadable instanceof this.vie.Analyzable;
            if (!correct) {
                throw new Error("Invalid Loadable/Analyzable passed");
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
            var service = this;
            if ( entity.isof('owl:Thing')){
                this.onUrisReady(
                    this.user,
                    loadable.options.resource,
                    function(userUri, resourceUri) {
                        new SSEntityDescGet().handle(
                            function(object) {
                                service.LOG.debug("handle result of EntityDescGet");
                                service.LOG.debug("object", object);
                                if( _.isEmpty(object['entityDesc'] ) )  {
                                    loadable.reject(entity);
                                    service.LOG.error("error:",resourceUri, " is empty");
                                    return;
                                }
                                var entity = service.fixForVIE(object['entityDesc'], 'entityUri', 'entityType');
                                var entityUri = object['entityDesc']['entityUri'];
                                //var vieEntity = new service.vie.Entity(entity);//SSS.Entity(entity);
                                var type = object['entityDesc']['entityType'];
                                service.LOG.debug('entityDesc.entityType', type);
                                if( type && type == service.types.USER )  {
                                    new SSLearnEpVersionCurrentGet().handle(
                                        function(object2) {
                                            service.LOG.debug("handle result of VersionCurrentGet");
                                            service.LOG.debug("object", object2);
                                            entity[Voc.currentVersion] = object2['learnEpVersion']['learnEpVersionUri'];
                                            loadable.resolve(entity);
                                        },
                                        function(object2) {
                                            service.LOG.warn("error:", object2);
                                            loadable.resolve(entity);
                                        },
                                        entityUri,
                                        service.userKey 
                                        );
                                } else if( type && type == service.types.USEREVENT )  {
                                    new SSUserEventGet().handle(
                                        function(object2) {
                                            service.LOG.debug("handle result of UserEventTypeGet");
                                            service.LOG.debug("object", object2);

                                            if(!object2['uE']['timestamp'])
                                                delete object2['uE']['timestamp'];
                                            var entity = service.fixForVIE(object2['uE'], 'uri');
                                            //var vieEntity = new service.vie.Entity(entity);//SSS.Entity(entity);
                                            loadable.resolve(entity);
                                        },
                                        function(object2) {
                                            service.LOG.warn("error:", object2);
                                            loadable.resolve(entity);
                                        },
                                        service.vie.namespaces.uri(service.user),
                                        service.userKey ,
                                        entity.getSubject()
                                        );
                                } else
                                    loadable.resolve(entity);
                            },
                            function(object) {
                                loadable.reject(entity);
                                service.LOG.warn("error:",object);
                            },
                            userUri,
                            service.userKey,
                            resourceUri
                        );
                });
            } else {
                this.LOG.warn("SocialSemanticService load for " + type.id + " not implemented");
            }
        },

        // Gets entities of a specific type
        TypeGet : function(loadable) {
            var type = loadable.options.type;

            var service = this;
            if( type.isof(Voc.USER)) {
                this.LOG.debug("SSUserEventsGet");
                this.onUrisReady(
                    this.user,
                    loadable.options.forUser,
                    loadable.options.resource,
                    function(userUri, forUserUri, resourceUri) {
                        new SSUserEventsGet().handle(
                            function(objects) {
                                service.LOG.debug("handle result of userEventsOfUser");
                                service.LOG.debug("objects", objects);
                                var entityInstances = [];
                                _.each(objects['uEs'], function(object) {
                                    var entity = service.fixForVIE(object);
                                    service.LOG.debug('entity', _.clone(entity));
                                    if(!_.contains( _.keys(EntityView.prototype.icons), entity['@type'])) {
                                            service.LOG.debug(entity['@type'], 'filtered');
                                            return;
                                            }
                                    //var vieEntity = new service.vie.Entity(entity);
                                    entityInstances.push(entity);
                                });
                                loadable.resolve(entityInstances);
                            },
                            function(object) {
                                service.LOG.warn("error:");
                                service.LOG.warn(object);
                            },
                            userUri,
                            service.userKey,
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
                        new SSLearnEpsGet().handle(
                            function(objects) {
                                service.LOG.debug("handle result of epsGet");
                                service.LOG.debug("objects", objects);
                                var entityInstances = [];
                                _.each(objects['learnEps'], function(object) {
                                    object[Voc.belongsToUser] = object['user'];
                                    delete object['user'];
                                    var entity = service.fixForVIE(object, 'learnEpUri');
                                    //var vieEntity = new service.vie.Entity(entity);
                                    entity['@type'] = Voc.EPISODE;
                                    entityInstances.push(entity);
                                });
                                loadable.resolve(entityInstances);
                            },
                            function(object) {
                                service.LOG.warn("error on SSLearnEpsGet (perhaps just empty):");
                                service.LOG.warn(object);
                                loadable.resolve([]);
                            },
                            userUri,
                            service.userKey
                        );
                });

            } else if( type.isof(Voc.VERSION )) {
                this.LOG.debug("SSLearnEpVersionsGet");
                this.onUrisReady(
                    this.user,
                    loadable.options.episode,
                    function(userUri, episodeUri) {
                        new SSLearnEpVersionsGet().handle(
                            function(objects) {
                                service.LOG.debug("handle result of epVersionsGet");
                                service.LOG.debug("objects", objects);
                                var entityInstances = [];
                                _.each(objects['learnEpVersions'], function(object) {
                                    object[Voc.belongsToEpisode] = object['learnEpUri'];
                                    delete object['learnEpUri'];
                                    delete object['circles'];
                                    delete object['entities'];
                                    var entity = service.fixForVIE(object, 'learnEpVersionUri');
                                    //var vieEntity = new service.vie.Entity(entity);
                                    entity['@type'] = Voc.VERSION;
                                    entityInstances.push(entity);
                                    // each version has a organize component
                                    // that would look like as if this object already exists on the server

                                });
                                loadable.resolve(entityInstances);
                            },
                            function(object) {
                                service.LOG.warn("error:");
                                service.LOG.warn(object);
                            },
                            userUri,
                            service.userKey,
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
                    service.LOG.debug('resolved', entity);
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
                        'uri' : service.vie.namespaces.get('sss') + _.uniqueId('OrganizeWidget'),
                        'type' : Voc.ORGANIZE,
                        'circleType' : Voc.CIRCLE,
                        'orgaEntityType' : Voc.ORGAENTITY,
                        'belongsToVersion' : loadable.options.version 
                    };
                    service.LOG.debug('buffer organize', organize);
                    // we buffer that object for explicit retrieval of organize
                    // and store it in memory as it would come from the server
                    service.buffer[organize.uri] = organize;
                }
                resolve('versionget',this.fixForVIE(organize));

                this.LOG.log("SSLearnEPGetTimelineState");
                this.onUrisReady(
                    this.user,
                    loadable.options.version,
                    function(userUri, versionUri) {
                        new SSLearnEpVersionGetTimelineState().handle(
                            function(object) {
                                service.LOG.debug("handle result of LearnEpGetTimelineState");
                                service.LOG.debug("object", object);
                                if( !object['learnEpTimelineState']) {
                                    resolve('timelineget');
                                    return;
                                }
                                object = object['learnEpTimelineState'];
                                //var vieEntity = new service.vie.Entity(service.fixForVIE({
                                var entity = service.fixForVIE({
                                    'uri' : object.learnEpTimelineStateUri,
                                    'type' : service.types.TIMELINE,
                                    'belongsToUser' : service.user,
                                    'timeAttr': Voc.timestamp,
                                    'predicate' : Voc.USEREVENT,
                                    'belongsToVersion' : loadable.options.version,
                                    'start' : object.startTime,                            
                                    'end' : object.endTime
                                });

                                //service.buffer[vieEntity.getSubject()] = object;
                                //loadable.resolve(vieEntity);
                                resolve('timelineget', entity);
                            },
                            function(object) {
                                service.LOG.warn("error:", object);
                                resolve('timelineget');
                            },
                            userUri,
                            service.userKey,
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
                        new SSLearnEpVersionGet().handle(
                            function(object) {
                                service.LOG.debug("handle result of LearnEpVersionGet");
                                service.LOG.debug("objects", object);
                                var key, idAttr;
                                _.each(object['learnEpVersion']['circles'], function(item){
                                    item.Label = item['label'];
                                    item.LabelX = item['xLabel'];
                                    item.LabelY = item['yLabel'];
                                    item.rx = item['xR'];
                                    item.ry = item['yR'];
                                    item.cx = item['xC'];
                                    item.cy = item['yC'];
                                    delete item['label'];
                                    delete item['xLabel'];
                                    delete item['yLabel'];
                                    delete item['xR'];
                                    delete item['yR'];
                                    delete item['xC'];
                                    delete item['yC'];
                                    delete item['learnEpVersionUri'];
                                    var fixEntity = service.fixForVIE(item, 'learnEpCircleUri');
                                    fixEntity[Voc.belongsToOrganize] = loadable.options.organize;
                                    //var vieEntity = new service.vie.Entity(fixEntity);
                                    fixEntity['@type'] = type.id;
                                    entities.push(fixEntity);
                                });
                                loadable.resolve(entities);
                            },
                            function(object) {
                                service.LOG.warn("error:", object);
                            },
                            userUri,
                            service.userKey,
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
                        new SSLearnEpVersionGet().handle(
                            function(object) {
                                service.LOG.debug("handle result of LearnEpVersionGet");
                                service.LOG.debug("objects", object);
                                var key, idAttr;
                                _.each(object['learnEpVersion']['entities'], function(item){
                                    item[Voc.hasResource] = item['entityUri'];
                                    delete item['entityUri'];
                                    var fixEntity = service.fixForVIE(item, 'learnEpEntityUri');
                                    fixEntity[Voc.belongsToOrganize] = loadable.options.organize;
                                    //var vieEntity = new service.vie.Entity(fixEntity);
                                    fixEntity['@type'] = type.id;
                                    entities.push(fixEntity);
                                });
                                loadable.resolve(entities);
                            },
                            function(object) {
                                service.LOG.warn("error:", object);
                            },
                            userUri,
                            service.userKey,
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

            var service = this;

            if( entity.isof(Voc.TIMELINE) ) {
                this.LOG.debug("saving timeline");
                var obj = this.fixFromVIE(entity);
                obj.uri = entity.isNew() ? this.vie.namespaces.get('sss') + _.uniqueId('TimelineWidget')
                                         : obj.uri;
                this.buffer[obj.uri] = obj;
                this.onUrisReady(
                    this.user,
                    obj[Voc.belongsToVersion],
                    function(userUri, versionUri) {
                        new SSLearnEpVersionSetTimelineState().handle(
                                function(object) {
                                    service.LOG.debug("handle result of LearnEpVersionSetTimelinState");
                                    service.LOG.debug("object", object);
                                    if( entity.isNew() )
                                        savable.resolve({'uri':obj.uri}); //timeline was created
                                    else 
                                        savable.resolve(true); //timeline was updated
                                },
                                function(object) {
                                    service.LOG.warn("error:", object);
                                },
                                userUri,
                                service.userKey,
                                versionUri,
                                _.isDate(obj.start) ? (obj.start - 0) : obj.start,
                                _.isDate(obj.end) ? (obj.end - 0) : obj.end
                            );
                });
            } else if( entity.isof(Voc.ORGANIZE )) {
                this.LOG.debug("saving organize");
                var obj = this.fixFromVIE(entity);
                obj.uri = entity.isNew() ? this.vie.namespaces.get('sss') + _.uniqueId('OrganizeWidget')
                                         : obj.uri;
                this.onUrisReady(
                    obj[Voc.belongsToVersion],
                    function() {
                        service.buffer[obj.uri] = obj;
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
                            new SSLearnEpCreate().handle(
                                function(object) {
                                    service.LOG.debug("handle result of LearnEpCreate");
                                    service.LOG.debug("object", object);
                                    savable.resolve({'uri':object['learnEpUri']});
                                },
                                function(object) {
                                    service.LOG.warn("error:");
                                    service.LOG.warn("object", object);
                                    savable.reject(entity);
                                },
                                userUri,
                                service.userKey,
                                entity.get('label'),
                                'privateSpace'
                            );
                    });
                } else {
                    this.onUrisReady(
                        this.user,
                        entity.getSubject(),
                        function(userUri, entityUri){
                            new SSEntityLabelSet().handle(
                                function(object) {
                                    service.LOG.debug("handle result of SSLabelSet");
                                    service.LOG.debug("object", object);
                                    savable.resolve(object);
                                },
                                function(object) {
                                    service.LOG.warn("error:");
                                    service.LOG.warn("object", object);
                                    savable.reject(entity);
                                },
                                userUri,
                                service.userKey,
                                entityUri,
                                entity.get('label')
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
                        new SSLearnEpVersionCreate().handle(
                                function(object) {
                                    service.LOG.debug("handle result of LearnEpVersionCreate");
                                    service.LOG.debug("object", object);
                                    savable.resolve({'uri':object['learnEpVersionUri']});
                                },
                                function(object) {
                                    service.LOG.warn("error:");
                                    service.LOG.warn("object", object);
                                    savable.reject(entity);
                                },
                                userUri,
                                service.userKey,
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
                        if( !service.buffer[organizeUri]) {
                            service.LOG.warn("circle can't be saved because no organize exists");
                            savable.reject(entity);
                            return;
                        }
                        var version = service.buffer[organizeUri]['belongsToVersion'];
                        // end map

                        var fixEntity = service.fixFromVIE(entity);

                        if( entity.isNew() )
                            service.onUrisReady(
                                service.user,
                                version,
                                function(userUri, versionUri) {
                                    new SSLearnEpVersionAddCircle().handle(
                                        function(object) {
                                            service.LOG.debug("handle result of LearnEpVersionAddCircle");
                                            service.LOG.debug("object", object);
                                            savable.resolve({'uri': object['learnEpCircleUri']});
                                        },
                                        function(object) {
                                            service.LOG.warn("error:");
                                            service.LOG.warn("object", object);
                                            savable.reject(entity);
                                        },
                                        userUri,
                                        service.userKey,
                                        versionUri,
                                        fixEntity[Voc.Label],
                                        fixEntity[Voc.LabelX],
                                        fixEntity[Voc.LabelY],
                                        fixEntity[Voc.rx],
                                        fixEntity[Voc.ry],
                                        fixEntity[Voc.cx],
                                        fixEntity[Voc.cy]

                                    );
                            });
                        else
                            service.onUrisReady(
                                service.user,
                                fixEntity.uri,
                                function(userUri, uriUri ) {
                                    new SSLearnEpVersionUpdateCircle().handle(
                                        function(object) {
                                            service.LOG.debug("handle result of LearnEpVersionUpdateCircle");
                                            service.LOG.debug("object", object);
                                            savable.resolve(object);
                                        },
                                        function(object) {
                                            service.LOG.warn("error:");
                                            service.LOG.warn("object", object);
                                            savable.reject(entity);
                                        },
                                        userUri,
                                        service.userKey,
                                        uriUri,
                                        fixEntity[Voc.Label],
                                        fixEntity[Voc.LabelX],
                                        fixEntity[Voc.LabelY],
                                        fixEntity[Voc.rx],
                                        fixEntity[Voc.ry],
                                        fixEntity[Voc.cx],
                                        fixEntity[Voc.cy]

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
                        if( !service.buffer[organizeUri]) {
                            service.LOG.warn("orgaentity can't be saved because no organize exists");
                            savable.reject(entity);
                            return;
                        }
                        var version = service.buffer[organizeUri]['belongsToVersion'];
                        // end map

                        var fixEntity = service.fixFromVIE(entity);

                        if(entity.isNew() )
                            service.onUrisReady(
                                service.user,
                                version,
                                fixEntity[Voc.hasResource],
                                function(userUri, versionUri, resourceUri){
                                    new SSLearnEpVersionAddEntity().handle(
                                        function(object) {
                                            service.LOG.debug("handle result of LearnEpVersionAddEntity");
                                            service.LOG.debug("object", object);
                                            savable.resolve({'uri': object['learnEpEntityUri']});
                                        },
                                        function(object) {
                                            service.LOG.warn("error:");
                                            service.LOG.warn("object", object);
                                            savable.reject(entity);
                                        },
                                        userUri,
                                        service.userKey,
                                        versionUri,
                                        resourceUri,
                                        fixEntity[Voc.x],
                                        fixEntity[Voc.y]

                                    );
                            });
                        else
                            service.onUrisReady(
                                service.user,
                                fixEntity.uri,
                                fixEntity[Voc.hasResource],
                                function(userUri,uriUri,resourceUri){
                                    new SSLearnEpVersionUpdateEntity().handle(
                                        function(object) {
                                            service.LOG.debug("handle result of LearnEpVersionUpdateEntity");
                                            service.LOG.debug("object", object);
                                            savable.resolve(object);
                                        },
                                        function(object) {
                                            service.LOG.warn("error:");
                                            service.LOG.warn("object", object);
                                            savable.reject(entity);
                                        },
                                        userUri,
                                        service.userKey,
                                        uriUri,
                                        resourceUri,
                                        fixEntity[Voc.x],
                                        fixEntity[Voc.y]

                                    );
                            });
                });

            } else if ( entity.isof(Voc.USER )) {
                var fixEntity = this.fixFromVIE(entity);
                if( fixEntity[Voc.currentVersion] ) {
                    this.onUrisReady(
                        this.user,
                        fixEntity[Voc.currentVersion],
                        function(userUri, versionUri) {
                            new SSLearnEpVersionCurrentSet().handle(
                                function(object) {
                                    service.LOG.debug("handle result of VersionCurrentSet");
                                    service.LOG.debug("object", object);
                                    savable.resolve(true);
                                },
                                function(object) {
                                    service.LOG.warn("error:", object);
                                },
                                userUri,
                                service.userKey,
                                versionUri
                            );
                    });
                } else
                    savable.resolve(true);
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

            var service = this;
            var fixEntity = this.fixFromVIE(entity);

            if( entity.isof(Voc.CIRCLE )) {
                this.onUrisReady(
                    this.user,
                    fixEntity.uri,
                    function(userUri,uriUri){
                        new SSLearnEpVersionRemoveCircle().handle(
                            function(object) {
                                service.LOG.debug("handle result of LearnEpVersionRemoveCircle");
                                service.LOG.debug("object", object);
                                removable.resolve(object);
                            },
                            function(object) {
                                service.LOG.warn("error:");
                                service.LOG.warn("object", object);
                                removable.reject(entity);
                            },
                            userUri,
                            service.userKey,
                            uriUri
                        );
                });
            } else if( entity.isof(Voc.ORGAENTITY )) {
                this.onUrisReady(
                    this.user,
                    fixEntity.uri,
                    function(userUri,uriUri){
                        new SSLearnEpVersionRemoveEntity().handle(
                            function(object) {
                                service.LOG.debug("handle result of LearnEpVersionRemoveEntity");
                                service.LOG.debug("object", object);
                                removable.resolve(object);
                            },
                            function(object) {
                                service.LOG.warn("error:");
                                service.LOG.warn("object", object);
                                removable.reject(entity);
                            },
                            userUri,
                            service.userKey,
                            uriUri
                        );
                });
            } else {
                this.LOG.warn("SocialSemanticService remove for " + type.id + " not implemented");
            }

        },
        /**
         * Workaround for VIE's non-standard json-ld values and parsing behaviour.
         * @param {type} object
         * @return {undefined}
         */
        fixForVIE: function(object, idAttr, typeAttr) {
            var entity = _.clone(object);
            if( !idAttr) idAttr = 'uri';
            if( !typeAttr) typeAttr = 'type';
            entity['@subject'] = object[idAttr];
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
                object[curie] = object[prop];
                delete object[prop];
            }
            object['type'] = entity.get('@type').id;
            object['uri'] = entity.getSubject();
            delete object['@type'];
            delete object['@subject'];
            return object;
        }


    };

    return VIE.prototype.SocialSemanticService;

});

