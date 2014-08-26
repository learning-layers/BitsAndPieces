define(['underscore', 'logger'], function(_, Logger) {
    // to be called with a deferred object as context (eg. loadable)
    var LOG = Logger.get('SSSModel');
    var checkEmpty = function(object) {
        if( _.isEmpty(object) )  {
            loadable.reject(this.options);
            sss.LOG.error("error: call for ",this.options, " returns empty result");
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
    };

    var multipleFixForVIE = function(objects, idAttr, typeAttr) {
        LOG.debug('multipleFixForVIE', objects);
        _.each(objects, function(object) {
            fixForVIE(object, idAttr, typeAttr);
        });
    };

    var decorations = {
        'single_desc_entity' : [checkEmpty, fixEntityDesc, fixForVIE],
        'single_entity' : [checkEmpty, fixForVIE],
        'multiple_entities' : [multipleFixForVIE]
    };

    var m = {
        'entityGet' : {
            'resultKey' : 'entity',
            'decoration' : decorations['single_entity']
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
            'decoration' : decorations['multiple_entities']
        },
        'userAll' : {
            'resultKey' : 'users',
        }
    };
    m['searchByTags'] = m['searchCombined'] = 
        _.extend({}, m['search'], {
            'resultKey' : 'searchResults',
            '@id' : 'entity'
        });
    return m;
});
