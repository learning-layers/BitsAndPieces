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
var MockupTimeout = MockupTimeout || 300;

var SSMockupUserEvents = [
    {
        'uri': 'sss:#ue01',
        'type': 'createPrivateCollection',
        'resource': MockupNS + 'coll/resource01',
        'user': MockupNS + 'user/christoph/',
        'content': 'Create Private Collection',
        'timestamp': '2013-11-15T15:30:20+02:00'
    },
    {
        'uri': 'sss:#ue02',
        'type': 'renamePrivateCollection',
        'resource': MockupNS + 'coll/resource01',
        'user': MockupNS + 'user/christoph/',
        'content': 'Rename Private Collection',
        'timestamp': '2013-11-15T16:50:20+02:00'
    },
    {
        'uri': 'sss:#ue07',
        'type': 'renamePrivateCollection',
        'resource': MockupNS + 'coll/resource03',
        'user': MockupNS + 'user/christoph/',
        'content': 'Rename Private Collection',
        'timestamp': '2013-11-15T17:00:20+02:00'
    },
    {
        'uri': 'sss:#ue03',
        'type': 'removePrivateCollection',
        'resource': MockupNS + 'coll/resource01',
        'user': MockupNS + 'user/christoph/',
        'content': 'Remove Private Collection',
        'timestamp': '2013-11-15T17:30:20+02:00'
    },
    {
        'uri': 'sss:#ue04',
        'type': 'createSharedCollection',
        'resource': MockupNS + 'coll/resource02',
        'user': MockupNS + 'user/maria/',
        'content': 'Create Shared Collection',
        'timestamp': '2013-11-15T15:40:20+02:00'
    },
    {
        'uri': 'sss:#ue05',
        'type': 'renameSharedCollection',
        'resource': MockupNS + 'coll/resource02',
        'user': MockupNS + 'user/maria/',
        'content': 'Rename Shared Collection',
        'timestamp': '2013-11-15T16:20:20+02:00'
    },
    {
        'uri': 'sss:#ue06',
        'type': 'removeSharedCollection',
        'resource': MockupNS + 'coll/resource02',
        'user': MockupNS + 'user/maria/',
        'content': 'Remove Shared Collection',
        'timestamp': '2013-11-15T17:40:20+02:00'
    },
    {
        'uri': 'sss:#useraction21',
        'type': 'createPrivateRecord',
        'resource': MockupNS + 'doc/document01',
        'user': MockupNS + 'user/peter/',
        'content': 'Create Private Record',
        'timestamp': '2014-01-22T15:30:20+02:00'
    },
    {
        'uri': 'sss:#useraction22',
        'type': 'renamePrivateRecord',
        'resource': MockupNS + 'doc/document01',
        'user': MockupNS + 'user/peter/',
        'content': 'Rename Private Record',
        'timestamp': '2013-11-15T16:50:20+02:00'
    },
    {
        'uri': 'sss:#useraction27',
        'type': 'renamePrivateRecord',
        'resource': MockupNS + 'doc/document03',
        'user': MockupNS + 'user/peter/',
        'content': 'Rename Private Record',
        'timestamp': '2013-11-15T17:00:20+02:00'
    },
    {
        'uri': 'sss:#useraction23',
        'type': 'removePrivateRecord',
        'resource': MockupNS + 'doc/document01',
        'user': MockupNS + 'user/peter/',
        'content': 'Remove Private Record',
        'timestamp': '2013-11-15T17:30:20+02:00'
    },
    {
        'uri': 'sss:#useraction24',
        'type': 'createSharedRecord',
        'resource': MockupNS + 'doc/document02',
        'user': MockupNS + 'user/peter/',
        'content': 'Create Shared Record',
        'timestamp': '2013-11-15T15:40:20+02:00'
    },
    {
        'uri': 'sss:#useraction25',
        'type': 'renameSharedRecord',
        'resource': MockupNS + 'doc/document02',
        'user': MockupNS + 'user/peter/',
        'content': 'Rename Shared Record',
        'timestamp': '2013-11-15T16:20:20+02:00'
    },
    {
        'uri': 'sss:#useraction26',
        'type': 'removeSharedRecord',
        'resource': MockupNS + 'doc/document02',
        'user': MockupNS + 'user/peter/',
        'content': 'Remove Shared Record',
        'timestamp': '2013-11-15T17:40:20+02:00'
    }
];

/**write 
 * Get user events
 *
 */
function SSUserEventsGet() {

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
    this.handle = function(resultHandler, errorHandler, user, key, forUser, resource, startTime, endTime) {
        var userEvents = [];
        var startTime = new Date(startTime);
        var endTime = new Date(endTime);
        MockupLog.debug("SSUSEREVENTSGET for " + forUser + " from " + startTime + " till " + endTime);
        for (var i = 0; i < SSMockupUserEvents.length; i++) {
            var event = SSMockupUserEvents[i];
            if (event['user'] != forUser)
                continue;
            if (startTime && new Date(event['timestamp']) < startTime)
                continue;
            if (endTime && new Date(event['timestamp']) > endTime)
                continue;
            userEvents.push(event);
        }
        setTimeout(function(){resultHandler({'uEs':userEvents});}, MockupTimeout);
    };
}
;

/**write 
 * Get user events
 *
 */
function SSUserEventAdd() {

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
    this.handle = function(resultHandler, errorHandler, user, key, eventType, resource, content) {
        var userEvents = [];
        MockupLog.debug("SSUSEREVENTADD eventType ",  eventType, ", resource ", resource, ", content" , content);
        SSMockupUserEvents.push({
            'uri': v.namespaces.uri('sss:#' ) + _.uniqueId('ue'),
            'type': eventType,
            'resource': resource,
            'user': user,
            'content': content,
            'timestamp': new Date().getTime()

        });
        setTimeout(function(){resultHandler({'worked':true});}, MockupTimeout);
    };
}
;
