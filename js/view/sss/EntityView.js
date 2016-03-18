define(['config/config', 'vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 'userParams'], function(appConfig, VIE, Logger, tracker, _, $, Backbone, Voc, userParams){
    return Backbone.View.extend({
        LOG: Logger.get('EntityView'),
        icons: {
            'sss:addPrivateCollectionItem': 'img/sss/addCollectionItem.png',
            'sss:addSharedCollectionItem': 'img/sss/addCollectionItem.png',
            'sss:changeCollectionByAddPrivateCollectionItem': 'img/sss/changeCollection.png', //changeCollectionAddPrivateCollectionItem
            'sss:changeCollectionByAddSharedCollectionItem': 'img/sss/changeCollection.png', //changeCollectionAddSharedCollectionItem
            //'appearsInSearchResult': 'img/sss/.png',
            'sss:subscribeCollection': 'img/sss/subscribeCollection.png',
            'sss:unSubscribeCollection': 'img/sss/unSubscribeCollection.png',
            'sss:createPrivateCollection': 'img/sss/addCollection.png',
            'sss:createSharedCollection': 'img/sss/addCollection.png',
            'sss:createPrivateRecord': 'img/sss/addDocument.png',
            'sss:createSharedRecord': 'img/sss/addDocument.png',
            'sss:rateEntity': 'img/sss/rate.png',
            'sss:discussEntity': 'img/sss/startDiscussion.png', //startDiscussion
            'sss:addDiscussionComment': 'img/sss/discuss.png',
            'sss:addPrivateTag': 'img/sss/addTag.png',
            'sss:addSharedTag': 'img/sss/addTag.png',
            'sss:removePrivateTag': 'img/sss/deleteTag.png',
            'sss:removeSharedTag': 'img/sss/deleteTag.png',
            'sss:renamePrivateCollectionItem': 'img/sss/renameCollectionItem.png',
            'sss:renameSharedCollectionItem': 'img/sss/renameCollectionItem.png',
            'sss:removePrivateCollectionItem': 'img/sss/removeCollectionItem.png',
            'sss:removeSharedCollectionItem': 'img/sss/removeCollectionItem.png',
            'sss:removePrivateCollection': 'img/sss/deleteCollection.png',
            'sss:removeSharedCollection': 'img/sss/deleteCollection.png',
            'sss:removePrivateRecord': 'img/sss/deleteDocument.png',
            'sss:removeSharedRecord': 'img/sss/deleteDocument.png',
            'sss:renameDiscussion': 'img/sss/renameDiscussion.png',
            'sss:changeCollectionByRemovePrivateCollectionItem': 'img/sss/changeCollection.png', //changeCollectionRemovePrivateCollectionItem
            'sss:changeCollectionByRemoveSharedCollectionItem': 'img/sss/changeCollection.png', //changeCollectionRemoveSharedCollectionItem
            //'newDiscussionByDiscussEntity': 'img/sss/.png'
            'sss:renamePrivateCollection':'img/sss/editCollection.png',
            'sss:renameSharedCollection':'img/sss/editCollection.png',
            'sss:renamePrivateRecord':'img/sss/editDocument.png',
            'sss:renameSharedRecord':'img/sss/editDocument.png',
            'sss:shareCollection':'img/sss/shareCollection.png',
            'sss:shareDocument':'img/sss/shareDocument.png',
            'sss:user' : 'img/sss/user1.png',
            'sss:coll' : 'img/sss/collection.png',
            'owl:Thing' : 'img/sss/thing.png',
            'sss:user/peter/' : 'img/sss/user2.png',
            'sss:user/paul/' : 'img/sss/user1.png',
            'sss:entity' : 'img/sss/entityLink.png',
            'sss:disc' : 'img/sss/discuss.png',
            'sss:discEntry' : 'img/sss/discuss.png',
            'sss:file' : 'img/sss/document.png',
            'sss:filePdf' : 'img/sss/entityFilePdf.png',
            'sss:fileImage' : 'img/sss/entityImage.png',
            'sss:fileDoc' : 'img/sss/entityFileDoc.png',
            'sss:fileSpreadsheet' : 'img/sss/entitySpreadsheet.png',
            'sss:filePresentation' : 'img/sss/entityPresentation.png',
            'sss:fileText' : 'img/sss/entityText.png',
            'sss:fileAudio' : 'img/sss/entityAudio.png',
            'sss:rating' : 'img/sss/rate.png',
            'sss:tag' : 'img/evernote/tag.png',
            'sss:placeholder' : 'img/sss/entityPlaceholder.png',
            'sss:link' : 'img/sss/entityLink.png',
            //'sss:userEvent' : 'img/sss/userEvent.png',
            //'sss:learnEp' : 'img/evernote/learnEp.png',
            //'sss:learnEpTimelineState' : 'img/evernote/learnEpTimelineState.png',
            //'sss:learnEpVersion' : 'img/evernote/learnEpVersion.png',
            //'sss:learnEpCircle' : 'img/evernote/learnEpCircle.png',
            //'sss:learnEpEntity' : 'img/evernote/learnEpEntity.png',

            'unknown' : 'img/sss/unknown.png',
            'sss:bnpPlaceholderAdd' : 'img/sss/entityPlaceholder.png',
            // EVERNOTE STUFF
            'sss:evernoteNotebook' : 'img/sss/collection.png',
            'sss:evernoteNote' : 'img/sss/evernoteNote.png',
            'sss:evernoteResource' : 'img/sss/evernoteResource.png',

            'sss:evernoteNotebookCreate' : 'img/sss/addCollection.png',
            'sss:evernoteNotebookUpdate' : 'img/sss/editCollection.png',
            'sss:evernoteNotebookShare' : 'img/sss/shareCollection.png',
            'sss:evernoteNotebookFollow' : 'img/sss/subscribeCollection.png',
            'sss:evernoteNoteCreate' : 'img/sss/addDocument.png',
            'sss:evernoteNoteUpdate' : 'img/sss/editDocument.png',
            'sss:evernoteNoteDelete' : 'img/sss/deleteDocument.png',
            'sss:evernoteNoteShare' : 'img/sss/shareDocument.png',
            'sss:evernoteNoteFollow' : 'img/sss/subscribeDocument.png',
            'sss:evernoteReminderDone' : 'img/sss/reminderDone.png',
            'sss:evernoteReminderCreate' : 'img/sss/reminder.png',
            'sss:evernoteResourceAdd' : 'img/sss/addCollectionItem.png',
            'sss:evernoteResourceFollow' : 'img/sss/subscribeResource.png',
            'sss:evernoteResourceShare' : 'img/sss/shareResource.png'

        },
        events : {
          'click' : '_click'
        },
        initialize: function() {
            this.model.on('change', this.render,this );
        },
        click: function(e) {
            this.LOG.error('clicked', e);
            if( e.which === 1 ) {
                this.defer();
            }
        },
        // click function to manage click/dblclick
        _click: function(e) {
            var el=$(this);
            this.LOG.debug('_click');
            if (this.alreadyclicked)
            {
                this.alreadyclicked=false; // reset
                clearTimeout(this.alreadyclickedTimeout); // prevent this from happening
                this.handleDblClick();
                var ev = $.Event("bnp:dblclickEntity", {
                    originalEvent : e,
                    entity : this.model
                });
                this.$el.trigger(ev);
            }
            else
            {
                this.alreadyclicked=true;
                var view = this;
                this.alreadyclickedTimeout=setTimeout(function(){
                    view.alreadyclicked=false; // reset when it happens
                    view.LOG.debug('_click timeOut');
                    var ev = $.Event("bnp:clickEntity", {
                        originalEvent : e,
                        entity : view.model
                    });
                    view.$el.trigger(ev);

                    // Only trigger event if toolContext has been set
                    if ( view.toolContext ) {
                        var evtContent = null,
                            evtEntities = [];
                        
                        if ( view.trackerEvtContent ) {
                            evtContent = view.trackerEvtContent;
                        }

                        if ( view.trackerEvtEntities ) {
                            evtEntities = view.trackerEvtEntities;
                        }

                        tracker.info(tracker.CLICKBIT, view.toolContext, view.model.getSubject(), evtContent, evtEntities);
                    }
                },400); // <-- dblclick tolerance here
            }
            return false;
        },
        handleDblClick : function() {
            this.defer();
        },
        constructFileDownloadUri: function(fileUri) {
            return appConfig.sssHostRESTFileDownload
                + '?file=' + encodeURIComponent(fileUri)
                + '&key=' + encodeURIComponent(userParams.userKey);
        },
        defer: function() {
            this.LOG.debug('defer');
            var resource = this.model.get(Voc.hasResource);
            if( !resource ) {
                resource = this.model;
            }
            var resourceUri = resource.getSubject();
            var lastChar = resourceUri[resourceUri.length-1];
            if( lastChar === '/') resourceUri = resourceUri.substring(0, resourceUri.length-1);
            this.LOG.log('open resourceUri', resourceUri);

            // Handle special cases with file download
            if ( resource.isof(Voc.EVERNOTE_NOTE) || resource.isof(Voc.EVERNOTE_RESOURCE) ) {
                var file = resource.get(Voc.file);
                if ( file && file.isEntity ) {
                    file = file.getSubject();
                }
                if ( file ) {
                    window.open(this.constructFileDownloadUri(file));
                    return true;
                } else {
                    return false;
                }
            } else if ( resource.isof(Voc.FILE) ) {
                window.open(this.constructFileDownloadUri(resourceUri));
                return true;
            } else if ( resource.isof(Voc.PLACEHOLDER) ) {
                return false;
            }

            window.open(resourceUri);
        },
        render: function() {
            var label,
                view_class;

            this.$el.attr({
              'class' : 'entity',
              'about' : this.model.getSubject()
            });
            label = this.model.get(Voc.label) || "";
            view_class = 'labelable';

            if( true === this.model.get(Voc.isUsed) ) {
                view_class += ' used';
            }

            if( label && label.isEntity ) label = label.getSubject();
            this.$el.html(//"<div class=\"entity\" about=\""+this.model.getSubject()+"\">"+
                    "<div class=\"" + view_class + "\">"+
                    "<img class=\"icon\" src=\""+this.getIcon()+"\"/>"+ 
                        "<label class=\"withlabel\">" +
                        "<strong>"+label+"</strong>"+
                        "</label>"+
                    "</div>");
            this.LOG.debug('rendering ', this.model);
            this.draggable();
            return this;
        },
        draggable: function() {
            var VIEW = this;
            this.$el.draggable({
                zIndex: 10000,
                helper: "clone",
                appendTo: "body",
                drag: function(event, ui) {
                    VIEW.LOG.debug('dragging');
                    var ev = event;
                    while (ev != null) {
                        if (ev.type == "mousemove")
                            ev.stopImmediatePropagation();
                        ev = ev.originalEvent;
                    }
                }
            });

        },
        getIcon: function(type) {
            var name,
                mimeType,
                file;
            // TODO: make clear use of URIs
            if( !type ) type = this.model.get('@type');
            if( !type ) return this.icons['unknown'];
            if( _.isArray(type)) {
                // decide which type to use
                var i, j, push;
                for( i = 0; i < type.length; i++ ){
                    push = true;
                    for( j = 0; j < type.length; j++ ){
                        if( i != j && type[i].subsumes(type[j])) {
                            push = false;
                            break;
                        }
                    }
                    if( push ) {
                        type = type[i];
                        break;
                    }
                }
            }
            if( _.isArray(type)) { type = type[0]; }
            name = this.model.vie.namespaces.curie(type.id);
            if( name === 'user' ) {
                name = this.model.vie.namespaces.curie(this.model.getSubject());
                if( !this.icons[name]) name = 'user';
            }

            if ( this.model.isof(Voc.FILE) || this.model.isof(Voc.EVERNOTE_RESOURCE) ) {
                mimeType  = this.model.get(Voc.hasMimeType);
                if ( mimeType ) {
                    switch( mimeType ) {
                        case 'application/pdf':
                            name = 'sss:filePdf';
                            break;
                        case 'image/png':
                        case 'image/jpeg':
                        case 'image/x-icon':
                        case 'image/gif':
                        case 'image/svg+xml':
                        case 'image/bmp':
                        case 'image/tiff':
                            name = 'sss:fileImage';
                            break;
                        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                        case 'application/msword':
                            name = 'sss:fileDoc';
                            break;
                        case 'application/vnd.ms-excel':
                        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                            name = 'sss:fileSpreadsheet';
                            break;
                        case 'application/vnd.ms-powerpoint':
                        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                            name = 'sss:filePresentation';
                            break;
                        case 'text/plain':
                        case 'text/html':
                        case 'text/css':
                        case 'text/x-vcard':
                            name = 'sss:fileText';
                            break;
                        case 'application/ogg':
                        case 'audio/mp3':
                        case 'audio/midi':
                        case 'audio/x-m4a':
                        case 'audio/amr':
                        case 'audio/mpeg':
                        case 'audio/wav':
                            name = 'sss:fileAudio';
                            break;
                    }
                } else {
                    file = this.model.get(Voc.file);
                    if( file && file.isEntity ) file = file.getSubject();
                    if( file ) {
                        switch(file.substring(file.length-4).toLowerCase() ) {
                            case '.pdf':
                                name = 'sss:filePdf';
                                break;
                            case '.png':
                            case '.jpg':
                            case 'jpeg':
                            case '.ico':
                            case '.gif':
                            case '.svg':
                            case '.bmp':
                            case '.tif':
                            case 'tiff':
                                name = 'sss:fileImage';
                                break;
                            case 'docx':
                            case '.doc':
                                name = 'sss:fileDoc';
                                break;
                            case '.xls':
                            case 'xlsx':
                                name = 'sss:fileSpreadsheet';
                                break;
                            case '.ppt':
                            case 'pptx':
                                name = 'sss:filePresentation';
                                break;
                            case '.txt':
                            case 'html':
                            case '.xml':
                            case '.css':
                            case '.vcf':
                                name = 'sss:fileText';
                                break;
                            case '.mp3':
                            case '.ogg':
                            case '.wav':
                            case 'midi':
                            case '.wma':
                            case '.m4a':
                            case '.amr':
                                name = 'sss:fileAudio';
                                break;
                        }
                    }
                }
            }

            if( !this.icons[name]) return this.icons['unknown'];
            return this.icons[name];
        },
        /**
         * Returns the average width of an entity.
         * TODO fix hard-coded width
         */
        getWidth: function() {
            return 40;
        }
    });
});
