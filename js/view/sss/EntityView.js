define(['vie', 'logger', 'tracker', 'underscore', 'jquery', 'backbone', 'view/detail/DetailView'], function(VIE, Logger, tracker, _, $, Backbone, DetailView){
    console.log('test2', DetailView);
    return Backbone.View.extend({
        LOG: Logger.get('EntityView'),
        icons: {
            'addPrivateCollectionItem': 'img/sss/addCollectionItem.png',
            'addSharedCollectionItem': 'img/sss/addCollectionItem.png',
            'changeCollectionByAddPrivateCollectionItem': 'img/sss/changeCollection.png', //changeCollectionAddPrivateCollectionItem
            'changeCollectionByAddSharedCollectionItem': 'img/sss/changeCollection.png', //changeCollectionAddSharedCollectionItem
            //'appearsInSearchResult': 'img/sss/.png',
            'subscribeCollection': 'img/sss/subscribeCollection.png',
            'unSubscribeCollection': 'img/sss/unSubscribeCollection.png',
            'createPrivateCollection': 'img/sss/addCollection.png',
            'createSharedCollection': 'img/sss/addCollection.png',
            'createPrivateRecord': 'img/sss/addDocument.png',
            'createSharedRecord': 'img/sss/addDocument.png',
            'rateEntity': 'img/sss/rate.png',
            'discussEntity': 'img/sss/startDiscussion.png', //startDiscussion
            'addDiscussionComment': 'img/sss/discuss.png',
            'addPrivateTag': 'img/sss/addTag.png',
            'addSharedTag': 'img/sss/addTag.png',
            'removePrivateTag': 'img/sss/deleteTag.png',
            'removeSharedTag': 'img/sss/deleteTag.png',
            'renamePrivateCollectionItem': 'img/sss/renameCollectionItem.png',
            'renameSharedCollectionItem': 'img/sss/renameCollectionItem.png',
            'removePrivateCollectionItem': 'img/sss/removeCollectionItem.png',
            'removeSharedCollectionItem': 'img/sss/removeCollectionItem.png',
            'removePrivateCollection': 'img/sss/deleteCollection.png',
            'removeSharedCollection': 'img/sss/deleteCollection.png',
            'removePrivateRecord': 'img/sss/deleteDocument.png',
            'removeSharedRecord': 'img/sss/deleteDocument.png',
            'renameDiscussion': 'img/sss/renameDiscussion.png',
            'changeCollectionByRemovePrivateCollectionItem': 'img/sss/changeCollection.png', //changeCollectionRemovePrivateCollectionItem
            'changeCollectionByRemoveSharedCollectionItem': 'img/sss/changeCollection.png', //changeCollectionRemoveSharedCollectionItem
            //'newDiscussionByDiscussEntity': 'img/sss/.png'
            'renamePrivateCollection':'img/sss/editCollection.png',
            'renameSharedCollection':'img/sss/editCollection.png',
            'renamePrivateRecord':'img/sss/editDocument.png',
            'renameSharedRecord':'img/sss/editDocument.png',
            'shareCollection':'img/sss/shareCollection.png',
            'shareDocument':'img/sss/shareDocument.png',
            'user' : 'img/sss/user1.png',
            'coll' : 'img/sss/collection.png',
            'owl:Thing' : 'img/sss/thing.png',
            'user/peter/' : 'img/sss/user2.png',
            'user/paul/' : 'img/sss/user1.png',
            'entity' : 'img/sss/thing.png',
            'disc' : 'img/sss/discuss.png',
            'discEntry' : 'img/sss/discuss.png',
            'file' : 'img/sss/document.png',
            'rating' : 'img/sss/rate.png',
            'tag' : 'img/evernote/tag.png',
            //'userEvent' : 'img/sss/userEvent.png',
            //'learnEp' : 'img/evernote/learnEp.png',
            //'learnEpTimelineState' : 'img/evernote/learnEpTimelineState.png',
            //'learnEpVersion' : 'img/evernote/learnEpVersion.png',
            //'learnEpCircle' : 'img/evernote/learnEpCircle.png',
            //'learnEpEntity' : 'img/evernote/learnEpEntity.png',

            'unknown' : 'img/sss/unknown.png',
            // EVERNOTE STUFF
            'evernoteNotebook' : 'img/sss/collection.png',
            'evernoteNote' : 'img/sss/document.png',
            'evernoteResource' : 'img/sss/thing.png',

            'evernoteNotebookCreate' : 'img/sss/addCollection.png',
            'evernoteNotebookUpdate' : 'img/sss/editCollection.png',
            'evernoteNotebookShare' : 'img/sss/shareCollection.png',
            'evernoteNotebookFollow' : 'img/sss/subscribeCollection.png',
            'evernoteNoteCreate' : 'img/sss/addDocument.png',
            'evernoteNoteUpdate' : 'img/sss/editDocument.png',
            'evernoteNoteDelete' : 'img/sss/deleteDocument.png',
            'evernoteNoteShare' : 'img/sss/shareDocument.png',
            'evernoteNoteFollow' : 'img/sss/subscribeDocument.png',
            'evernoteReminderDone' : 'img/sss/reminderDone.png',
            'evernoteReminderCreate' : 'img/sss/reminder.png',
            'evernoteResourceAdd' : 'img/sss/addCollectionItem.png',
            'evernoteResourceFollow' : 'img/sss/subscribeResource.png',
            'evernoteResourceShare' : 'img/sss/shareResource.png'

        },
        events : {
          'click' : '_click'
          //'contextmenu' : 'detailView'
        },
        initialize: function() {
            this.model.on('change', this.render,this );
        },
        click: function(e) {
            this.LOG.error('clicked', e);
            if( e.which === 1 ) {
                this.defer();
            } else if( e.which === 3) {
                this.detailView();
                return false;
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
                this.defer();
            }
            else
            {
                this.alreadyclicked=true;
                var view = this;
                view.detailView(e);
                this.alreadyclickedTimeout=setTimeout(function(){
                    view.alreadyclicked=false; // reset when it happens
                    view.LOG.debug('_click timeOut');
                },400); // <-- dblclick tolerance here
            }
            return false;
        },
        defer: function() {
            this.LOG.debug('defer');
            var resource = this.model.get('resource');
            if( !resource ) resource = this.model.getSubject();
            else resource = resource.getSubject();
            var lastChar = resource[resource.length-1];
            if( lastChar === '/') resource = resource.substring(0, resource.length-1);
            tracker.info(tracker.OPENRESOURCE, resource);
            this.LOG.log('open resource', resource);
            window.open(resource);
        },
        render: function() {
            this.$el.attr({
              'class' : 'entity',
              'resource' : this.model.getSubject()
            });
            var label = this.model.get('sss:label');
            if( label && label.isEntity ) label = label.getSubject();
            this.$el.html(//"<div class=\"entity\" resource=\""+this.model.getSubject()+"\">"+
                    "<img src=\""+this.getIcon()+"\" class=\"small-icon\"> " + 
                    label );
                

                    //"</div>");
            this.LOG.debug('rendering ', this.model);
            this.draggable();
            return this;
        },
        detailView: function(e) {
            this.LOG.debug("clicked entity");
            this.LOG.debug("e", e);
            if( !e.currentTarget ) return;
            var id = $(e.currentTarget).attr('resource');
            if( !id ) return;
            this.LOG.debug("id", id);
            if( id != this.model.getSubject() ) return;
            tracker.info(tracker.VIEWDETAILS, id);

            // --- ADD THE DETAIL VIEW --- //
            var detailViewId = "detailView" + id.replace(/[\\/:-\\.#]/g, '');
            if( !document.getElementById(detailViewId)) {
                $('body').append("<span id=\""+detailViewId+"\"></div>");
                var detailView = new DetailView({
                    model: this.model,
                    el: '#' + detailViewId
                });
            } 
            this.model.trigger('showDetails', e);
            return false;

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
            // TODO: make clear use of URIs
            if( !type ) type = this.model.get('@type');
            this.LOG.debug('type', type);
            if( !type ) return this.icons['unknown'];
            var name = this.model.vie.namespaces.curie(type.id);
            this.LOG.debug('name', name);
            if( name === 'user' ) {
                name = this.model.vie.namespaces.curie(this.model.getSubject());
                if( !this.icons[name]) name = 'user';
            }
            if( !this.icons[name]) return this.icons['unknown'];
            return this.icons[name];
        }
    });
});
