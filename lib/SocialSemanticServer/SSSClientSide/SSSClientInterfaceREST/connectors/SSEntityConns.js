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
function SSEntityLabelGet(){
  
	this.op = "entityLabelGet";
  
  this.handle = function(resultHandler, errorHandler, user, key, entityUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]              = this.op;
    par[sSVarU.user]            = user;
    par[sSVarU.entityUri]       = entityUri;
    par[sSVarU.key]             = key;
    
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

function SSEntityLabelSet(){
  
	this.op = "entityLabelSet";
  
  this.handle = function(resultHandler, errorHandler, user, key, entityUri, label){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]              = this.op;
    par[sSVarU.user]            = user;
    par[sSVarU.entityUri]       = entityUri;
    par[sSVarU.label]           = label;
    par[sSVarU.key]             = key;
    
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

function SSEntityTypeGet(){
  
	this.op = "entityTypeGet";
  
  this.handle = function(resultHandler, errorHandler, user, key, entityUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]         = this.op;
    par[sSVarU.user]       = this.user;
    par[sSVarU.entityUri]  = entityUri;
    par[sSVarU.key]        = this.key;
    
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

function SSEntityDescGet(){
  
	this.op = "entityDescGet";
  
  this.handle = function(resultHandler, errorHandler, user, key, entityUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]         = this.op;
    par[sSVarU.user]       = this.user;
    par[sSVarU.entityUri]  = entityUri;
    par[sSVarU.key]        = this.key;
    
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