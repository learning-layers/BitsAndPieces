define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/toolbar/episode.tpl'], function(Logger, tracker, _, $, Backbone, Voc, EpisodeTemplate){
    return Backbone.View.extend({
        events: {
            'keypress input[name="label"]' : 'updateOnEnter',
            'blur input[name="label"]' : 'changeLabel',
            'change input[name="sharetype"]' : 'shareTypeChanged',
            'click input[name="share"]' : 'shareEpisode'
        },
        LOG: Logger.get('EpisodeToolbarView'),
        initialize: function() {
        },
        setEntity: function(version) {
            var episode = version.get(Voc.belongsToEpisode);
            this.LOG.debug('Provided version', version);
            this.LOG.debug('Version episode', episode);
            if( this.model === episode ) return;
            this.stopListening(this.model, 'change', this.render);
            this.model = episode;
            if( episode ) {
                this.listenTo(this.model, 'change', this.render);
            }
            this.render();
        },
        render: function() {
            this.$el.empty();
            if( !this.model ) {
                // ... empty the toolbar content
                this.$el.html("No episode");
                return;
            }
            this.$el.html(_.template(EpisodeTemplate, this.getEpisodeViewData()));
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.LOG.debug('updateOnEnter', e);
                if ( $(e.currentTarget).attr('name') === 'label' ) {
                    $(e.currentTarget).blur();
                }
            }
        },
        getEpisodeViewData: function() {
            return {
                entity : {
                    label : this.model.get(Voc.label),
                    description : ''
                }
            };
        },
        changeLabel: function(e) {
            var that = this,
            currentTarget = $(e.currentTarget),
            label = currentTarget.val();

            if( this.model.get(Voc.label) == label) return;
            this.LOG.debug('changeLabel', label);
            // Make sure to set user_initiated flag
            this.model.set(Voc.label, label, {
                'error' : function() {
                    that.$el.find('input[name="label"]').effect("shake");
                },
                'user_initiated' : true
            });
        },
        shareTypeChanged: function(e) {
            if ( $(e.currentTarget).val() === 'coediting' ) {
                this.$el.find('input[name="onlyselected"]').prop('disabled', true).prop('checked', false);
            } else if ( $(e.currentTarget).val() === 'separatecopy' ) {
                this.$el.find('input[name="onlyselected"]').prop('disabled', false);
            }
        },
        shareEpisode: function(e) {
            alert("Share episode clicked");
        }
    });
});
