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

        this.vie = null; /* will be set via VIE.use(); */
        /* overwrite options.name if you want to set another name */
        this.name = this.options.name;
        
        this.user = this.options.user;
        this.userKey = this.options.userKey;

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
        }, 
        /* AJAX request wrapper */
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

            this.LOG.debug("SocialSemanticService analyze");
            this.LOG.debug("analyzable",analyzable.options);
            try{
                this.invoke(analyzable);
            }catch(e) {
                this.LOG.error(e);
            }
        },
        load: function(loadable) {
            var correct = loadable instanceof this.vie.Loadable || loadable instanceof this.vie.Analyzable;
            if (!correct) {
                throw new Error("Invalid Loadable passed");
            }

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
            }catch(e) {
                this.LOG.error(e);
            }
        },

        remove: function(removable) {
            var correct = removable instanceof this.vie.Removable;
            if (!correct) {
                throw "Invalid Removable passed";
            }

            this.LOG.debug("SocialSemanticService remove");
            this.LOG.debug("removable.options", removable.options);

            try{
                this.invoke(removable);
                return;
            }catch(e) {
                this.LOG.error(e);
            }
        }
    };

    return VIE.prototype.SocialSemanticService;

});


