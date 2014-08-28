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
        return true;
    };
    /**
     * Workaround for VIE's non-standard json-ld values and parsing behaviour.
     * @param {type} object
     * @return {undefined}
     */
    var fixForVIE = function(object, idAttr, typeAttr) {
        if( !idAttr) idAttr = 'id';
        if( !typeAttr) typeAttr = 'type';
        object[VIE.prototype.Entity.prototype.idAttribute] = object[idAttr];
        delete object[idAttr];
        if (object[typeAttr]) {
            object['@type'] = object[typeAttr].indexOf('sss:') === 0 ? object[typeAttr] : "sss:"+object[typeAttr];
            delete object[typeAttr];
        }

        for( var prop in object ) {
            if( prop.indexOf('@') === 0 ) continue;
            if( prop.indexOf('sss:') === 0 ) continue;
            if( prop.indexOf('http:') === 0 ) continue;
            object['sss:'+prop] = object[prop];
            delete object[prop];
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
                case 'array':
                    params[key] = params[key].join(',');
                    break;
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
        entityUpdate : {
            resultKey : 'entity'
        },
        'entityDescGet' : {
            'resultKey' : 'desc',
            '@id' : 'entity',
            'decoration' : decorations['single_desc_entity']
        },
        'categoriesPredefinedGet' : {
            'resultKey' : 'categories'
        },
        'search' : {
            'resultKey' : 'entities',
            'params' : {
                keywordsToSearchFor : {type : 'array'},
                wordsToSearchFor : {type : 'array'},
                tagsToSearchFor : {type : 'array'},
                misToSearchFor : {type : 'array'},
                labelsToSearchFor : {type : 'array'},
                descriptionsToSearchFor : {type : 'array'},
                typesToSearchOnlyFor : {type : 'array'},
                entitiesToSearchWithin : {type : 'array'}
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_entity']
        },
        'userAll' : {
            'resultKey' : 'users',
        },
        'entityDescsGet' : {
            'resultKey' : 'descs', 
            '@id' : 'entity',
            'params' : {
                'entities' : { 'type' : 'array' },
                'types' : { 'type' : 'array' },
            },
            'preparation' : preparations['scrubParams'],
            'decoration' : decorations['single_desc_entity']
        },
        learnEpVersionCurrentGet : {
            resultKey : 'learnEpVersion'
        },
        learnEpVersionCurrentSet : {
            resultKey : 'learnEpVersion'
        },
        learnEpsGet : {
            resultKey : 'learnEps',
            decoration: decorations['single_entity']
        },
        learnEpVersionsGet : {
            resultKey : 'learnEpVersions',
            decoration: decorations['single_entity'],
            subResults : [
                {
                    resultKey : 'circles',
                    decoration: decorations['single_entity']
                },
                {
                    resultKey: 'entities',
                    decoration: decorations['single_entity']
                }
            ]
        },
        learnEpVersionGetTimelineState : {
            resultKey : 'learnEpTimelineState',
            decoration: decorations['single_entity']
        },
        uEsGet: {
            resultKey: 'uEs',
            decoration: decorations['fixForVIE_only']
        },
        learnEpVersionSetTimelineState : {
            resultKey: 'learnEpTimelineState', 
            params : {
                startTime : { type : 'number' },
                endTime : { type : 'number' }
            },
            preparation: preparations['scrubParams']
        },
        learnEpVersionAddCircle : {
            resultKey : 'learnEpCircle'
        },
        learnEpVersionAddEntity : {
            resultKey : 'learnEpEntity'
        },
        learnEpVersionUpdateCircle : {
            resultKey : 'worked'
        },
        learnEpVersionUpdateEntity : {
            resultKey : 'worked'
        },
        learnEpCreate : {
            resultKey : 'learnEp'
        },
        learnEpVersionCreate : {
            resultKey : 'learnEpVersion'
        },
        tagAdd : {
            resultKey : 'tag'
        },
        flagsSet : {
            resultKey : 'worked',
            params : {
                entities : { type : 'array' },
                types : { type : 'array' }
            },
            preparation: preparations['scrubParams']
        },
        entityShare : {
            resultKey : 'worked',
            params : {
                users : { type : 'array' },
            },
            preparation: preparations['scrubParams']
        },
        entityCopy : {
            resultKey : 'worked',
            params : {
                users : { type : 'array' },
                entitiesToExclude : { type : 'array' },
            },
            preparation: preparations['scrubParams']
        }
    };
    return m;
});
