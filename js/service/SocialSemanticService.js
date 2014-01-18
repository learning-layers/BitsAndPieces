// The SocialSemanticService wraps the SSS Client API.

define(['logger', 'vie', 'underscore', 'voc', 
        'sss.conn.entity', 'sss.conn.userevent', 'sss.conn.learnep'], function(Logger, VIE, _, Voc) {

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
            var type, typeCurie;
            this.LOG.debug("entity", entity);
            if( entity ) type = entity.get('@type');
            this.LOG.debug("type", type);
            if( type ) typeCurie = this.vie.namespaces.curie(type.id);
            this.LOG.debug("typeCurie", typeCurie);
            var service = this;
            if( !typeCurie || typeCurie == this.types.THING || typeCurie == this.types.DOCUMENT ) {
                new SSEntityDescGet().handle(
                    function(object) {
                        service.LOG.debug("handle result of EntityDescGet");
                        service.LOG.debug("object", object);
                        var entity = service.fixForVIE(object['entityDesc'], 'entityUri', 'entityType');
                        var vieEntity = new service.vie.Entity(entity);//SSS.Entity(entity);
                        var type = vieEntity.get('@type');
                        if( type && type.id && service.vie.namespaces.curie(type.id) == service.types.USER )  {
                            new SSLearnEpVersionCurrentGet().handle(
                                function(object2) {
                                    service.LOG.debug("handle result of VersionCurrentGet");
                                    service.LOG.debug("object", object2);
                                    vieEntity.set({
                                        'currentVersion': object2['learnEpVersion']['learnEpVersionUri']});
                                    loadable.resolve(vieEntity);
                                },
                                function(object2) {
                                    service.LOG.warn("error:", object2);
                                    loadable.resolve(vieEntity);
                                },
                                vieEntity.getSubject(),//this.vie.namespaces.uri(this.user),
                                service.userKey 
                                );
                        } else if( type && type.id && service.vie.namespaces.curie(type.id) == service.types.USEREVENT )  {
                            new SSUserEventGet().handle(
                                function(object2) {
                                    service.LOG.debug("handle result of UserEventTypeGet");
                                    service.LOG.debug("object", object2);
                                    var entity = service.fixForVIE(object2['uE'], 'uri');
                                    var vieEntity = new service.vie.Entity(entity);//SSS.Entity(entity);
                                    loadable.resolve(vieEntity);
                                },
                                function(object2) {
                                    service.LOG.warn("error:", object2);
                                    loadable.resolve(vieEntity);
                                },
                                service.vie.namespaces.uri(service.user),
                                service.userKey ,
                                vieEntity.getSubject()
                                );
                        } else
                            loadable.resolve(vieEntity);
                    },
                    function(object) {
                        service.LOG.warn("error:",object);
                    },
                    this.vie.namespaces.uri(this.user),
                    this.userKey,
                    this.vie.namespaces.uri(loadable.options.resource)
                );
            } else {
                this.LOG.warn("SocialSemanticService load for " + typeCurie + " not implemented");
            }
        },

        // Gets entities of a specific type
        TypeGet : function(loadable) {
            var type = loadable.options.type.id ? loadable.options.type.id : loadable.options.type;

            var typeCurie = this.vie.namespaces.curie(type);
            this.LOG.debug("TypeGet: " + typeCurie);

            var service = this;
            if( typeCurie == this.types.USEREVENT) {
                this.LOG.debug("SSUserEventsGet");
                new SSUserEventsGet().handle(
                    function(objects) {
                        service.LOG.debug("handle result of userEventsOfUser");
                        service.LOG.debug("objects", objects);
                        var entityInstances = [];
                        _.each(objects['uEs'], function(object) {
                            var entity = service.fixForVIE(object);
                            if(_.contains([
                                    "learnEpOpenEpisodesDialog",
                                    "learnEpSwitchEpisode",
                                    "learnEpSwitchVersion",
                                    "learnEpRenameEpisode",
                                    "learnEpCreateNewEpisodeFromScratch",
                                    "learnEpCreateNewEpisodeFromVersion",
                                    "learnEpCreateNewVersion",
                                    "timelineChangeTimelineRange",
                                    "learnEpViewEntityDetails",
                                    "viewEntity",
                                    "learnEpDropOrganizeEntity",
                                    "learnEpMoveOrganizeEntity",
                                    "learnEpDeleteOrganizeEntity",
                                    "learnEpCreateOrganizeCircle",
                                    "learnEpChangeOrganizeCircle",
                                    "learnEpRenameOrganizeCircle",
                                    "learnEpDeleteOrganizeCircle"], entity['@type'])) {
                                    service.LOG.debug(entity['@type'], 'filtered');
                                    return;
                                    }
                            var vieEntity = new service.vie.Entity(entity);
                            entityInstances.push(vieEntity);
                        });
                        loadable.resolve(entityInstances);
                    },
                    function(object) {
                        service.LOG.warn("error:");
                        service.LOG.warn(object);
                    },
                    this.vie.namespaces.uri(this.user),
                    this.userKey,
                    this.vie.namespaces.uri(loadable.options.forUser),
                    loadable.options.resource ? this.vie.namespaces.uri(loadable.options.resource) : null,
                    loadable.options.start,
                    loadable.options.end
                );
            } else if( typeCurie == this.types.EPISODE ) {
                this.LOG.debug("SSLearnEpsGet");
                new SSLearnEpsGet().handle(
                    function(objects) {
                        service.LOG.debug("handle result of epsGet");
                        service.LOG.debug("objects", objects);
                        var entityInstances = [];
                        _.each(objects['learnEps'], function(object) {
                            var entity = service.fixForVIE(object, 'learnEpUri');
                            var vieEntity = new service.vie.Entity(entity);
                            vieEntity.set('@type', Voc.EPISODE);
                            entityInstances.push(vieEntity);
                        });
                        loadable.resolve(entityInstances);
                    },
                    function(object) {
                        service.LOG.warn("error on SSLearnEpsGet (perhaps just empty):");
                        service.LOG.warn(object);
                        loadable.resolve([]);
                    },
                    this.vie.namespaces.uri(this.user),
                    this.userKey
                );

            } else if( typeCurie == this.types.VERSION ) {
                this.LOG.debug("SSLearnEpVersionsGet");
                new SSLearnEpVersionsGet().handle(
                    function(objects) {
                        service.LOG.debug("handle result of epVersionsGet");
                        service.LOG.debug("objects", objects);
                        var entityInstances = [];
                        _.each(objects['learnEpVersions'], function(object) {
                            var entity = service.fixForVIE(object, 'learnEpVersionUri');
                            entity['episode'] = entity['learnEpUri'];
                            delete entity['learnEpUri'];
                            var vieEntity = new service.vie.Entity(entity);
                            vieEntity.set('@type', Voc.VERSION);
                            entityInstances.push(vieEntity);
                            // each version has a organize component
                            // that would look like this object if the server would serve it
                            var organize = {
                                //'uri' : this.vie.namespaces.get('sss') + _.uniqueId('OrganizeWidget'),
                                'type' : service.vie.namespaces.uri('sss:' + service.types.ORGANIZE),
                                'circleType' : service.vie.namespaces.uri('sss:' + service.types.CIRCLE),
                                'entityType' : service.vie.namespaces.uri('sss:' + service.types.ORGAENTITY),
                                'version' : entity.getSubject()
                            };
                            // make a vie Entity to generate an id for it
                            //var vOrg = new service.vie.Entity(service.fixForVIE(organize));
                            // we buffer that object for explicit retrieval of organize
                            // and store it in memory as it would come from the server
                            //service.buffer[vOrg.getSubject()] = service.fixFromVIE(vOrg);
                        });
                        loadable.resolve(entityInstances);
                    },
                    function(object) {
                        service.LOG.warn("error:");
                        service.LOG.warn(object);
                    },
                    this.vie.namespaces.uri(this.user),
                    this.userKey,
                    this.vie.namespaces.uri(loadable.options.episode)
                );

            } else if (typeCurie == this.types.WIDGET ){
                // fetches Organize and Timeline stuff manually
                // and buffers the data for later fetch 

                var entities = [];
                var finishedCalls = [];
                var resolve = function(finished, entity) {
                    if( _.contains(finishedCalls, finished)) return;
                    finishedCalls.push(finished);
                    if( entity ) entities.push(entity);
                    service.LOG.debug('resolved', entity);
                    if( _.contains(finishedCalls, 'versionget') &&  
                        _.contains(finishedCalls, 'timelineget') ) {
                        loadable.resolve(entities);
                        }
                };
                var organize;
                for( var organizeId in this.buffer )
                    if( this.buffer[organizeId].version == loadable.options.version) {
                        organize = this.buffer[organizeId];
                        break;
                    }
                    
                if( organize ) 
                    //resolve('versionget', new OrganizeModel(this.fixForVIE(organize)));
                    resolve('versionget', new service.vie.Entity(this.fixForVIE(organize)));
                else
                    resolve('versionget');

                this.LOG.log("SSLearnEPGetTimelineState");
                new SSLearnEpVersionGetTimelineState().handle(
                    function(object) {
                        service.LOG.debug("handle result of LearnEpGetTimelineState");
                        service.LOG.debug("object", object);
                        if( !object['learnEpTimelineState']) {
                            resolve('timelineget');
                            return;
                        }
                        object = object['learnEpTimelineState'];
                        var vieEntity = new service.vie.Entity(service.fixForVIE({
                            'uri' : object.learnEpTimelineStateUri,
                            'type' : service.types.TIMELINE,
                            'user' : service.vie.namespaces.uri(service.user),
                            'timeAttr': service.vie.namespaces.uri('sss:timestamp'),
                            'predicate' : service.vie.namespaces.uri('sss:userEvent'),
                            'version' : service.vie.namespaces.uri(loadable.options.version),
                            //'timelineCollection' : new v.Collection([], {//new TL.Collection([], { 
                                //'model': SSS.Entity,
                                //'vie' : v
                            //})},
                            'start' : object.startTime,                            
                            'end' : object.endTime
                        }));

                        //service.buffer[vieEntity.getSubject()] = object;
                        //loadable.resolve(vieEntity);
                        resolve('timelineget', vieEntity);
                    },
                    function(object) {
                        service.LOG.warn("error:", object);
                        resolve('timelineget');
                    },
                    this.vie.namespaces.uri(this.user),
                    this.userKey,
                    this.vie.namespaces.uri(loadable.options.version)
                );

            } else if (typeCurie == this.types.CIRCLE){
                if (!loadable.options.organize) {
                    this.LOG.warn("no organize reference");
                    loadable.reject();
                    return;
                }
                //map organize id to version id
                var version = this.buffer[loadable.options.organize].version; 
                var entities = [];
                new SSLearnEpVersionGet().handle(
                    function(object) {
                        service.LOG.debug("handle result of LearnEpVersionGet");
                        service.LOG.debug("objects", object);
                        var key, idAttr;
                        _.each(object['learnEpVersion']['circles'], function(item){
                            var fixEntity = service.fixForVIE(item, 'learnEpCircleUri');
                            fixEntity.Label = item['label'];
                            fixEntity.LabelX = item['xLabel'];
                            fixEntity.LabelY = item['yLabel'];
                            fixEntity.rx = item['xR'];
                            fixEntity.ry = item['yR'];
                            fixEntity.cx = item['xC'];
                            fixEntity.cy = item['yC'];
                            delete fixEntity['label'];
                            delete fixEntity['xLabel'];
                            delete fixEntity['yLabel'];
                            delete fixEntity['xR'];
                            delete fixEntity['yR'];
                            delete fixEntity['xC'];
                            delete fixEntity['yC'];
                            fixEntity.organize = loadable.options.organize;
                            var vieEntity = new service.vie.Entity(fixEntity);
                            vieEntity.set('@type', typeCurie);
                            entities.push(vieEntity);
                        });
                        loadable.resolve(entities);
                    },
                    function(object) {
                        service.LOG.warn("error:", object);
                    },
                    this.vie.namespaces.uri(this.user),
                    this.userKey,
                    version
                );
            } else if (typeCurie == this.types.ORGAENTITY){
                if (!loadable.options.organize) {
                    this.LOG.warn("no organize reference");
                    loadable.reject();
                    return;
                }
                //map organize id to version id
                var version = this.buffer[loadable.options.organize].version; 
                var entities = [];
                new SSLearnEpVersionGet().handle(
                    function(object) {
                        service.LOG.debug("handle result of LearnEpVersionGet");
                        service.LOG.debug("objects", object);
                        var key, idAttr;
                        _.each(object['learnEpVersion']['entities'], function(item){
                            var fixEntity = service.fixForVIE(item, 'learnEpEntityUri');
                            fixEntity.resource = item['entityUri'];
                            delete fixEntity['entityUri'];
                            fixEntity.organize = loadable.options.organize;
                            var vieEntity = new service.vie.Entity(fixEntity);
                            vieEntity.set('@type', typeCurie);
                            entities.push(vieEntity);
                        });
                        loadable.resolve(entities);
                    },
                    function(object) {
                        service.LOG.warn("error:", object);
                    },
                    this.vie.namespaces.uri(this.user),
                    this.userKey,
                    version
                );


            } else {
                this.LOG.warn("SocialSemanticService load for " + typeCurie + " not implemented");
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
            var type = entity.get('@type');
            if (!type) 
                throw "Entity has no type, can't be saved";

            var typeCurie = this.vie.namespaces.curie(type.id);

            this.LOG.debug("typeCurie = " + typeCurie);

            var service = this;

            if( typeCurie == this.types.TIMELINE ) {
                this.LOG.debug("saving timeline");
                var obj = this.fixFromVIE(entity);
                obj.uri = entity.isNew() ? this.vie.namespaces.get('sss') + _.uniqueId('TimelineWidget')
                                         : obj.uri;
                this.buffer[obj.uri] = obj;
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
                        this.vie.namespaces.uri(this.user),
                        this.userKey,
                        obj.version,
                        _.isDate(obj.start) ? (obj.start - 0) : obj.start,
                        _.isDate(obj.end) ? (obj.end - 0) : obj.end
                    );
            } else if( typeCurie == this.types.ORGANIZE ) {
                this.LOG.debug("saving organize");
                var obj = this.fixFromVIE(entity);
                obj.uri = entity.isNew() ? this.vie.namespaces.get('sss') + _.uniqueId('OrganizeWidget')
                                         : obj.uri;
                this.buffer[obj.uri] = obj;
                if( entity.isNew() )
                    savable.resolve({'uri':obj.uri}); // organize was created
                else
                    savable.resolve(true); // organize was updated
            } else if( typeCurie == this.types.EPISODE ) {
                this.LOG.debug("saving episode");
                if( entity.isNew() ) {
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
                            this.vie.namespaces.uri(this.user),
                            this.userKey,
                            entity.get('label'),
                            'private'
                        );
                } else {
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
                            this.vie.namespaces.uri(this.user),
                            this.userKey,
                            entity.getSubject(),
                            entity.get('label')
                        );
                }
            } else if( typeCurie == this.types.VERSION ) {
                this.LOG.debug("saving version");
                var episode = entity.get('episode');
                if( episode.isEntity ) episode = episode.getSubject();
                new SSLearnEpVersionCreate().handle(
                        function(object) {
                            service.LOG.debug("handle result of LearnEpCreate");
                            service.LOG.debug("object", object);
                            savable.resolve({'uri':object['learnEpVersionUri']});
                        },
                        function(object) {
                            service.LOG.warn("error:");
                            service.LOG.warn("object", object);
                            savable.reject(entity);
                        },
                        this.vie.namespaces.uri(this.user),
                        this.userKey,
                        episode
                    );
            } else if( typeCurie == this.types.CIRCLE ) {
                this.LOG.debug("saving circle");
                var organize = entity.get('organize');
                if( organize.isEntity ) organize = organize.getSubject();

                // map internal organize model to its version
                if( !this.buffer[organize]) {
                    this.LOG.warn("circle can't be saved because no organize exists");
                    savable.reject(entity);
                    return;
                }
                var version = this.buffer[organize].version;
                if( version.isEntity ) version = version.getSubject();
                // end map

                var fixEntity = this.fixFromVIE(entity);

                if( entity.isNew() )
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
                            this.vie.namespaces.uri(this.user),
                            this.userKey,
                            version,
                            fixEntity.Label,
                            fixEntity.LabelX,
                            fixEntity.LabelY,
                            fixEntity.rx,
                            fixEntity.ry,
                            fixEntity.cx,
                            fixEntity.cy

                        );
                else
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
                            this.vie.namespaces.uri(this.user),
                            this.userKey,
                            fixEntity.uri,
                            fixEntity.Label,
                            fixEntity.LabelX,
                            fixEntity.LabelY,
                            fixEntity.rx,
                            fixEntity.ry,
                            fixEntity.cx,
                            fixEntity.cy

                        );

            } else if( typeCurie == this.types.ORGAENTITY ) {
                this.LOG.debug("saving orgaentity");
                var organize = entity.get('organize');
                if( organize.isEntity ) organize = organize.getSubject();

                // map internal organize model to its version
                if( !this.buffer[organize]) {
                    this.LOG.warn("orgaentity can't be saved because no organize exists");
                    savable.reject(entity);
                    return;
                }
                var version = this.buffer[organize].version;
                if( version.isEntity ) version = version.getSubject();
                // end map

                var fixEntity = this.fixFromVIE(entity);

                if(entity.isNew() )
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
                            this.vie.namespaces.uri(this.user),
                            this.userKey,
                            version,
                            fixEntity.resource,
                            fixEntity.x,
                            fixEntity.y

                        );
                else
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
                            this.vie.namespaces.uri(this.user),
                            this.userKey,
                            fixEntity.uri,
                            fixEntity.resource,
                            fixEntity.x,
                            fixEntity.y

                        );

            } else if ( typeCurie == this.types.USER ) {
                var fixEntity = this.fixFromVIE(entity);
                if( fixEntity.currentVersion ) {
                    new SSLearnEpVersionCurrentSet().handle(
                        function(object) {
                            service.LOG.debug("handle result of VersionCurrentSet");
                            service.LOG.debug("object", object);
                            savable.resolve(true);
                        },
                        function(object) {
                            service.LOG.warn("error:", object);
                        },
                        this.vie.namespaces.uri(this.user),
                        this.userKey,
                        fixEntity.currentVersion
                        );
                } else
                    savable.resolve(true);
            } else {
                this.LOG.warn("SocialSemanticService save for " + typeCurie + " not implemented");
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
            var type = entity.get('@type');
            if (!type) 
                throw "Entity has no type, can't be saved";

            var typeCurie = this.vie.namespaces.curie(type.id);

            this.LOG.debug("typeCurie = " + typeCurie);

            var service = this;
            var fixEntity = this.fixFromVIE(entity);

            if( typeCurie == this.types.CIRCLE ) {
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
                            this.vie.namespaces.uri(this.user),
                            this.userKey,
                            fixEntity.uri
                    );
            } else if( typeCurie == this.types.ORGAENTITY ) {
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
                            this.vie.namespaces.uri(this.user),
                            this.userKey,
                            fixEntity.uri
                    );
            } else {
                this.LOG.warn("SocialSemanticService remove for " + typeCurie + " not implemented");
            }

        },
        /**
         * Workaround for VIE's non-standard json-ld values and parsing behaviour.
         * @param {type} object
         * @return {undefined}
         */
        fixForVIE: function(object, idAttr, typeAttr) {
            var entity = _.clone(object);
            /*
            for( var prop in entity ) {
                entity['sss:'+prop] = entity[prop];
                delete entity[prop];
            }
            */
            if( !idAttr) idAttr = 'uri';
            if( !typeAttr) typeAttr = 'type';
            entity['@subject'] = object[idAttr];
            entity['@type'] = object[typeAttr];
            delete entity[typeAttr];
            delete entity[idAttr];

            return entity;
        },

        /**
         * Workaround for VIE's non-standard json-ld values and parsing behaviour.
         * @param {type} object
         * @return {undefined}
         */
        fixFromVIE: function(entity) {
            var object = _.clone(entity.attributes);
            this.LOG.debug(JSON.stringify(object));
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

