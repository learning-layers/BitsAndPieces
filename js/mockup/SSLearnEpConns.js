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
var SSMockupCircles = {
    'http://20130930devDays.ll/circle/svgcircle01':
        {
            'learnEpCircleUri': 'http://20130930devDays.ll/circle/svgcircle01',
            'label': 'Circle No. 1',
            'xLabel' : 100, 
            'yLabel' : 100, 
            'xC' : 150,
            'yC' : 150,
            'xR' : 50,
            'yR' : 50,
            'learnEpVersionUri' : MockupNS + 'version/versionX'
        },
    'http://20130930devDays.ll/circle/svgcircle02':
        {
            'learnEpCircleUri': 'http://20130930devDays.ll/circle/svgcircle02',
            'label': 'Circle No. 2',
            'xLabel' : 200, 
            'yLabel' : 200, 
            'xC' : 250,
            'yC' : 250,
            'xR' : 70,
            'yR' : 70,
            'learnEpVersionUri' : MockupNS + 'version/versionX'
        }
};

var SSMockupOrgaEntities = {/*
    'http://20130930devDays.ll/orgaentity/orgaentity01' :
        {
            'uri': 'http://20130930devDays.ll/orgaentity/orgaentity01',
            'resource': 'http://20130930devDays.ll/#ue01',
            'x' : 125,
            'y' : 125 ,
            'type' : 'http://20130930devDays.ll/OrgaEntity'

        }
*/};

var SSMockupVersions = {};
SSMockupVersions[MockupNS + 'version/versionX'] = {
    'learnEpVersionUri' : MockupNS + 'version/versionX',
    'timestamp' : '2013-11-07T17:40:20+02:00',
    'learnEpUri' : MockupNS + 'episode/episodeX',
    'type' : 'Version'
};
SSMockupVersions[MockupNS + 'version/versionY'] = {
    'learnEpVersionUri' : MockupNS + 'version/versionY',
    'timestamp' : '2013-11-08T17:40:20+02:00',
    'learnEpUri' : MockupNS + 'episode/episodeX',
    'type' : 'Version'
};
var SSMockupEpisodes = {};
SSMockupEpisodes[MockupNS + 'episode/episodeX'] = {
    'learnEpUri' : MockupNS + 'episode/episodeX',
    'label' : 'An existing episode',
    'user' : MockupNS + 'user/peter',
    'type' : 'Episode'
};
var SSMockupTimelineStates = {};
SSMockupTimelineStates[MockupNS + 'version/versionX'] = {
    'learnEpTimelineStateUri' : MockupNS + 'timelinestate/versionX',
    'startTime' : '2013-11-04T17:40:20+02:00',
    'endTime' : '2013-11-05T17:40:20+02:00'
};
SSMockupTimelineStates[MockupNS + 'version/versionY'] = {
    'learnEpTimelineStateUri' : MockupNS + 'timelinestate/versionY',
    'startTime' : '2013-11-06T17:40:20+02:00',
    'endTime' : '2013-11-07T17:40:20+02:00'
};

function SSLearnEpVersionRemoveCircle(){
  
	this.op = "learnEpVersionRemoveCircle";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpCircleUri){
    
        MockupLog.debug("SSCIRCLEREMOVE " +learnEpCircleUri);
        if( SSMockupCircles[learnEpCircleUri]) {
            delete SSMockupCircles[learnEpCircleUri];
            setTimeout(function(){resultHandler(true);}, MockupTimeout);
            return;
        }
        errorHandler({'error':'Resource not found'});
	};
};

function SSLearnEpVersionRemoveEntity(){
  
	this.op = "learnEpVersionRemoveEntity";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpEntityUri){
    
        MockupLog.debug("SSORGAENTITYREMOVE " +learnEpEntityUri);
        if( SSMockupOrgaEntities[learnEpEntityUri]) {
            delete SSMockupOrgaEntities[learnEpEntityUri];
            setTimeout(function(){resultHandler(true);}, MockupTimeout);
            return;
        }
        errorHandler({'error':'Resource not found'});
	};
};

function SSLearnEpVersionUpdateCircle(){
  
	this.op = "learnEpVersionUpdateCircle";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpCircleUri, label, xLabel, yLabel, xR, yR, xC, yC){
        MockupLog.debug("SSCIRCLEUPDATE " + learnEpCircleUri);
        if( !SSMockupCircles[learnEpCircleUri]) {
            errorHandler({'error':'Resource not found'});
            return;
        }
        SSMockupCircles[learnEpCircleUri] = _.extend(
            SSMockupCircles[learnEpCircleUri], {
            'label' : label,
            'xLabel' : xLabel,
            'yLabel' : yLabel,
            'xR' : xR,
            'yR' : yR,
            'xC' : xC,
            'yC' : yC
        });
        setTimeout(function(){resultHandler(true);}, MockupTimeout);
        return;
	};
};

function SSLearnEpVersionUpdateEntity(){
  
	this.op = "learnEpVersionUpdateEntity";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpEntityUri, entityUri, x, y){
    
        MockupLog.debug("SSORGAENTITYUPDATE" + learnEpEntityUri)
        if( !SSMockupOrgaEntities[learnEpEntityUri]) {
            errorHandler({'error':'Resource not found'});
            return;
        }
        SSMockupOrgaEntities[learnEpEntityUri] = _.extend(
            SSMockupOrgaEntities[learnEpEntityUri], {
            'entityUri' : entityUri,
            'x' : x,
            'y' : y
        });
        setTimeout(function(){resultHandler(true);}, MockupTimeout);
	};
};

function SSLearnEpCreate(){
  
	this.op = "learnEpCreate";
  
  this.handle = function(resultHandler, errorHandler, user, key, label, space){
    MockupLog.debug("SSEPISODECREATE");
    var uri = MockupNS + "episode/" + _.uniqueId('episode');
    SSMockupEpisodes[uri] = {
        'learnEpUri' : uri,
        'user' : user,
        'space' : 'private',
        'label' : label
    };
    setTimeout(function(){resultHandler({'learnEpUri': uri});}, MockupTimeout);
    
	};
};

function SSLearnEpUpdate() {
	this.op = "learnEpUpdate";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpUri, label, space){
    MockupLog.debug("SSEPISODEUPDATE");
    if(!SSMockupEpisodes[learnEpUri]) {
        errorHandler({'error': "Episode " + learnEpUri + " not found"});
        return;
    }
    SSMockupEpisodes[learnEpUri] = _.extend(
        SSMockupEpisodes[learnEpUri], {
        'space' : 'private',
        'label' : label
    });
    setTimeout(function(){resultHandler(true);}, MockupTimeout);
    
	};

};

function SSLearnEpVersionCreate(){
  
	this.op = "learnEpVersionCreate";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpUri){
    MockupLog.debug("SSVERSIONCREATE");
    var uri = MockupNS + "version/" + _.uniqueId('version');
    SSMockupVersions[uri] = {
        'learnEpVersionUri' : uri,
        'learnEpUri' : learnEpUri
    };
    setTimeout(function(){resultHandler({'learnEpVersionUri': uri});}, MockupTimeout);

	};
};

function SSLearnEpVersionAddCircle(){
  
	this.op = "learnEpVersionAddCircle";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri, label, xLabel, yLabel, xR, yR, xC, yC){
        MockupLog.debug("SSCIRCLEADD " + label);
        var uri = MockupNS + "circle/" + _.uniqueId('svgcircle');
        SSMockupCircles[uri] = {
            'uri' : uri,
            'learnEpVersionUri' : learnEpVersionUri,
            'label' : label,
            'xLabel' : xLabel,
            'yLabel' : yLabel,
            'xR' : xR,
            'yR' : yR,
            'xC' : xC,
            'yC' : yC
        }
        setTimeout(function(){resultHandler({'learnEpCircleUri':uri});}, MockupTimeout);
        return;
        errorHandler({'error':'Resource not found'});
  }
};

function SSLearnEpVersionAddEntity(){
  
	this.op = "learnEpVersionAddEntity";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri, entityUri, x, y){
    
        MockupLog.debug("SSENTITYADD " +entityUri);
        var uri = MockupNS + "orgaentity/" + _.uniqueId('orgaentity');
        SSMockupOrgaEntities[uri] = {
            'uri': uri,
            'learnEpVersionUri' : learnEpVersionUri,
            'x' : x,
            'y' : y,
            'entityUri' : entityUri
        }
        setTimeout(function(){resultHandler({'learnEpEntityUri':uri});}, MockupTimeout);
        return;
        errorHandler({'error':'Resource not found'});
	};
};

function SSLearnEpTimelineStateCreate() {

    this.handle = function(resultHandler, errorHandler, user, key, start, end, timeAttr){
        MockupLog.debug("SSTIMELINESTATECREATE " +start + ", " + end + ", " + timeAttr);
        var uri = MockupNS + "timelinestate/" + _.uniqueId('timelinestate');
        SSMockupTimelineStates[uri] = {
            'uri' : uri,
            'start' : start,
            'end' : end,
            'timeAttr' :timeAttr
        }
        setTimeout(function(){resultHandler({'uri':uri});}, MockupTimeout);
        return;
        errorHandler({'error':'Resource not found'});

    }
}

function SSLearnEpVersionGetTimelineState(){
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri){
    MockupLog.debug("SSTIMELINESTATEGET")
    if( !SSMockupTimelineStates[learnEpVersionUri]) {
        errorHandler({'error':"Timelinestate not found"});
        return;
    }
    setTimeout(function(){resultHandler({'learnEpTimelineState': SSMockupTimelineStates[learnEpVersionUri]});}, MockupTimeout);

	};
};

function SSLearnEpTimelineStateUpdate(){
  
  this.handle = function(resultHandler, errorHandler, user, key, timelineStateUri, start, end, timeAttr){
    MockupLog.debug("SSTIMELINESTATEUPDATE")
    if( !SSMockupTimelineStates[timelineStateUri]) {
        errorHandler({'error':"Timelinestate not found"});
        return;
    }
    SSMockupTimelineStates[timelineStateUri] = _.extend(
        SSMockupTimelineStates[timelineStateUri], {
        'start' : start,
        'end' : end,
        'timeAttr' :timeAttr
    });
    setTimeout(function(){resultHandler(true);}, MockupTimeout);
    return;

	};
};


function SSLearnEpVersionSetTimelineState(){
    this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri, start, end){
        MockupLog.debug("SSVERSIONSETTIMELINESTATE " + learnEpVersionUri );
        if( !SSMockupVersions[learnEpVersionUri] ) {
            errorHandler({'error' : "Version not found"});
            return;
        }
        SSMockupTimelineStates[learnEpVersionUri] = {
            start: start,
            end: end
        };
        setTimeout(function(){resultHandler(true);}, MockupTimeout);
            
    }
    
};

function SSLearnEpVersionGet(){
  
	this.op = "learnEpVersionGet";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri){
    
        MockupLog.debug("SSVERSIONGET " +learnEpVersionUri);
        if( !SSMockupVersions[learnEpVersionUri]) {
            errorHandler({'error':'Resource not found'});
            return;
        }
        var result = {'learnEpVersion' : {'circles' : [], 'entities' : [] } };
        for( var uri in SSMockupCircles) {
            if( SSMockupCircles[uri]['learnEpVersionUri'] == learnEpVersionUri)
                result.learnEpVersion.circles.push(SSMockupCircles[uri]);
        }
        for( var uri in SSMockupOrgaEntities) {
            if( SSMockupOrgaEntities[uri]['learnEpVersionUri'] == learnEpVersionUri)
                result.learnEpVersion.entities.push(SSMockupOrgaEntities[uri]);
        }
        if(result.length == 0 ) {
            errorHandler(result);
            return;
        }
        setTimeout(function(){resultHandler(result);}, MockupTimeout);
	};
};

function SSLearnEpVersionsGet(){
  
	this.op = "learnEpVersionsGet";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpUri){
    MockupLog.debug("SSEPISODE-VERSIONSGET")
    var result = [];
    for( var uri in SSMockupVersions) {
        if(SSMockupVersions[uri]['learnEpUri'] == learnEpUri)
            result.push(SSMockupVersions[uri]);
    }
    setTimeout(function(){resultHandler({'learnEpVersions':result});}, MockupTimeout);

    }
};

function SSLearnEpsGet(){
  
	this.op = "learnEpsGet";
  
  this.handle = function(resultHandler, errorHandler, user, key){
    MockupLog.debug("SSEPISODESGET", user)
    var result = [];
    for( var uri in SSMockupEpisodes) {
        if(SSMockupEpisodes[uri]['user'] == user)
            result.push(SSMockupEpisodes[uri]);
    }
    setTimeout(function(){resultHandler({'learnEps' : result});}, MockupTimeout);

	};
};

function SSEntityLabelSet() {
    this.handle = function(resultHandler, errorHandler, user, key, entityUri, label){
        MockupLog.debug("SSLABELSET " + entityUri);
        for (var uri in SSMockupEpisodes) {
            if (SSMockupEpisodes[uri]['learnEpUri'] == entityUri) {
                SSMockupEpisodes[uri]['learnEpUri']['label'] = label;
                setTimeout(function(){resultHandler({'worked' : true})}, MockupTimeout);
                return;
            }
        }
        errorHandler({'error':'Resource not found'});
    }
}
