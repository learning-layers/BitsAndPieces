/**
 * Copyright 2013 Graz University of Technology - KTI (Knowledge Technologies Institute)
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

/**
 * Save a user event to the SSS
 *
 * @class SSUserEventAdd
 */
function SSUserEventAdd(){
  
	this.op = "uEAdd";
  
  /**
   * Execute the SSS operation 
   *
   * @method handle
   * @param {Function} resultHandler    handle server's response
   * @param {Function} errorHandler     handle an error response
   * @param {String}   user             user's label
   * @param {String}   key              user's application key
   * @param {String}   eventType        the event's type
   * @param {String}   resource         the entity's uri
   * @param {String}   content          the possible content for the user event
   */
  this.handle = function(resultHandler, errorHandler, user, key, eventType, resource, content){
		
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
		this.eventType             = eventType;
		this.resource              = resource;
    this.content               = content;
		
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]               = this.op;
    par[sSVarU.user]             = this.user;
    par[sSVarU.resource]         = this.resource;
    par[sSVarU.eventType]        = this.eventType;
    par[sSVarU.content]          = this.content;
    par[sSVarU.key]              = this.key;
    
    var stringi = JSON.stringify(par);
    
    xhr.onload = (function(thisRef){ return function(){
        
        if(
            this.readyState    !== 4   ||
            this.status        !== 200){
          return;
        }
        
        new SSGlobals().onMessage(thisRef.resultHandler, thisRef.errorHandler, jSGlobals.parseJson(this.response), thisRef.op);
      };})(this);
    
    xhr.open (sSGlobals.httpMethPOST, sSGlobals.hostREST + this.op + jSGlobals.slash, true);
    xhr.setRequestHeader(sSGlobals.contentType, sSGlobals.mimeTypeApplicationJson);  //"application/json;charset=UTF-8"
    xhr.send (stringi);
	};
};

/**
 * Get the user events for an entity within SSS
 *
 * @class SSUserEventsGet
 */
function SSUserEventsGet(){
  
	this.op = "uEsGet";
  
  /**
   * Execute the SSS operation 
   *
   * @method handle
   * @param {Function} resultHandler    handle server's response
   * @param {Function} errorHandler     handle an error response
   * @param {String}   user             user's label
   * @param {String}   key              user's application key
   * @param {String}   forUser          user's uri to retrieve user events for
   * @param {String}   resource         entity's uri to retrieve user events for
   * @param {String}   startTime        start timestamp for retrieving user events for
   * @param {String}   endTime          end timestamp for retrieving user events for
   */
  this.handle = function(resultHandler, errorHandler, user, key, forUser, resource, startTime, endTime){
		
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
		
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]               = this.op;
    par[sSVarU.user]             = user;
    par[sSVarU.forUser]          = forUser;
    par[sSVarU.resource]         = resource;
    par[sSVarU.startTime]        = startTime;
    par[sSVarU.endTime]          = endTime;
    par[sSVarU.key]              = key;
    
    var stringi = JSON.stringify(par);
    
    xhr.onload = (function(thisRef){ return function(){
        
        if(
            this.readyState    !== 4   ||
            this.status        !== 200){
          return;
        }
        
        new SSGlobals().onMessage(thisRef.resultHandler, thisRef.errorHandler, jSGlobals.parseJson(this.response), thisRef.op);
      };})(this);
    
    xhr.open (sSGlobals.httpMethPOST, sSGlobals.hostREST + this.op + jSGlobals.slash, true);
    xhr.setRequestHeader(sSGlobals.contentType, sSGlobals.mimeTypeApplicationJson);  //"application/json;charset=UTF-8"
    xhr.send (stringi);
	};
};

function SSUserEventGet(){
  
	this.op = "uEGet";
  
  this.handle = function(resultHandler, errorHandler, user, key, ueUri){
		
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
		
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]               = this.op;
    par[sSVarU.user]             = user;
    par[sSVarU.ueUri]            = ueUri;
    par[sSVarU.key]              = key;
    
    var stringi = JSON.stringify(par);
    
    xhr.onload = (function(thisRef){ return function(){
        
        if(
            this.readyState    !== 4   ||
            this.status        !== 200){
          return;
        }
        
        new SSGlobals().onMessage(thisRef.resultHandler, thisRef.errorHandler, jSGlobals.parseJson(this.response), thisRef.op);
      };})(this);
    
    xhr.open (sSGlobals.httpMethPOST, sSGlobals.hostREST + this.op + jSGlobals.slash, true);
    xhr.setRequestHeader(sSGlobals.contentType, sSGlobals.mimeTypeApplicationJson);  //"application/json;charset=UTF-8"
    xhr.send (stringi);
	};
};