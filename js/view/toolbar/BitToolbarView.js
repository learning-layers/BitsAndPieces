define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'utils/DateHelpers',
        'text!templates/toolbar/bit.tpl', 'text!templates/toolbar/empty.tpl',
        'view/toolbar/EpisodeListGroupView', 'view/modal/BitThumbnailModalView',
        'data/EntityData', 'data/sss/CategoryData'], function(Logger, tracker, _, $, Backbone, Voc, DateHelpers, BitTemplate, EmptyTemplate, EpisodeListGroupView, BitThumbnailModalView, EntityData, CategoryData){
    return Backbone.View.extend({
        events: {
            'slidechange .slider' : 'setImportance',
            'keypress .tagSearch input' : 'updateOnEnter',
            'click .deleteTag' : 'deleteTag',
            'click .deadline .clearDatepicker' : 'clearDatepicker',
            'keypress input[name="title"]' : 'updateOnEnter',
            'keypress textarea[name="description"]' : 'updateOnEnter',
            'blur input[name="title"]' : 'changeLabel',
            'blur textarea[name="description"]' : 'changeDescription',
            'click .recommendedTags .tagcloud a' : 'clickRecommendedTag',
            'click .thumbnail > img' : 'clickThumbnail'
        },
        LOG: Logger.get('BitToolbarView'),
        initialize: function() {
            this.bitThumbnailModalView = new BitThumbnailModalView({}).render();
        },
        setEntity: function(entity) {
            var that = this;
            if( this.model === entity ) return;
            this.stopListening(this.model, 'change', this.render);
            this.model = entity;
            if( entity ) {
                // Check and load as needed

                // Load thumbnail, bulk methods do not return this
                // Review in case logic changes
                if ( !EntityData.hasLoaded(this.model, Voc.hasThumbnail) ) {
                    EntityData.addHasLoaded(this.model, Voc.hasThumbnail);
                    this.model.fetch();
                }
                if ( !EntityData.hasLoaded(this.model, Voc.hasTagRecommendation) ) {
                    EntityData.addHasLoaded(this.model, Voc.hasTagRecommendation);
                    EntityData.loadRecommTags(this.model);
                }
                /* Disabled loading view count
                if ( !EntityData.hasLoaded(this.model, Voc.hasViewCount) ) {
                    EntityData.addHasLoaded(this.model, Voc.hasViewCount);
                    EntityData.loadViewCount(this.model);
                }
                */

                this.listenTo(this.model, 'change', this.render);
            }

            this.render();
        },
        render: function() {
            this.$el.empty();
            if( !this.model ) {
                // ... empty the toolbar content
                this.$el.html(_.template(EmptyTemplate, {
                    title : 'Bit',
                    message : 'No bit selected'
                }));
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

            // Deal with episodes
            var episodes = this.getBelongsToEpisode();
            this.addOrUpdateEpisodeViews(episodes);
        },
        addOrUpdateEpisodeViews: function(episodes) {
            var that = this,
                box = this.$el.find('.belongsToEpisode');

            if (this.episodeViews && _.isArray(this.episodeViews) ) {
                _.each(this.episodeViews, function(view) {
                    view.remove();
                });
            }

            this.episodeViews = [];
            _.each(episodes, function(episode) {
                if ( !( episode && episode.isEntity ) ) {
                    return;
                }

                var view = new EpisodeListGroupView({
                    model: episode
                });
                box.append(view.render().$el);
                that.episodeViews.push(view);
            });
        },
        getImportance: function() {
            return this.model.get(Voc.importance) || 1;
        },
        setImportance: function(event, ui) {
            this.LOG.debug("setImportance", ui.value);
            this.model.set(Voc.importance, ui.value, {
                'user_initiated' : true
            });
            
            tracker.info(tracker.SETIMPORTANCE, tracker.BITTAB, this.model.getSubject(), ui.value);
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
            
            tracker.info(tracker.ADDTAG, tracker.BITTAB, this.model.getSubject(), tag);
        },
        getBitTags: function() {
            var tags = this.model.get(Voc.hasTag) || [];
            if( !_.isArray(tags)) return [tags];
            return tags;
        },
        deleteTag: function(e) {
            var tags = this.getBitTags(),
                currentTag = $(e.currentTarget).data("tag");
            this.LOG.debug('deleted tag', currentTag);
            var newTags =_.without(tags, currentTag+"");
            this.LOG.debug("array the same", tags === newTags );
            // Make sure to set user_initiated flag
            this.model.set(Voc.hasTag, newTags, {
                'user_initiated' : true
            });

            tracker.info(tracker.REMOVETAG, tracker.BITTAB, this.model.getSubject(), currentTag);
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.LOG.debug('e', e);
                var currentTarget = $(e.currentTarget);
                if ( currentTarget.attr('name') === 'title' || currentTarget.attr('name') === 'description' ) {
                    $(e.currentTarget).blur();
                } else {
                    this.addTag($(e.currentTarget).val());
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
                'description' : this.model.get(Voc.description),
                'author' : author,
                'creationTime' : DateHelpers.formatTimestampDateDMY(this.model.get(Voc.creationTime)),
                'views' : this.model.get(Voc.hasViewCount) || 0,
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
            label = currentTarget.val();

            if( this.model.get(Voc.label) == label) return;
            this.LOG.debug('changeLabel', label);
            // Make sure to set user_initiated flag
            EntityData.setLabel(this.model, label, {
                'error' : function() {
                    that.$el.find('input[name="title"]').effect("shake");
                },
                'user_initiated' : true
            });
            
            tracker.info(tracker.CHANGELABEL, tracker.BITTAB, this.model.getSubject(), label);
        },
        changeDescription: function(e) {
            var that = this,
            currentTarget = $(e.currentTarget),
            description = currentTarget.val();

            if( this.model.get(Voc.description) == description) return;
            this.LOG.debug('changeDescription', description);
            // Make sure to set user_initiated flag
            EntityData.setDescription(this.model, description, {
                'error' : function() {
                    that.$el.find('textarea[name="description"]').effect("shake");
                },
                'user_initiated' : true
            });
            
            tracker.info(tracker.CHANGEDESCRIPTION, tracker.BITTAB, this.model.getSubject(), description);
        },
        getEntityThumbnail: function() {
            var thumbnail = this.model.get(Voc.hasThumbnailCache);
            // XXX This is a quick fix for case when entity is loaded
            // without thumbnail first and then the thumbnail is loaded
            // For some reason null seems to be become the second parameter of an array.
            if ( _.isArray(thumbnail) && thumbnail.length >= 1 ) {
                thumbnail = thumbnail[0];
            }
            return thumbnail;
        },
        clickRecommendedTag: function(e) {
            e.preventDefault();
            var tag = $(e.currentTarget).data('tag');
            this.addTag(tag);
            
            tracker.info(tracker.CLICKTAGRECOMMENDATION, tracker.BITTAB, this.model.getSubject(), tag);
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
        },
        getBelongsToEpisode: function() {
            var belongsToEpisode = this.model.get(Voc.belongsToEpisode);

            if ( !_.isEmpty(belongsToEpisode) ) {
                if ( !_.isArray(belongsToEpisode) ) {
                    belongsToEpisode = [belongsToEpisode];
                }

                return _.uniq(belongsToEpisode);
            }

            return [];
        },
        clickThumbnail: function(e) {
            this.LOG.debug('Thumbnail clicked');
            this.bitThumbnailModalView.removeThumbnails();
            this.bitThumbnailModalView.addThumbnail(this.getEntityThumbnail());
            this.bitThumbnailModalView.showModal();
        }
    });
});
