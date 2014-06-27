define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/toolbar/episode.tpl',
        'data/episode/EpisodeData', 'data/episode/UserData'], function(Logger, tracker, _, $, Backbone, Voc, EpisodeTemplate, EpisodeData, UserData){
    return Backbone.View.extend({
        events: {
            'keypress input[name="label"]' : 'updateOnEnter',
            'blur input[name="label"]' : 'changeLabel',
            'change input[name="sharetype"]' : 'shareTypeChanged',
            'click input[name="share"]' : 'shareEpisode',
            'click .selectedUser > span' : 'removeSelectedUser',
            'click input[name="onlyselected"]' : 'clickOnlySelected'
        },
        LOG: Logger.get('EpisodeToolbarView'),
        initialize: function() {
            this.searchableUsers = [];
            this.selectedUsers = [];
            var that = this;
            UserData.fetchAllUsers().then(function(users) {
                _.each(users, function(user) {
                    that.searchableUsers.push({
                        label: user.label,
                        value: user.id
                    });
                });
            });
        },
        setEntity: function(version) {
            var episode = version.get(Voc.belongsToEpisode);
            // XXX
            // If version has not episode, then it is not set
            // need to either add some listener or do something else
            // so that episode is set when version is fully loaded
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
            var that = this;
            this.$el.empty();
            if( !this.model ) {
                // ... empty the toolbar content
                this.$el.html("No episode");
                return;
            }
            this.$el.html(_.template(EpisodeTemplate, this.getEpisodeViewData()));

            // Initialize user select autocomplete
            this.$el.find('input[name="sharewith"]').autocomplete({
                source: this.searchableUsers,
                select: function(event, ui) {
                    event.preventDefault();
                    that.addSelectedUser(event, ui, this);
                }
            });
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
            var that = this,
                shareType = this.$el.find('input[name="sharetype"]:checked').val(),
                onlySelected = this.$el.find('input[name="onlyselected"]').is(':checked'),
                notificationText = this.$el.find('textarea[name="notificationtext"]').val(),
                users = [],
                excluded = [];

            if ( _.isEmpty(notificationText.trim()) ) {
                alert('Some required fields are empty');
                return false;
            }

            if ( this.selectedUsers.length < 1 ) {
                alert('No users selected');
                return false;
            }

            if ( shareType === 'coediting' ) {
                EpisodeData.shareEpisode(that.model, this.selectedUsers, notificationText);
                this._cleanUpAfterSharing();
            } else if ( shareType === 'separatecopy' ) {
                // Determine if some bits need to be excluded
                if ( onlySelected === true ) {
                    this.LOG.debug('Only selected bits');
                    if ( !_.isEmpty(this.$el.find('select[name="only"]').val()) ) {
                        _.each(this.$el.find('select[name="only"] option:not(:selected)'), function(element) {
                            excluded.push($(element).val());
                        });
                    }
                }
                EpisodeData.copyEpisode(that.model, this.selectedUsers, excluded, notificationText);
                this._cleanUpAfterSharing();
            } else {
                this.LOG.debug('Invalid share type');
            }
        },
        _cleanUpAfterSharing: function() {
            this.$el.find('#coediting').trigger('click');
            this.$el.find('input[name="sharewith"]').val('');
            this.$el.find('textarea[name="notificationtext"]').val('');
            this.$el.find('.selectedUser').remove();
            this.$el.find('select[name="only"]').remove();
            this.selectedUsers = [];
        },
        addSelectedUser: function(event, ui, autocomplete) {
            if ( _.indexOf(this.selectedUsers, ui.item.value) === -1 ) {
                this.selectedUsers.push(ui.item.value);
                $(autocomplete).val(ui.item.label);
                $(autocomplete).parent().append('<div class="selectedUser" data-value="' + ui.item.value+ '">' + ui.item.label + ' <span>x<span></div>');
            }
        },
        removeSelectedUser: function(e) {
            var removable = $(e.currentTarget).parent();
            delete this.selectedUsers[_.indexOf(this.selectedUsers, removable.data('value'))];
            removable.remove();
        },
        getCurrentEntitiesAndCircles: function() {
            var response = {
                circles: [],
                entities: []
            },
            version = this.model.get(Voc.hasVersion),
                widgets = version.get(Voc.hasWidget);
            _.each(widgets, function(widget) {
                if ( widget.get('@type').isof(Voc.ORGANIZE) ) {
                    response.circles = widget.get(Voc.hasCircle),
                    response.entities = widget.get(Voc.hasEntity);
                }
            });

            return response;
        },
        clickOnlySelected: function(e) {
            var current = this.getCurrentEntitiesAndCircles();
            if ( $(e.currentTarget).is(':checked') ) {
                // Add and render
                var select = $('<select name="only" multiple="multiple" class="shareBitsOnly"></select>'),
                    circles = $('<optgroup label="Circles"></optgroup>'),
                    entities = $('<optgroup label="Entities"></optgrpup>');
                _.each(current.circles, function(circle) {
                    circles.append('<option value="' + circle.attributes['@subject'] + '">' + circle.get(Voc.Label) + '</option>');
                });
                _.each(current.entities, function(orgaentity) {
                    var entity = orgaentity.get(Voc.hasResource);
                    entities.append('<option value="' + orgaentity.attributes['@subject']+ '">' + entity.get(Voc.label) + '</option>');
                });
                select.append(circles);
                select.append(entities);
                $(e.currentTarget).after(select);
            } else {
                this.$el.find('select[name="only"]').remove();
            }
        }
    });
});
