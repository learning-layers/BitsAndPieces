// works with SSS REST API V2 v11.0.0
define(['underscore', 'logger'], function(_, Logger) {
    // to be called with a deferred object as context (eg. loadable)
    var LOG = Logger.get('SSSModel');
    var checkEmpty = function(object) {
        LOG.debug('checkEmpty', object);
        if( _.isEmpty(object) )  {
            this.reject(this.options);
            LOG.error("error: call for ",this.options, " returns empty result");
            return false;
        }
        return true;
    };

    var fixEntityDesc = function(object) {
        // Extract importance from flags
        // Remove flags from object
        if ( _.isArray(object['flags']) ) {
            if ( !_.isEmpty(object['flags']) ) {
                var importance;
                    creationTime = 1;
                _.each(object['flags'], function(flag) {
                    // In case multiple are provided
                    if ( flag.flagType === 'importance'  && flag.creationTime > creationTime) {
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
        return true;
    };

    var fixTags = function(object) {
        if ( _.isArray(object['tags']) ) {
            if ( !_.isEmpty(object['tags']) ) {
                var fixedTags = _.map(object['tags'], function(tag) {
                    if ( _.isObject(tag) ) {
                        return tag.label;
                    }
                    return tag;
                });
                object['tags'] = fixedTags;
            }
        }
        return true;
    };

    /**
     * Fix in case object contains real entity data instead of URI.
     * Applies fixForVIE to the attribute named 'entity', uses default
     * idAttr and typeAttr.
     * @param {object} object
     * @retrun {undefined}
     */
    var fixForContainedEntity = function(object) {
        return fixForVIE(object['entity']);
    };

    /**
     * Workaround for VIE's non-standard json-ld values and parsing behaviour.
     * @param {object} object      Single resultSet object
     * @param {string} idAttr      Mappable identifier attribute name
     * @param {string} typeAttr    Mappable type attribute name
     * @param {string} resourceKey Resource key name if the root object is not a resource
     * @return {undefined}
     */
    var fixForVIE = function(object, idAttr, typeAttr, resourceKey) {
        var fixable = object;

        if( !idAttr) idAttr = 'id';
        if( !typeAttr) typeAttr = 'type';

        if ( resourceKey ) {
            fixable = object[resourceKey];
        }

        // If both @subject and @type are present, then there is no need
        // to refix the result.
        // As caching might lead to multiple callback being called on the
        // same result set, do not fix it more than once.
        // See service resolve() method for more details.
        if ( fixable['@subject'] && fixable['@type'] ) {
            return true;
        }

        fixable[VIE.prototype.Entity.prototype.idAttribute] = fixable[idAttr];
        delete fixable[idAttr];
        if ( fixable[typeAttr] ) {
            fixable['@type'] = fixable[typeAttr].indexOf('sss:') === 0 ? fixable[typeAttr] : "sss:"+fixable[typeAttr];
            delete fixable[typeAttr];
        }

        for( var prop in fixable ) {
            if( prop.indexOf('@') === 0 ) continue;
            if( prop.indexOf('sss:') === 0 ) continue;
            if( prop.indexOf('http:') === 0 ) continue;
            fixable['sss:'+prop] = fixable[prop];
            // XXX Deal with author, force it to be URI not Object
            // This is not a permanent solution, just a quick fix
            if ( prop === 'author' ) {
                if ( _.isObject(fixable['sss:'+prop]) ) {
                    fixable['sss:'+prop] = fixable['sss:' + prop].id;
                }
            }
            delete fixable[prop];
        }
        return true;
    };

    /**
     * Workaround for VIE's non-standard json-ld values and parsing behaviour.
     * To be called in the context of the service.
     * @param {type} object
     * @return {undefined}
     */
    var fixFromVIE= function(object, service) {
        var idAttr = service['@id'],
            typeAttr = service['@type'];
        
        if( !idAttr) idAttr = 'id';
        if( !typeAttr) typeAttr = 'type';
        this.LOG.debug('fixFromVIE', JSON.stringify(object));
        for( var prop in object ) {
            if( prop.indexOf('@') === 0 ) continue;
            var curie = this.vie.namespaces.curie(prop);
            if( curie.indexOf('sss:') === 0 ) curie = curie.substring(4);
            object[curie] = object[prop];
            delete object[prop];
        }
        object[typeAttr] = object['@type'];
        object[idAttr] = object[VIE.prototype.Entity.prototype.idAttribute];
        delete object['@type'];
        delete object[VIE.prototype.Entity.prototype.idAttribute];
    };

    var scrubParams = function(params, service) {
        var scrub = service['params'];
        for( var key in scrub ) {
            LOG.debug('key', key, scrub[key]['default']);
            if( !params[key] ) {
                if( scrub[key]['default'] !== undefined) {
                    params[key] = scrub[key]['default'];
                }
                continue;
            }
            switch( scrub[key]['type'] ) {
                case 'number':
                    // force cast to number
                    params[key] = params[key] - 0;
                    break;
                case 'encodedComponent':
                    params[key] = encodeURIComponent(params[key]);
                    break;
                case 'csv':
                    if (_.isArray(params[key])) {
                        params[key] = encodeURIComponent(params[key].join(','));
                    }
                    break;
            }
        }
        return true;
    }

    var decorations = {
        'single_desc_entity' : [checkEmpty, fixEntityDesc, fixTags, fixForVIE],
        'single_entity' : [checkEmpty, fixForVIE],
        'single_entity_with_contained' : [checkEmpty, fixForContainedEntity, fixForVIE],
        'fixForVIE_only' : [fixForVIE]
    };

    var preparations = {
        'scrubParams' : [scrubParams],
        'fixFromVIE' : [fixFromVIE]
    };

    var m = {
        'entityUpdate' : {
            'reqType' : 'PUT',
            'reqPath' : 'entities/entities/:entity',
            'resultKey' : 'entity',
            'params' : {
                'entity': { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable' : 'entity'
        },
        'entityDescGet' : {
            'reqType' : 'POST',
            'reqPath' : 'entities/entities/filtered/:entity',
            'resultKey' : 'entities',
            'params' : {
                'entity': { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_desc_entity'],
            'injectVariable': 'entity'
        },
        'categoriesPredefinedGet' : {
            'reqType' : 'GET',
            'reqPath' : 'categories/categories/predefined',
            'resultKey' : 'categories'
        },
        'search' : {
            'reqType' : 'POST',
            'reqPath' : 'search/search/filtered',
            'resultKey' : 'entities',
            'passThroughKeys' : ['pageNumber', 'pageNumbers', 'pagesID'],
            'params' : {
                'wordsToSearchFor' : {'type' : 'array'},
                'tagsToSearchFor' : {'type' : 'array'},
                'misToSearchFor' : {'type' : 'array'},
                'labelsToSearchFor' : {'type' : 'array'},
                'descriptionsToSearchFor' : {'type' : 'array'},
                'typesToSearchOnlyFor' : {'type' : 'array'},
                'entitiesToSearchWithin' : {'type' : 'array'}
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_entity']
        },
        'userAll' : {
            'reqType': 'GET',
            'reqPath': 'users/users',
            'resultKey' : 'users',
            'decoration': decorations['single_entity']
        },
        'entityDescsGet' : {
            'reqType': 'POST',
            'reqPath': 'entities/entities/filtered/:entities',
            'resultKey' : 'entities',
            'params' : {
                'entities' : { 'type' : 'csv' },
                'setTags': { 'default' : true },
                'setFlags': { 'default' : true }
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_desc_entity'],
            'injectVariable': 'entities'
        },
        'learnEpVersionCurrentGet' : {
            'reqType': 'GET',
            'reqPath': 'learneps/learneps/versions/current',
            'resultKey' : 'learnEpVersion'
        },
        'learnEpVersionCurrentSet' : {
            'reqType': 'POST',
            'reqPath': 'learneps/learneps/versions/current/:learnEpVersion',
            'resultKey' : 'learnEpVersion',
            'params': {
                'learnEpVersion' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEpVersion'
        },
        'learnEpsGet' : {
            'reqType': 'GET',
            'reqPath': 'learneps/learneps',
            'resultKey' : 'learnEps',
            'decoration' : decorations['single_entity'],
            'subResults' : [
                {
                    'resultKey' : 'users',
                    'decoration' : decorations['single_entity']
                }
            ]
        },
        'learnEpVersionsGet' : {
            'reqType': 'GET',
            'reqPath': 'learneps/learneps/:learnEp/versions',
            'resultKey' : 'learnEpVersions',
            'decoration' : decorations['single_entity'],
            'subResults' : [
                {
                    'resultKey' : 'learnEpCircles',
                    'decoration' : decorations['single_entity']
                },
                {
                    'resultKey' : 'learnEpEntities',
                    'decoration' : decorations['single_entity_with_contained']
                }
            ],
            'params': {
                'learnEp' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEp'
        },
        'learnEpVersionGetTimelineState' : {
            'reqType': 'GET',
            'reqPath': 'learneps/learneps/versions/:learnEpVersion/timeline/state',
            'resultKey' : 'learnEpTimelineState',
            'params': {
                'learnEpVersion' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_entity'],
            'injectVariable': 'learnEpVersion'
        },
        'uEsGet' : {
            'reqType' : 'POST',
            'reqPath' : 'ues/ues/filtered',
            'resultKey' : 'userEvents',
            'params' : {
                'setTags' : { 'default' : true },
                'setFlags' : { 'default' : true }
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_entity_with_contained']
        },
        'learnEpVersionSetTimelineState' : {
            'reqType': 'POST',
            'reqPath': 'learneps/learneps/versions/:learnEpVersion/timeline/state',
            'resultKey' : 'learnEpTimelineState', 
            'params' : {
                'startTime' : { 'type' : 'number' },
                'endTime' : { 'type' : 'number' },
                'learnEpVersion' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEpVersion'
        },
        'learnEpVersionAddCircle' : {
            'reqType': 'POST',
            'reqPath': 'learneps/learneps/versions/:learnEpVersion/circles',
            'resultKey' : 'learnEpCircle',
            'params' : {
                'learnEpVersion' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEpVersion'
        },
        'learnEpVersionAddEntity' : {
            'reqType': 'POST',
            'reqPath': 'learneps/learneps/versions/:learnEpVersion/entities',
            'resultKey' : 'learnEpEntity',
            'params' : {
                'learnEpVersion' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEpVersion'
        },
        'learnEpVersionUpdateCircle' : {
            'reqType': 'PUT',
            'reqPath': 'learneps/learneps/circles/:learnEpCircle',
            'resultKey' : 'worked',
            'params' : {
                'learnEpCircle' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEpCircle'
        },
        'learnEpVersionUpdateEntity' : {
            'reqType': 'PUT',
            'reqPath': 'learneps/learneps/entities/:learnEpEntity',
            'resultKey' : 'worked',
            'params' : {
                'learnEpEntity' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEpEntity'
        },
        'learnEpCreate' : {
            'reqType': 'POST',
            'reqPath': 'learneps/learneps',
            'resultKey' : 'learnEp'
        },
        'learnEpVersionCreate' : {
            'reqType': 'POST',
            'reqPath': 'learneps/learneps/:learnEp/versions',
            'resultKey' : 'learnEpVersion',
            'params' : {
                'learnEp' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEp'
        },
        'tagAdd' : {
            'reqType': 'POST',
            'reqPath': 'tags/tags',
            'resultKey' : 'tag'
        },
        'flagsSet' : {
            'reqType': 'POST',
            'reqPath': 'flags/flags',
            'resultKey' : 'worked',
            'params' : {
                'entities' : { 'type' : 'array' },
                'types' : { 'type' : 'array' }
            },
            'preparation' : preparations['scrubParams']
        },
        'circleEntityShare' : {
            'reqType': 'PUT',
            'reqPath': 'entities/entities/:entity/share',
            'resultKey' : 'worked',
            'params' : {
                'users' : { 'type' : 'array' },
                'entity' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'entity'
        },
        'entityCopy' : {
            'reqType': 'PUT',
            'reqPath': 'entities/entities/:entity/copy',
            'resultKey' : 'worked',
            'params' : {
                'forUsers' : { 'type' : 'array' },
                'entitiesToExclude' : { 'type' : 'array' },
                'includeEntities' : { 'default' : true },
                'entity' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'entity'
        },
        'recommTags' : {
            'reqType' : 'POST',
            'reqPath' : 'recomm/recomm/filtered/tags',
            'resultKey' : 'tags',
            'params' : {
                'maxTags' : { 'default' : 20 }
            },
            'preparation' : preparations['scrubParams']
        },
        'uECountGet' : {
            'reqType' : 'POST',
            'reqPath' : 'ues/ues/filtered/count',
            'resultKey' : 'count'
        },
        'learnEpVersionRemoveCircle' : {
            'reqType': 'DELETE',
            'reqPath': 'learneps/learneps/circles/:learnEpCircle',
            'resultKey' : 'worked',
            'params' : {
                'learnEpCircle' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEpCircle'
        },
        'learnEpVersionRemoveEntity' : {
            'reqType': 'DELETE',
            'reqPath': 'learneps/learneps/entities/:learnEpEntity',
            'resultKey' : 'worked',
            'params' : {
                'learnEpEntity' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEpEntity'
        },
        'tagsRemove' : {
            'reqType': 'DELETE',
            'reqPath': 'tags/tags/entities/:entity',
            'resultKey' : 'worked',
            'params' : {
                'entity' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'entity'
        },
        'messageSend' : {
            'reqType' : 'POST',
            'reqPath' : 'messages/messages',
            'resultKey' : 'message'
        },
        'messagesGet' : {
            'reqType' : 'POST',
            'reqPath' : 'messages/messages/filtered',
            'resultKey' : 'messages',
            'params' : {
                'includeRead' : { 'default' : false }
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_entity'],
            'passThroughKeys' : ['queryTime']
        },
        'recommResources' : {
            'reqType' : 'POST',
            'reqPath' : 'recomm/recomm/filtered/resources',
            'resultKey' : 'resources',
            'params' : {
                'maxResources' : { 'default' : 20 }
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['fixForVIE_only'],
            '@resourceKey' : 'resource'
        },
        'activitiesGet' : {
            'reqType': 'POST',
            'reqPath': 'activities/activities/filtered',
            'resultKey' : 'activities',
            'decoration' : decorations['single_entity_with_contained'],
            'subResults' : [
                {
                    'resultKey' : 'users',
                    'decoration' : decorations['single_entity']
                },
                {
                    'resultKey' : 'entities',
                    'decoration' : decorations['single_entity']
                }
            ],
            'passThroughKeys' : ['queryTime']
        },
        'tagFrequsGet' : {
            'reqType' : 'POST',
            'reqPath' : 'tags/tags/filtered/frequs',
            'resultKey' : 'tagFrequs'
        },
        'learnEpLockSet' : {
            'reqType': 'POST',
            'reqPath': 'learneps/learneps/:learnEp/locks',
            'resultKey' : 'worked',
            'params' : {
                'learnEp' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEp'
        },
        'learnEpLockRemove' : {
            'reqType': 'DELETE',
            'reqPath': 'learneps/learneps/:learnEp/locks',
            'resultKey' : 'worked',
            'params' : {
                'learnEp' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEp'
        },
        'learnEpLockHold' : {
            'reqType': 'GET',
            'reqPath': 'learneps/learneps/:learnEp/locks',
            'resultKey' : 'learnEpLocks',
            'params' : {
                'learnEp' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'passThroughKeys' : ['locked', 'lockedByUser', 'remainingTime'],
            'injectVariable': 'learnEp'
        },
        'entityAdd' : {
            'reqType': 'POST',
            'reqPath': 'entities/entities',
            'resultKey' : 'entity'
        },
        'learnEpRemove' : {
            'reqType': 'DELETE',
            'reqPath': 'learneps/learneps/:learnEp',
            'resultKey' : 'worked',
            'params' : {
                'learnEp' : { 'type' : 'encodedComponent' }
            },
            'preparation' : preparations['scrubParams'],
            'injectVariable': 'learnEp'
        }
    };
    return m;
});
