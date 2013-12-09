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

var MockupLog = MockupLog || Logger.get('Mockup');
var SSMockupCircles = {
    'http://20130930devDays.ll/circle/svgcircle01':
        {
            'uri': 'http://20130930devDays.ll/circle/svgcircle01',
            'Label': 'Circle No. 1',
            'LabelX' : 100, 
            'LabelY' : 100, 
            'cx' : 150,
            'cy' : 150,
            'rx' : 50,
            'ry' : 50,
            'type' : 'http://20130930devDays.ll/Circle'
        }
};

var SSMockupOrgaEntities = {
    'http://20130930devDays.ll/orgaentity/orgaentity01' :
        {
            'uri': 'http://20130930devDays.ll/orgaentity/orgaentity01',
            'resource': 'http://20130930devDays.ll/#ue01',
            'x' : 125,
            'y' : 125 ,
            'type' : 'http://20130930devDays.ll/OrgaEntity'

        }
};

var SSMockupUsersContext = {
    '@context': {
        
    }
};

/**read 
 * Get Circle
 *
 * @class SSCircleGet
 */
function SSCircleGet() {

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
    this.handle = function(resultHandler, errorHandler, user, key, circle) {
        var u;
            console.debug("SSCIRCLEGET " +circle);
        if( SSMockupCircles[circle]) {
            resultHandler(SSMockupCircles[circle]);
            return
        }
        errorHandler({'error':'Resource not found'});
    };
};

/**read 
 * Get Entity
 *
 * @class SSCircleGet
 */
function SSOrgaEntityGet() {

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
    this.handle = function(resultHandler, errorHandler, user, key, entity) {
        var u;
            console.debug("SSORGAENTITYGET " +entity);
        if( SSMockupOrgaEntities[entity]) {
            resultHandler(SSMockupOrgaEntities[entity]);
            return
        }
        errorHandler({'error':'Resource not found'});
    };
};

function SSCircleAdd() {
    this.handle = function(resultHandler, errorHandler, user, key, circle) {
        console.debug("SSCIRCLEADD " +circle);
        circle['uri'] = "http://20130930devDays.ll/circle/" + _.uniqueId('svgcircle');
        SSMockupCircles[circle['uri']] = circle;
        resultHandler({'uri':circle['uri']});
        return;
        errorHandler({'error':'Resource not found'});
    };
};

function SSCircleChange() {
    this.handle = function(resultHandler, errorHandler, user, key, circle) {
        var u;
        console.debug("SSCIRCLECHANGE ");
        console.debug("circle", circle);
        if( SSMockupCircles[circle['uri']]) {
            SSMockupCircles[circle['uri']] = circle;
            resultHandler(true);
            return;
        }
        errorHandler({'error':'Resource not found'});
    };
};

function SSCircleRemove() {
    this.handle = function(resultHandler, errorHandler, user, key, entity) {
        var u;
        console.debug("SSCIRCLEREMOVE " +JSON.stringify(entity));
        if( SSMockupCircles[entity['uri']]) {
            delete SSMockupCircles[entity['uri']];
            resultHandler(true);
            return;
        }
        errorHandler({'error':'Resource not found'});
    };
};

function SSOrgaEntityAdd() {
    this.handle = function(resultHandler, errorHandler, user, key, entity) {
        console.debug("SSORGAENTITYADD " +JSON.stringify(entity));
        entity['uri'] = "http://20130930devDays.ll/orgaentity/" + _.uniqueId('orgaentity');
        SSMockupOrgaEntities[entity['uri']] = entity;
        resultHandler({'uri':entity['uri']});
        return;
        errorHandler({'error':'Resource not found'});
    };
};

function SSOrgaEntityChange() {
    this.handle = function(resultHandler, errorHandler, user, key, entity) {
        var u;
        console.debug("SSORGAENTITYCHANGE " +JSON.stringify(entity));
        if( SSMockupOrgaEntities[entity['uri']]) {
            SSMockupOrgaEntities[entity['uri']] = entity;
            resultHandler(true);
            return;
        }
        errorHandler({'error':'Resource not found'});
    };
};

function SSOrgaEntityRemove() {
    this.handle = function(resultHandler, errorHandler, user, key, entity) {
        var u;
        console.debug("SSORGAENTITYREMOVE " +JSON.stringify(entity));
        if( SSMockupOrgaEntities[entity['uri']]) {
            delete SSMockupOrgaEntities[entity['uri']];
            resultHandler(true);
            return;
        }
        errorHandler({'error':'Resource not found'});
    };
};