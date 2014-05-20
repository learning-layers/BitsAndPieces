define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc'], function(Logger, tracker, _, $, Backbone, Voc){
    return Backbone.View.extend({
        events: {
            'change .slider' : 'setImportance',
            'keypress .tagInput' : 'updateOnEnter', 
            'click .deleteTag' : 'deleteTag'
        },
        LOG: Logger.get('BitSidebarView'),
        initialize: function() {
        },
        setEntity: function(entity) {
            if( this.model === entity ) return;
            this.stopListening(this.model, 'change', this.render);
            this.model = entity;
            this.listenTo(this.model, 'change', this.render);
            this.render();
        },
        render: function() {
            if( !this.model ) {
                // ... empty the sidebar content
                return;
            }
            // ... rendering logic
        },
        setImportance: function(event, ui) {
            this.model.set(Voc.importance, ui.value );
        },
        addTag: function(tag) {
            if (_.contains(this.model.get(Voc.hasTag), tag) ) return;
            //... add Tag
        },
        deleteTag: function(e) {
            var tags = this.model.get(Voc.hasTag);
            this.model.set(Voc.hasTag, _.without(tags, e.value)
        },
        renderTags: function() {
            var tags = this.model.get(Voc.hasTag);
            // ... render the tags
        },
        renderTag: function() {
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.addTag(); // TODO: get value from event
            }
        },
    });
}
