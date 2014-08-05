define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/toolbar/bit.tpl',
        'data/EntityData',
        'data/sss/CategoryData'], function(Logger, tracker, _, $, Backbone, Voc, BitTemplate, EntityData, CategoryData){
    return Backbone.View.extend({
        events: {
            'slidechange .slider' : 'setImportance',
            'keypress .tagSearch input' : 'updateOnEnter',
            'click .deleteTag' : 'deleteTag',
            'click .deadline .clearDatepicker' : 'clearDatepicker',
            'keypress .bitTitle span' : 'updateOnEnter',
            'blur .bitTitle span' : 'changeLabel', // XXX Need to change to work with input
            'click .recommendedTags .tagcloud a' : 'clickRecommendedTag'
        },
        LOG: Logger.get('BitToolbarView'),
        initialize: function() {
        },
        setEntity: function(entity) {
            var that = this;
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

            this.$el.find('.importance .slider').slider({
                value : this.getImportance(),
                min : 1,
                max : 4,
                step : 1,

            });

            this.$el.find('.deadline input.datepicker').datepicker();

            this.LOG.debug("render", this.model.changed);

            var tags = this.model.get(Voc.hasTagRecommendation) || [];
            if (!_.isArray(tags)) tags = [tags];
            this.addOrUpdateRecommendedTags(tags);
        },
        getImportance: function() {
            return this.model.get(Voc.importance) || 1;
        },
        setImportance: function(event, ui) {
            this.LOG.debug("setImportance", ui.value);
            this.model.set(Voc.importance, ui.value, {
                'user_initiated' : true
            });
        },
        addTag: function(tag) {
            var tags = this.getBitTags();
            if (_.contains(tags, tag) ) return;
            var newTags = _.clone(tags) || [];
            newTags.push(tag);
            var that = this;
            // Make sure to set user_initiated flag
            this.model.set(Voc.hasTag, newTags, {
                'error' : function() {
                    that.$el.find(".tagSearch input").effect("shake");
                },
                'user_initiated' : true
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
            // Make sure to set user_initiated flag
            this.model.set(Voc.hasTag, newTags, {
                'user_initiated' : true
            });
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.LOG.debug('e', e);
                if ( e.currentTarget.nodeName === 'INPUT' ) {
                    this.addTag($(e.currentTarget).val());
                } else if ( e.currentTarget.nodeName === 'SPAN' ) {
                    $(e.currentTarget).blur();
                }
            }
        },
        getBitViewData: function() {
            var author = this.model.get(Voc.author);
            if( author && author.isEntity ) {
                author = author.get(Voc.label);
            }
            return {'entity' : {
                'label' : this.model.get(Voc.label),
                'author' : author,
                'creationTime' : $.datepicker.formatDate('dd.mm.yy', new Date(this.model.get(Voc.creationTime))),
                'views' : this.model.get(Voc.hasViewCount) || 0,
                'edits' : '',
                'tags' : this.getBitTags(),
                'predefined' : CategoryData.getPredefinedCategories(),
                'importance' : this.model.get(Voc.importance),
                'thumb' : this.getEntityThumbnail()
            }};
        },
        clearDatepicker: function(e) {
            e.preventDefault();
            this.$el.find('.deadline input.datepicker').val('');
        },
        changeLabel: function(e) {
            var that = this,
            currentTarget = $(e.currentTarget),
            label = currentTarget.text();

            label = label.replace(/(<([^>]+)>)/ig,"");
            currentTarget.html(label);
            if( this.model.get(Voc.label) == label) return;
            this.LOG.debug('changeLabel', label);
            // Make sure to set user_initiated flag
            this.model.set(Voc.label, label, {
                'error' : function() {
                    that.$el.find('.bitTitle > span').effect("shake");
                },
                'user_initiated' : true
            });
        },
        getEntityThumbnail: function() {
            return this.model.get(Voc.hasThumbnail);
        },
        clickRecommendedTag: function(e) {
            e.preventDefault();
            var tag = $(e.currentTarget).data('tag');
            this.addTag(tag);
        },
        addOrUpdateRecommendedTags: function(tags) {
            var tagcloud = this.$el.find('.recommendedTags .tagcloud'),
                fontMin = 10,
                fontMax = 14;
            tagcloud.empty();
            if ( !_.isEmpty(tags) ) {
                _.each(tags, function(tag) {
                    var fontSize = fontMax * tag.likelihood;
                    if ( fontSize < fontMin ) fontSize += fontMin;
                    tagcloud.append(' <span class="badge"><a href="#" data-tag="' + tag.label + '" style="font-size:' + fontSize + 'px">' + tag.label + '</a></span>');
                });
            }
        }
    });
});
