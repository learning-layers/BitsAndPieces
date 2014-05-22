define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/sidebar/bit.tpl'], function(Logger, tracker, _, $, Backbone, Voc, BitTemplate){
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
            if( entity ) {
                this.listenTo(this.model, 'change', this.render);
            }
            this.render();
        },
        render: function() {
            this.$el.empty();
            if( !this.model ) {
                // ... empty the sidebar content
                this.$el.html("No bit selected")
                return;
            }
            this.$el.html(_.template(BitTemplate, this.getBitViewData()));
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
            this.model.set(Voc.hasTag, _.without(tags, e.value));
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
        getBitViewData: function() {
            var author = this.model.get(Voc.author);
            if( author.isEntity ) {
                author = author.get(Voc.label);
            }
            return {'entity' : {
                'label' : this.model.get(Voc.label),
                'author' : author,
                'creationTime' : this.model.get(Voc.creationTime),
                'views' : '',
                'edits' : '',
                'tags' : this.model.get(Voc.tags),
                'predefined' : this.model.get(Voc.tags),
                'importance' : this.model.get(Voc.importance)
            }};
        }
    });
});
