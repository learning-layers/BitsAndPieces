define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/sidebar/bit.tpl'], function(Logger, tracker, _, $, Backbone, Voc, BitTemplate){
    return Backbone.View.extend({
        events: {
            'change .slider' : 'setImportance',
            'keypress .tag-search input' : 'updateOnEnter', 
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

            // XXX need to define meanings for values
            this.$el.find('.importance .slider').slider({
                value : this.getImportance(),
                min : 1,
                max : 4,
                step : 1,
                slide: this.setImportance,

            });

            this.$el.find('.deadline input.datepicker').datepicker();
        },
        getImportance: function() {
            this.model.get(Voc.importance) || 1;
        },
        setImportance: function(event, ui) {
            this.model.set(Voc.importance, ui.value );
        },
        addTag: function(tag) {
            var tags = this.getBitTags();
            if (_.contains(tags, tag) ) return;
            var newTags = _.clone(tags) || [];
            newTags.push(tag);
            this.model.set(Voc.hasTag, newTags);
        },
        getBitTags: function() {
            var tags = this.model.get(Voc.hasTag) || [];
            if( !_.isArray(tags)) return [tags];
            return tags;
        },
        deleteTag: function(e) {
            var tags = this.getBitTags();
            var newTags =_.without(tags, $(e.currentTarget).data("tag"));
            this.LOG.debug("array the same", tags === newTags );
            this.model.set(Voc.hasTag, newTags );
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.LOG.debug('e', e);
                this.addTag($(e.currentTarget).val()); // TODO: get value from event
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
                'tags' : this.getBitTags(),
                'predefined' : [],
                'importance' : this.model.get(Voc.importance)
            }};
        }
    });
});
