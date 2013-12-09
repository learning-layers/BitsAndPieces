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
var sSGlobals = new SSGlobals();

function SSGlobals(){
  
  this.hostREST                                      = "http://kedemo.know-center.tugraz.at:8080/ss-adapter-rest/rest/SSAdapterRest/";
  this.host                                          = "ws://"  + "localhost:8084/ss-adapter-websocket/ss-adapter-websocket"; 
  this.hostSsl                                       = "wss://" + "localhost:8443/ss-adapter-websocket/ss-adapter-websocket";
  
  this.timeOutGetWritingMinutesLeft                  = 30000;
  this.fileUploadChunkSize                           = 50000;
  this.timeOutShowGetWritingMinutesLeftNotification  = 1;
  this.errorClientParameter                          = "sSClientParameterError";
  this.errorRequestFileSystem                        = "sSRequestFileSystemError";
  this.errorCreateFile                               = "sSCreateFileError";
  this.errorWriteFile                                = "ssWriteFileError";
  this.valueSSError                                  = "SSError";
  this.valueWebSocket                                = "WebSocket";
	this.valueMozWebSocket                             = "MozWebSocket";
  this.valueException                                = "exception";
  this.valueFinished                                 = "finished";
  this.messageSeparator                              = ",x,";
  
  this.httpMethGET                                   = "GET";
  this.httpMethPOST                                  = "POST";
  
  this.mimeTypeApplicationJson                       = "application/json";
  this.mimeTypeApplicationOctetStream                = "application/octet-stream";
  this.mimeTypeBlob                                  = "blob";
  
  this.spacePrivate                                  = "private";
  this.spaceShared                                   = "shared";
  this.spaceFollow                                   = "follow";
  
  this.mimeTypeApplicationJson                       = "application/json";
  this.contentType                                   = "Content-Type";
  
  this.isNotSpaceShared         = function(space){ return !this.isSpaceShared         (space);        };
  this.isNotSpacePrivate        = function(space){ return !this.isSpacePrivate        (space);        };
  this.isNotSpaceFollow         = function(space){ return !this.isSpaceFollow         (space);        };
  this.isNotSpaceSharedOrFollow = function(space){ return !this.isSpaceSharedOrFollow (space);        };
  
  this.isSpaceShared            = function(space){ return jSGlobals.equals(space, this.spaceShared);  };
  this.isSpaceFollow            = function(space){ return jSGlobals.equals(space, this.spaceFollow);  };
  this.isSpacePrivate           = function(space){ return jSGlobals.equals(space, this.spacePrivate); };
  
  this.isSpaceSharedOrFollow    = function(space){

    if(jSGlobals.equals(space, this.spaceShared)) { return true; }
    if(jSGlobals.equals(space, this.spaceFollow)) { return true; }
    
    return false;
  };
  
  this.areNotSSParsCorrect = function(resultHandler, errorHandler, user, userKey){
    return !this.areSSParsCorrect(resultHandler, errorHandler, user, userKey);
  };
  
  this.areSSParsCorrect = function(resultHandler, errorHandler, user, userKey){
    
    if(
      jSGlobals.isEmpty             (resultHandler)  ||
      jSGlobals.isEmpty             (user)           ||
      jSGlobals.isEmpty             (userKey)){
      
      this.showParameterError();
      return false;
    }
    
    return true;
  };
  
  this.areNotSSParsCorrect = function(resultHandler, errorHandler, user){
    return !this.areSSParsCorrect(resultHandler, errorHandler, user);
  };
  
  this.areSSParsCorrect = function(resultHandler, errorHandler, user){
    
    if(
      jSGlobals.isEmpty             (resultHandler)  ||
      jSGlobals.isEmpty             (user)){
      
      this.showParameterError();
      return false;
    }
    
    return true;
  };
  
	this.createConn = function(openHandler, closeHandler, messageHandler, resultHandler, errorHandler, user, userKey){
    
    if(this.areNotSSParsCorrect(resultHandler, errorHandler, user, userKey)){
      
      if(jSGlobals.isNotEmpty(errorHandler)){
        
        errorHandler(this.errorClientParameter);
        return null;
      }else{
        return null;
      }
    }
    
		var webSocket = null;
    
		if(this.valueWebSocket in window){
			webSocket = new WebSocket(this.host);
		}else if (this.valueMozWebSocket in window){
			webSocket = new MozWebSocket(this.host);
		}else{
			this.showSocketNotSupportedError();
		}
    
		if(jSGlobals.isNotEmpty(webSocket)){
			webSocket.onopen    = openHandler;
			webSocket.onclose   = closeHandler;
			webSocket.onmessage = messageHandler;
		}
    
		return webSocket;
	};
	
	this.createSecureConnection = function(openHandler, closeHandler, messageHandler){
    
		var webSocket = null;
    
		if(this.valueWebSocket in window){
			webSocket = new WebSocket(this.hostSsl);
		}else if (this.valueMozWebSocket in window){
			webSocket = new MozWebSocket(this.hostSsl);
		}else{
			this.showSocketNotSupportedError();
		}
    
		if(jSGlobals.isNotEmpty(webSocket)){
			webSocket.onopen    = openHandler;
			webSocket.onclose   = closeHandler;
			webSocket.onmessage = messageHandler;
		}
    
		return webSocket;
	};	
  
  this.send = function(webSocket, obj){
    webSocket.send(JSON.stringify(obj));
  };
  
  this.sendWithoutKey = function(){
    
    var parString = jSGlobals.empty;
    
    for(var counter = 1; counter < arguments.length; counter++) {
      parString += arguments[counter] + this.messageSeparator;
    }
    
    arguments[0].send(parString);
  };
  
  this.onMessage = function(resultHandler, errorHandler, result, op){
    
    if(this.isException(result)){
      
      if(jSGlobals.isNotEmpty(errorHandler)){
        errorHandler(result[op]); 
      }
      return;
    }
      
    resultHandler(result[op]);
  };
  
	this.isException = function(result){
    
		if(result.error){
      console.log(this.valueSSError + " error messages: " + jSGlobals.blank + result.errorMsg);
      console.log(this.valueSSError + " error classes : " + jSGlobals.blank + result[result.op]);
			return true;
		}
    
		return false;
	};
  
	/* message printing **********************************************************************/
	/* ***************************************************************************************/
	this.showParameterError = function(op){
		console.log(this.valueSSError + " parameters for call " + op + " are not ok");
	};
  
	this.showSocketClosedMessage = function(op){
		console.log(this.valueSSError + " WebSocket for " + op + " got closed");
	};
  
	this.showSocketNotSupportedError = function(){
    console.log(this.valueSSError + " WebSocket is not supported by this browser");
	};

};

var SSXmlHttpRequest = function(){};
SSXmlHttpRequest.prototype = {
    open : function(method, url, async) {
        this.method = method;
        this.url = url;
        this.async = async;
    },
    send : function(jsonString) {
        var thisRef = this;
        console.log('method', this.method);
        jQuery.ajax({
            'url' : this.url,
            'data' : jsonString,
            'contentType' : this.contentType,
            'type' : this.method,
            'async' : this.async,
            'complete' : function(jqXHR, textStatus) {
                thisRef.response = jqXHR.responseText;
                thisRef.status = jqXHR.status;
                thisRef.readyState = jqXHR.readyState;
                thisRef.onload();
            }
        });
    },
    setRequestHeader : function(key, value) {
        if( key == sSGlobals.contentType) 
            this.contentType = value;
    }
};




//function getSSResultFromMessage(message){

//if(
//jSGlobals.isEmpty(message)      == true ||
//jSGlobals.isEmpty(message.data) == true){

//return null;
//}

//return message.data.split(this.messageSeparator);
//}

//function isSSResultError(resultArray){

//if(
//jSGlobals.isArrayEmpty(resultArray)       == true ||
//resultArray[0]                  == false){

//alertWi.open(messageSSError);
//return true;
//}

//return false;
//}