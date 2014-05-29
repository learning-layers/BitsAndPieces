define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/toolbar/bit.tpl'], function(Logger, tracker, _, $, Backbone, Voc, BitTemplate){
    return Backbone.View.extend({
        events: {
            'slidechange .slider' : 'setImportance',
            'keypress .tag-search input' : 'updateOnEnter', 
            'click .deleteTag' : 'deleteTag'
        },
        LOG: Logger.get('BitToolbarView'),
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
                // ... empty the toolbar content
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

            });

            this.$el.find('.deadline input.datepicker').datepicker();
        },
        getImportance: function() {
            return this.model.get(Voc.importance) || 1;
        },
        setImportance: function(event, ui) {
            this.LOG.debug("setImportance", ui.value);
            this.model.set(Voc.importance, ui.value);
        },
        addTag: function(tag) {
            var tags = this.getBitTags();
            if (_.contains(tags, tag) ) return;
            var newTags = _.clone(tags) || [];
            newTags.push(tag);
            var that = this;
            this.model.set(Voc.hasTag, newTags, {
                'error' : function() {
                    that.$el.find(".tag-search input").effect("shake");
                }
            });
        },
        getBitTags: function() {
            var tags = this.model.get(Voc.hasTag) || [];
            if( !_.isArray(tags)) return [tags];
            return tags;
        },
        deleteTag: function(e) {
            var tags = this.getBitTags();
            this.LOG.debug('deleted tag', $(e.currentTarget).data("tag"));
            var newTags =_.without(tags, $(e.currentTarget).data("tag")+"");
            this.LOG.debug("array the same", tags === newTags );
            this.model.set(Voc.hasTag, newTags );
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.LOG.debug('e', e);
                this.addTag($(e.currentTarget).val());
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
