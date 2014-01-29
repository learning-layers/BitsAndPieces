/**
 * Copyright 2013 Graz University of Technodebugy - KTI (Knowledge Technodebugies Institute)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var MockupNS = MockupNS || "http://eval.bp/";
var MockupLog = MockupLog || require('logger').get('Mockup');
var MockupTimeout = MockupTimeout || 100;

var SSMockupResources = [
    {
        'entityUri': MockupNS + 'user/maria/',
        'label': 'Maria',
        'entityType' : 'user'
    },
    {
        'entityUri': MockupNS + 'user/tobias/',
        'label': 'Tobias',
        'entityType' : 'user'
    },
    {
        'entityUri': MockupNS + 'user/dieter/',
        'label': 'Dieter',
        'entityType' : 'user'
    },
    {
        'entityUri': MockupNS + 'user/christoph/',
        'label': 'Christoph',
        'entityType' : 'user'
    },
    {
        'entityUri': MockupNS + 'user/peter/',
        'label': 'Peter',
        'entityType' : 'user',
        'currentVersion': MockupNS + 'version/versionY'
    },
    {
        'entityUri': MockupNS + 'user/paul/',
        'label': 'Paul',
        'entityType' : 'user'
    },
    {
        'entityUri': MockupNS + 'coll/resource01',
        'label': 'White Folder',
        'entityType' : 'coll'
    },
    {
        'entityUri': MockupNS + 'coll/resource02',
        'label': 'Blue Folder',
        'entityType' : 'coll'
    },
    {
        'entityUri': MockupNS + 'coll/resource03',
        'label': 'Green Folder',
        'entityType' : 'coll'
    },
    {
        'entityUri': MockupNS + 'doc/document01',
        'label': 'Mr Smith',
        'content' : 'This patient is suffering from severe cancer blablabla',
        'entityType' : 'file'
    },
    {
        'entityUri': MockupNS + 'doc/document02',
        'label': 'Mrs Johnson',
        'content' : 'baljk This patient is suffering from severe cancer blablabla',
        'entityType' : 'file'
    },
    {
        'entityUri': MockupNS + 'doc/document03',
        'label': 'Mr Miller',
        'content' : '1234 This patient is suffering from severe cancer blablabla',
        'entityType' : 'file'
    }
];

var SSMockupUsersContext = {
    '@context': {
        
    }
};

function SSLearnEpVersionCurrentSet() {
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri){
    
        MockupLog.debug("SSVERSIONCURRENTSET " +learnEpVersionUri);
        for (var i = 0; i < SSMockupResources.length; i++) {
            var u = SSMockupResources[i];
            if( u['entityUri'] == user) {
                SSMockupResources[i]['currentVersion'] = learnEpVersionUri;
                setTimeout(function(){resultHandler(true);}, MockupTimeout);
                return;
            }
        }
        errorHandler({'error':'Resource not found'});
	};

}

function SSLearnEpVersionCurrentGet() {
  this.handle = function(resultHandler, errorHandler, user, key){
    
        MockupLog.debug("SSVERSIONCURRENTGET " +user);
        for (var i = 0; i < SSMockupResources.length; i++) {
            var u = SSMockupResources[i];
            if( u['entityUri'] == user) {
                setTimeout(function(){resultHandler({'learnEpVersion': {'learnEpVersionUri':SSMockupResources[i]['currentVersion']}});}, MockupTimeout);
                return;
            }
        }
        errorHandler({'error':'Resource not found'});
	};

}


/**read 
 * Get User
 *
 * @class SSGetUser
 */
function SSLabelGet() {

    /**
     * Return mockup data.
     *
     * @method handle
     * @param {Function} resultHandler    handle server's response
     * @param {Function} errorHandler     handle an error response
     * @param {String}   user             user's label
     * @param {String}   key              user's application key
     * @param {Date}   startTime          only events after startTime
     * @param {Date}   endTime            only events before endTime
     */
    this.handle = function(resultHandler, errorHandler, user, key, resource) {
        var u;
        MockupLog.debug("SSLABELGET " +resource);
        for (var i = 0; i < SSMockupResources.length; i++) {
            u = SSMockupResources[i];
            if (u['entityUri'] == resource) {
                setTimeout(function(){resultHandler({'label':u['label']});}, MockupTimeout);
                return;
            }
        }
        errorHandler({'error':'Resource not found'});
    };
};

/**read 
 * Get Resource
 *
 * @class SSResourceGet
 */
function SSEntityDescGet() {

    /**
     * Return mockup data.
     *
     * @method handle
     * @param {Function} resultHandler    handle server's response
     * @param {Function} errorHandler     handle an error response
     * @param {String}   user             user's label
     * @param {String}   key              user's application key
     * @param {String}   resource         resource to get data about
     */
    this.handle = function(resultHandler, errorHandler, user, key, resource) {
        var u;
        MockupLog.debug("SSRESOURCEGET " + resource);
        for (var i = 0; i < SSMockupResources.length; i++) {
            u = SSMockupResources[i];
            if (u['entityUri'] == resource) {
                setTimeout(function(){resultHandler({'entityDesc' : u});}, MockupTimeout);
                return;
            }
        }
        errorHandler({'error':'Resource not found'});
    };
};

function SSEntityLabelGet() {
    this.handle = function(resultHandler, errorHandler, user, key, entityUri){
        var u;
        MockupLog.debug("SSLABELGET " + entityUri);
        for (var i = 0; i < SSMockupResources.length; i++) {
            u = SSMockupResources[i];
            if (u['entityUri'] == entityUri) {
                setTimeout(function(){resultHandler({'label' : u});}, MockupTimeout);
                return;
            }
        }
        errorHandler({'error':'Resource not found'});
    }
}

function SSEntityLabelSet() {
    this.handle = function(resultHandler, errorHandler, user, key, entityUri, label){
        var u;
        MockupLog.debug("SSLABELSET " + entityUri);
        for (var i = 0; i < SSMockupResources.length; i++) {
            u = SSMockupResources[i];
            if (u['entityUri'] == entityUri) {
                u['label'] = label;
                setTimeout(function(){resultHandler({'worked' : true})}, MockupTimeout);
                return;
            }
        }
        errorHandler({'error':'Resource not found'});
    }
}
