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
function SSLearnEpVersionCurrentSet(){
  
	this.op = "learnEpVersionCurrentSet";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]                = this.op;
    par[sSVarU.user]              = this.user;
    par[sSVarU.learnEpVersionUri] = learnEpVersionUri;
    par[sSVarU.key]               = this.key;
    
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

function SSLearnEpVersionCurrentGet(){
  
	this.op = "learnEpVersionCurrentGet";
  
  this.handle = function(resultHandler, errorHandler, user, key){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]                = this.op;
    par[sSVarU.user]              = this.user;
    par[sSVarU.key]               = this.key;
    
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

function SSLearnEpVersionSetTimelineState(){
  
	this.op = "learnEpVersionSetTimelineState";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri, startTime, endTime){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]                = this.op;
    par[sSVarU.user]              = this.user;
    par[sSVarU.learnEpVersionUri] = learnEpVersionUri;
    par[sSVarU.startTime]         = startTime;
    par[sSVarU.endTime]           = endTime;
    par[sSVarU.key]               = this.key;
    
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

function SSLearnEpVersionGetTimelineState(){
  
	this.op = "learnEpVersionGetTimelineState";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]                = this.op;
    par[sSVarU.user]              = this.user;
    par[sSVarU.learnEpVersionUri] = learnEpVersionUri;
    par[sSVarU.key]               = this.key;
    
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

function SSLearnEpVersionRemoveCircle(){
  
	this.op = "learnEpVersionRemoveCircle";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpCircleUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]               = this.op;
    par[sSVarU.user]             = this.user;
    par[sSVarU.learnEpCircleUri] = learnEpCircleUri;
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

function SSLearnEpVersionRemoveEntity(){
  
	this.op = "learnEpVersionRemoveEntity";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpEntityUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]               = this.op;
    par[sSVarU.user]             = this.user;
    par[sSVarU.learnEpEntityUri] = learnEpEntityUri;
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

function SSLearnEpVersionUpdateCircle(){
  
	this.op = "learnEpVersionUpdateCircle";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpCircleUri, label, xLabel, yLabel, xR, yR, xC, yC){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]               = this.op;
    par[sSVarU.user]             = this.user;
    par[sSVarU.learnEpCircleUri] = learnEpCircleUri;
    par[sSVarU.label]            = label;
    par[sSVarU.xLabel]           = xLabel;
    par[sSVarU.yLabel]           = yLabel;
    par[sSVarU.xR]               = xR;
    par[sSVarU.yR]               = yR;
    par[sSVarU.xC]               = xC;
    par[sSVarU.yC]               = yC;
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

function SSLearnEpVersionUpdateEntity(){
  
	this.op = "learnEpVersionUpdateEntity";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpEntityUri, entityUri, x, y){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]               = this.op;
    par[sSVarU.user]             = this.user;
    par[sSVarU.learnEpEntityUri] = learnEpEntityUri;
    par[sSVarU.entityUri]        = entityUri;
    par[sSVarU.x]                = x;
    par[sSVarU.y]                = y;
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

function SSLearnEpCreate(){
  
	this.op = "learnEpCreate";
  
  this.handle = function(resultHandler, errorHandler, user, key, label, space){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]               = this.op;
    par[sSVarU.user]             = this.user;
    par[sSVarU.label]            = label;
    par[sSVarU.space]            = space;
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

function SSLearnEpVersionCreate(){
  
	this.op = "learnEpVersionCreate";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]               = this.op;
    par[sSVarU.user]             = this.user;
    par[sSVarU.learnEpUri]       = learnEpUri;
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

function SSLearnEpVersionAddCircle(){
  
	this.op = "learnEpVersionAddCircle";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri, label, xLabel, yLabel, xR, yR, xC, yC){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]                = this.op;
    par[sSVarU.user]              = this.user;
    par[sSVarU.learnEpVersionUri] = learnEpVersionUri;
    par[sSVarU.label]             = label;
    par[sSVarU.xLabel]            = xLabel;
    par[sSVarU.yLabel]            = yLabel;
    par[sSVarU.xR]                = xR;
    par[sSVarU.yR]                = yR;
    par[sSVarU.xC]                = xC;
    par[sSVarU.yC]                = yC;
    par[sSVarU.key]               = this.key;
    
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

function SSLearnEpVersionAddEntity(){
  
	this.op = "learnEpVersionAddEntity";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri, entityUri, x, y){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]                = this.op;
    par[sSVarU.user]              = this.user;
    par[sSVarU.learnEpVersionUri] = learnEpVersionUri;
    par[sSVarU.entityUri]         = entityUri;
    par[sSVarU.x]                 = x;
    par[sSVarU.y]                 = y;
    par[sSVarU.key]               = this.key;
    
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

function SSLearnEpVersionGet(){
  
	this.op = "learnEpVersionGet";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpVersionUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]                = this.op;
    par[sSVarU.user]              = this.user;
    par[sSVarU.learnEpVersionUri] = learnEpVersionUri;
    par[sSVarU.key]               = this.key;
    
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

function SSLearnEpVersionsGet(){
  
	this.op = "learnEpVersionsGet";
  
  this.handle = function(resultHandler, errorHandler, user, key, learnEpUri){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]                = this.op;
    par[sSVarU.user]              = this.user;
    par[sSVarU.learnEpUri] = learnEpUri;
    par[sSVarU.key]               = this.key;
    
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

function SSLearnEpsGet(){
  
	this.op = "learnEpsGet";
  
  this.handle = function(resultHandler, errorHandler, user, key){
    
    this.resultHandler         = resultHandler;
    this.errorHandler          = errorHandler;
    this.user                  = user; 
    this.key                   = key;
    
    var par         = {};
    var xhr         = new SSXmlHttpRequest();
    
    
    par[sSVarU.op]                = this.op;
    par[sSVarU.user]              = this.user;
    par[sSVarU.key]               = this.key;
    
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