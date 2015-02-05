// works with SSS Rest API 4.1.0
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
            }
        }
        return true;
    }

    var decorations = {
        'single_desc_entity' : [checkEmpty, fixEntityDesc, fixForVIE],
        'single_entity' : [checkEmpty, fixForVIE],
        'single_entity_with_contained' : [checkEmpty, fixForContainedEntity, fixForVIE],
        'fixForVIE_only' : [fixForVIE]
    };

    var preparations = {
        'scrubParams' : [scrubParams],
        'fixFromVIE' : [fixFromVIE]
    };

    var m = {
        'entityGet' : {
            'resultKey' : 'entity',
            'decoration' : decorations['single_entity']
        },
        'entityUpdate' : {
            'resultKey' : 'entity'
        },
        'entityDescGet' : {
            'resultKey' : 'desc',
            'decoration' : decorations['single_desc_entity']
        },
        'categoriesPredefinedGet' : {
            'resultKey' : 'categories'
        },
        'search' : {
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
            'resultKey' : 'users',
        },
        'entityDescsGet' : {
            'resultKey' : 'descs', 
            'params' : {
                'entities' : { 'type' : 'array' },
                'types' : { 'type' : 'array' },
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_desc_entity']
        },
        'learnEpVersionCurrentGet' : {
            'resultKey' : 'learnEpVersion'
        },
        'learnEpVersionCurrentSet' : {
            'resultKey' : 'learnEpVersion'
        },
        'learnEpsGet' : {
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
            ]
        },
        'learnEpVersionGetTimelineState' : {
            'resultKey' : 'learnEpTimelineState',
            'decoration' : decorations['single_entity']
        },
        'uEsGet' : {
            'resultKey' : 'uEs',
            'decoration' : decorations['fixForVIE_only'],
            '@type': 'ueType'
        },
        'learnEpVersionSetTimelineState' : {
            'resultKey' : 'learnEpTimelineState', 
            'params' : {
                'startTime' : { 'type' : 'number' },
                'endTime' : { 'type' : 'number' }
            },
            'preparation' : preparations['scrubParams']
        },
        'learnEpVersionAddCircle' : {
            'resultKey' : 'learnEpCircle'
        },
        'learnEpVersionAddEntity' : {
            'resultKey' : 'learnEpEntity'
        },
        'learnEpVersionUpdateCircle' : {
            'resultKey' : 'worked'
        },
        'learnEpVersionUpdateEntity' : {
            'resultKey' : 'worked'
        },
        'learnEpCreate' : {
            'resultKey' : 'learnEp'
        },
        'learnEpVersionCreate' : {
            'resultKey' : 'learnEpVersion'
        },
        'tagAdd' : {
            'resultKey' : 'tag'
        },
        'flagsSet' : {
            'resultKey' : 'worked',
            'params' : {
                'entities' : { 'type' : 'array' },
                'types' : { 'type' : 'array' }
            },
            'preparation' : preparations['scrubParams']
        },
        'circleEntityShare' : {
            'resultKey' : 'worked',
            'params' : {
                'users' : { 'type' : 'array' },
            },
            'preparation' : preparations['scrubParams']
        },
        'entityCopy' : {
            'resultKey' : 'worked',
            'params' : {
                'users' : { 'type' : 'array' },
                'entitiesToExclude' : { 'type' : 'array' },
            },
            'preparation' : preparations['scrubParams']
        },
        'recommTags' : {
            'resultKey' : 'tags',
            'params' : {
                'maxTags' : { 'default' : 20 }
            },
            'preparation' : preparations['scrubParams']
        },
        'uECountGet' : {
            'resultKey' : 'count'
        },
        'learnEpVersionRemoveCircle' : {
            'resultKey' : 'worked'
        },
        'learnEpVersionRemoveEntity' : {
            'resultKey' : 'worked'
        },
        'tagsRemove' : {
            'resultKey' : 'worked'
        },
        'messageSend' : {
            'resultKey' : 'message'
        },
        'messagesGet' : {
            'resultKey' : 'messages',
            'params' : {
                'includeRead' : { 'default' : false }
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_entity']
        },
        'recommResources' : {
            'resultKey' : 'resources',
            'params' : {
                'maxResources' : { 'default' : 20 }
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['fixForVIE_only'],
            '@resourceKey' : 'resource'
        },
        'activitiesGet' : {
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
            ]
        },
        'tagFrequsGet' : {
            'resultKey' : 'tagFrequs'
        },
        'learnEpLockSet' : {
            'resultKey' : 'worked'
        },
        'learnEpLockRemove' : {
            'resultKey' : 'worked'
        },
        'learnEpLockHold' : {
            'resultKey' : 'locked',
            'passThroughKeys' : ['locked', 'lockedByUser', 'remainingTime']
        },
        'entityAdd' : {
            'resultKey' : 'entity'
        }
    };
    return m;
});
