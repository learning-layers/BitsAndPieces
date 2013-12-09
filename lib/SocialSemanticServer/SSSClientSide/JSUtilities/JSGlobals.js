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
var jSGlobals = new JSGlobals();

function JSGlobals(){
  
  this.dayInMilliSeconds                                      = "86400000";
  this.empty                                                  = "";
  this.undefined                                              = "undefined";
  this.blank                                                  = " ";
  this.slash                                                  = "/";
  this.comma                                                  = ",";
  this.dot                                                    = ".";
  
  this.valueUnderlineBlank                                    = "_blank";
  this.valueBackslashN                                        = '\n';
  
  this.uriStartAbout                                          = "about:";
  this.uriStartMailto                                         = "mailto:";
  this.uriStartHttp                                           = "http://";
  this.uriStartHttps                                          = "https://";
  this.uriStartSvn                                            = "svn://";
  
  this.sortDesc                                               = "desc";
  this.sortAsc                                                = "asc";
  
  this.root                                                    = "root";
	this.shareCollection                                         = "Share collection";
	this.tagBased                                                = "Tag based";
	this.contentBased                                            = "Content based";
	this.download                                                = "Download";
	this.upload                                                  = "Upload";
	this.exclamationPoint                                        = "!";
	this.right                                                   = "right";
	this.both                                                    = "both";
	this._public                                                 = "Public";
	this._private                                                = "Private";
	this.removeTag                                               = "Remove tag";
	this.currentlyNotLoggedIn                                    = "Currently not logged in";
	this.loggedInAs                                              = "Logged in as ";
	this.addNewCollection                                        = "Add new collection";
	this.subscribeOrUnsubscribePublicCollection                  = "Subscribe to a public collection";
	this.tagItem                                                 = "Tag item";
	this.rateItem                                                = "Rate item";
	this.discussItem                                             = "Discuss item";
	this.renameItem                                              = "Rename item";
	this.deleteItem                                              = "Delete item";
	this.backToCollections                                       = "Back";
	this.ex                                                      = "ex";
	this.trim                                                    = "...";
	this._3D                                                     = "3D";
	this._2D                                                     = "2D";
	this.subscribeCollection                                     = "Subscribe collection";
	this.dropCollection                                          = "Drop collection";
	
	this.select                                                  = "select";
	this.basic                                                   = "Basic";
	this.advanced                                                = "Advanced";
	
	this.exception                                               = "exception";
	this.semiColon                                               = ";";
	this.equalSign                                               = "=";
	this.atSign                                                  = "@";
	this.link                                                    = "Link";
	this.upload                                                  = "Upload";
	this.addLinkOrUpload                                         = "Add link or upload file";
	this.singleQuotationMark                                     = "'";
	this.newFile                                                 = "New file";
	this.replaceFile                                             = "Replace file";
	this.showTagCloud                                            = "Show tag cloud";
	this.showDiscussions                                         = "Show discussions";
	this.showCollections                                         = "Show / hide collections";
	this.chooseTags                                              = "Choose tags";
	this.chooseKnowledgeMaturingIndicators                       = "Choose knowledge maturing indicators";
	this.chooseKnowledgeMaturingIndicator                        = "Choose knowledge maturing indicator";
	this.addNewLink                                              = "Add new link";
	this.chooseTag                                               = "Choose tag";
	this.chooseDiscussion                                        = "Choose discussion";
	this.showAllDiscussions                                      = "Show all discussions";
	this.hideDiscussion                                          = "Hide discussion";
	this.tagDiscussion                                           = "Tag discussion";
	this.rateDiscussion                                          = "Rate discussion";
	this.renameDiscussion                                        = "Rename discussion";
	this.search                                                  = "Show / hide search";
  this.or                                                      = "OR";
  this.and                                                     = "AND";
  
  this.textualLineBreaksToBlank = function(string){
    
     if(this.isEmpty (string)){
      return string;
    }
    
    return string.replace(/(\\n)/gm, this.blank);
  };
  
  this.textualLineBreaksVisible = function(string){
    
    if(this.isEmpty (string)){
      return string;
    }
    
    return string.replace(/(\\n)/gm, this.valueBackslashN);
  };
  
  this.getTime = function(){
    return new Date().getTime();
  };
  
  this.parseJson = function(messageData){
    return jQuery.parseJSON(messageData);
  };
  
  this.checkFileSystem = function(){
		
		if(
				window.URL                  &&
				window.requestFileSystem){
			return;
		}
		
		console.log("file system not supported by browser");
	};
	
	this.checkWindowAlert = function(){
		
		if(window.webkitNotifications) {
			return;
		}
		
		console.log("browser notifications not supported by browser");
	};

	this.checkFileApi = function(){

		if(
				window.File       && 
				window.FileReader && 
				window.FileList   && 
				window.Blob) {
			return;
		}

		console.log("drag & drop upload not supported by browser");
	};
  
  this.sortObjectsByLabel = function(objs){
		
		if(this.isEmpty(objs)){
			return new Array();
		}
		
		var result       = new Array();
		var labels       = new Array();
		var counter      = -1;
    var objsCount    = this.arrayLength(objs);
		
		for(counter = 0; counter < objsCount; counter++){
			this.addArrayItem(labels, objs[counter].label);
		}
		
		labels = this.sortStringArray(labels, this.asc);
		
		for(counter = 0; counter < this.arrayLength(labels); counter++){
		
			for(var innerCounter = 0; innerCounter < objsCount; innerCounter++){
				
				if(this.equals(objs[innerCounter].label, labels[counter])){
					
					if(this.arrayLength(result) === 0){
						this.addArrayItem(result, objs[innerCounter]);
						break;
					}
					
					if(this.equalsNot(this.getLastArrayItem(result).uri, objs[innerCounter].uri)){
						this.addArrayItem (result, objs[innerCounter]);
						break;
					}
				}
			}
		}
		
		return result;
	};
  
  this.addArrayItem = function(array, value){

    if(
      this.isNotEmpty (array) &&
      this.isNotNull  (value)){
      array.push(value);
    }
	};
  
  this.getArrayItem = function(array, index){

    if(
      this.isNotEmpty (array) &&
      this.isNotNull  (index)){
      return array[index];
    }
    
    return null;
	};
  
  this.isArrayEmpty = function(array){

		if(
				this.isEmpty     (array) ||
				this.arrayLength (array) <= 0){
			return true;
		}

		return false;
	};
  
  this.sortIntArray = function(array, ascOrDesc){
		
		if(this.isArrayEmpty(array)){
			return new Array();
		}
		
		array.sort(function(a,b){return a-b});
		
		if(this.equals(ascOrDesc, this.sortDesc)){
			array.reverse();
		}
		
		return array;		
	};
  
  this.sortStringArray = function(array, ascOrDesc){

		if(this.isArrayEmpty(array)){
			return new Array();
		}

		array.sort();
		
		if(this.equals(ascOrDesc, this.sortDesc)){
			array.reverse();
		}

		return array;	
	};
  
  this.removeTrailingSlash = function(string){
    
    if(
      this.isEmpty(string)  ||
      this.lastIndexOf(string, this.slash) !== this.length(string) - 1){
      return string;
    }
    
    return this.substring(string, 0, this.length(string) - 1);
  };
  
  this.isNotEmpty = function(object){
    return !this.isEmpty(object);
  };
  
  this.length = function(string){
    
    if(this.isEmpty(string)){
      return 0;
    }
    
    return string.length;
  };
  
  this.isNotNull = function(obj){
    return !this.isNull(obj);
  };
  
  this.isNull = function(obj){
  
    if(obj == null){
      return true;
    }
    
    return false;
  };
  
  this.shortenTextAtBegin = function(text, cutIndex){

		if(
				this.isNotEmpty (text) &&
				this.length     (text) > cutIndex){

			return this.trim + this.substring(text, this.length(text) - cutIndex - 1, this.length(text));
		}else{
			return text;
		}
	};
  
  this.shortenTextAtEnd = function(text, cutIndex){

		if(
				this.isNotEmpty (text)&&
				this.length     (text) > cutIndex){

			return this.substring(text, 0, cutIndex - 1) + this.trim;
		}else{
			return text;
		}
	};
  
  this.containsNotArrayItem = function(array, value){
   return !this.containsArrayItem(array, value);
  };
  
	this.containsArrayItem = function(array, value){

    if(
      this.isArrayEmpty (array) ||
      this.isNull       (value)){
      return false;
    }

		if($.inArray(value, array) === -1){
			return false;
		}

		return true;
	};
  
  this.containsNot = function(string, val){
    return !this.contains(string, val);
  };
  
  this.contains = function(string, val){
  
    if(
      this.isEmpty(string) ||
      this.isEmpty(val)){
      return false;
    }
    
    if(this.indexOf(string, val) !== -1){
      return true;
    }
    
    return false;
  };
  
  this.isEmpty = function(obj){
    
    if(
      this.isNull(obj)  ||
      obj === this.empty){
      return true;
    }
    
    return false;
  };
  
  this.startsNotWith = function(string, begin){
    return !this.beginsWith(string, begin);
  };
  
  this.startsWith = function(string, begin){
    
    if(
      this.isEmpty(string) ||
      this.isEmpty(begin)  ||
      this.length(string) < this.length(begin)){
      return false;
    }
    
    if(this.indexOf(string, begin) === 0){
      return true;
    }else{
      return false;
    }
  };
  
  this.indexOf = function(string, val){
    
    if(
      this.isEmpty(string) ||
      this.isEmpty(val)){
      return -1;
    }
    
    return string.indexOf(val);
  };
  
  this.lastIndexOf = function(string, val){
    
    if(
      this.isEmpty(string) ||
      this.isEmpty(val)){
      return -1;
    }
    
    return string.lastIndexOf(val);    
  };
  
  this.substring = function(string, start, end){
    
    if(
      this.isEmpty(string) ||
      start === -1 ||
      end   === -1  ||
      start >= end){
      
      return string;
    }
    
    return string.substring(start, end);
  };
  
  this.removeStrFromBegin = function(string, remove){

    if(
      this.isEmpty(string) ||
      this.isEmpty(remove) ||
      this.length(string) < this.length(remove)){
      return string;
    }
    
    return this.substring(string, this.length(remove), this.length(string));
	};
  
  this.removeLastArrayItem = function(array){

		if(this.isArrayEmpty(array)){
			return new Array();
		}
		
		return array.pop();
	};	
  
  this.getLastArrayItem = function(array){
		
		if(this.isArrayEmpty(array)){
			return null;
		}
		
		return array[array.length - 1];
	};
  
  this.removeArrayItem = function(array, element){

		var result        = new Array();
		var resultCounter = 0;
		
		if(this.isArrayEmpty (array)){
      return result;
    }
    
    if(
      this.isNull (element)                 ||
			this.containsNotArrayItem(array, element)){
			return array;
		}
		
		for(var counter = 0; counter < this.arrayLength(array); counter++){
			
			if(this.equals(array[counter], element)){
				continue;
			}
			
			result[resultCounter++] = array[counter];
		}
		
		return result;
		
//		return jQuery.grep(array, function(value) {
//			return value != element;
//		});
	};
  
  this.isArray = function(element){
		
    if(this.isNull(element)){
      return false;
    }
    
		return $.isArray(element);
	};

	this.addStrAtBegin = function(string, add){
    
    if(
      this.isNull(string) ||
      this.isNull(add)){
      return string;
    }
    
    if(this.length(string) < this.length(add)){
      return add + string;
    }
    
    if(this.substring(string, 0, this.length(add)) === add){
      return string;
    }

    return add + string;
	};
  
  this.arrayLength = function(array){

		if(this.isEmpty(array)){
			return 0;
		}

		return array.length;
	};
  
  this.equalsNot = function(obj1, obj2){
    return !this.equals(obj1, obj2);
  };
  
  this.equals = function(obj1, obj2){
    
    if(
      this.isEmpty(obj1) ||
      this.isEmpty(obj2)){
      return false;
    }
    
    return obj1 === obj2;
  };
  
  this.endsWith = function(string, end){
		
		if(
				this.isEmpty (string)   ||
				this.isEmpty (end)      ||
				this.length  (string) < this.length(end)){
			return false;
		}
		
    if(this.indexOf(string, end) === this.length(string) - this.length(end)){
      return true;
    }
    
    return false;
	};
  
  this.getDistinctStringArray = function(array){

		var result = new Array();

		for(var counter = 0; counter < this.arrayLength(array); counter++){

			if(this.containsNotArrayItem(result, array[counter])){
				result.push(array[counter]);
			}
		}

		return result;
	};
  
  this.commaSeparateStringArray = function(stringArray){
    
		var result = this.empty;
    
		for(var counter = 0; counter < this.arrayLength(stringArray); counter++){
			result += stringArray[counter] + this.comma;
		}
    
		if(
      this.isNotEmpty (result) &&
      this.endsWith   (result, this.comma)){
      
			result = this.substring(result, 0, this.length(result) - 1);
		}
    
		return result;
	};
  
  this.areHtmlNotificationsEnabled = function(){
		
		if(window.webkitNotifications.checkPermission() == 0){
			return true;
		}
		
		return false;
	};
};



//window.webkitNotifications.createHTMLNotification('http://www.google.com').show();
//createNotificationInstance({ notificationType: 'html' });

//function enableListItemsDroppable(
//	list){
//	
//	$( list ).droppable({
//	    
//		drop: function(event, ui){
//          jSDom.stopEvent(event);
//			
//			alertWi.open("dropped");
//		}
//	});
//	
//	
//	var listItems = jSDom.getChildren(list);
//	
//	for(var counter = 0; counter < listItems.length; counter++){
//		
//		$( listItems[counter] ).droppable({
//		   drop: function(event, ui) { 
//			   
//				jSDomEvent.stopEvent(event);
//			   alertWi.open("dropped");
//		   }
//		});
//	}
//}


//function addAttrClass(
//	element,
//	classId){
//	
//	$(element).addClass(classId);
//}

//function getAttrText(
//	element){
//	
//	return $(element).text();
//}