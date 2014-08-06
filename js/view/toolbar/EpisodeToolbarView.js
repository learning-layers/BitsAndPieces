define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'text!templates/toolbar/episode.tpl',
        'data/episode/EpisodeData', 'data/episode/UserData', 'view/toolbar/EpisodeListingView'], function(Logger, tracker, _, $, Backbone, Voc, EpisodeTemplate, EpisodeData, UserData, EpisodeListingView){
    return Backbone.View.extend({
        episodeViews: [],
        events: {
            'keypress input[name="label"]' : 'updateOnEnter',
            'blur input[name="label"]' : 'changeLabel',
            'keypress textarea[name="description"]' : 'updateOnEnter',
            'blur textarea[name="description"]' : 'changeDescription',
            'change input[name="sharetype"]' : 'shareTypeChanged',
            'click button[name="share"]' : 'shareEpisode',
            'click .selectedUser > span' : 'removeSelectedUser',
            'click input[name="onlyselected"]' : 'clickOnlySelected',
            'keypress input[name="search"]' : 'updateOnEnter'
        },
        LOG: Logger.get('EpisodeToolbarView'),
        initialize: function() {
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.currentVersion), this.episodeVersionChanged, this);
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.hasEpisode), this.changeEpisodeSet, this);
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
        episodeVersionChanged: function() {
            this.render();
        },
        getCurrentVersion: function() {
            return this.model.get(Voc.currentVersion);
        },
        getCurrentEpisode: function() {
            var version = this.getCurrentVersion();
            return version.get(Voc.belongsToEpisode);
        },
        render: function() {
            var that = this,
                version = this.getCurrentVersion();
            this.$el.empty();
            if( !version || !this.getCurrentEpisode() ) {
                // ... empty the toolbar content
                this.$el.html("No episode");
                if (version) {
                    // Wait for the episode to be ready
                    version.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), this.render, this);
                }
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

            this.addOrUpdateEpisodeViews();
        },
        addOrUpdateEpisodeViews: function(episodes) {
            var that = this,
                box = this.$el.find('.toolbarSectionEpisodes .myEpisodes .episodeListing');
            if ( !_.isArray(episodes) ) {
                episodes = this.getEpisodes();
            }
            _.each(this.episodeViews, function(view) {
                view.remove();
            });
            this.episodeViews = [];
            _.each(episodes, function(episode) {
                var view = new EpisodeListingView({
                    model: episode
                });
                box.append(view.render().$el);
                that.episodeViews.push(view);
            });
        },
        updateOnEnter: function(e) {
            if (e.keyCode == 13) {
                this.LOG.debug('updateOnEnter', e);
                var currentTarget = $(e.currentTarget);
                if ( currentTarget.attr('name') === 'label' || currentTarget.attr('name') === 'description' ) {
                    currentTarget.blur();
                } else if ( currentTarget.attr('name') === 'search' ) {
                    this.addOrUpdateEpisodeViews( this.searchEpisodes(currentTarget.val()) );
                }

            }
        },
        getEpisodeViewData: function() {
            var episode = this.getCurrentEpisode();
            return {
                entity : {
                    label : episode.get(Voc.label),
                    description : episode.get(Voc.description)
                }
            };
        },
        changeLabel: function(e) {
            var that = this,
            currentTarget = $(e.currentTarget),
            label = currentTarget.val(),
            episode = this.getCurrentEpisode();

            if( episode.get(Voc.label) == label) return;
            this.LOG.debug('changeLabel', label);
            // Make sure to set user_initiated flag
            episode.set(Voc.label, label, {
                'error' : function() {
                    that.$el.find('input[name="label"]').effect("shake");
                },
                'user_initiated' : true
            });
        },
        changeDescription: function(e) {
            var that = this,
                currentTarget = $(e.currentTarget),
                description = currentTarget.val(),
                episode = this.getCurrentEpisode();

            if( episode.get(Voc.description) == description) return;
            this.LOG.debug('changeDescription', description);
            // Make sure to set user_initiated flag
            episode.set(Voc.description, description, {
                'error' : function() {
                    that.$el.find('textarea[name="description"]').effect("shake");
                },
                'user_initiated' : true
            });

        },
        shareTypeChanged: function(e) {
            if ( $(e.currentTarget).val() === 'coediting' ) {
                var onlyselected = this.$el.find('input[name="onlyselected"]');
                if ( onlyselected.is(':checked') ) {
                    onlyselected.trigger('click');
                }
                onlyselected.prop('disabled', true)
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
                excluded = [],
                episode = this.getCurrentEpisode();

            if ( _.isEmpty(notificationText.trim()) ) {
                alert('Some required fields are empty');
                return false;
            }

            if ( this.selectedUsers.length < 1 ) {
                alert('No users selected');
                return false;
            }

            if ( shareType === 'coediting' ) {
                EpisodeData.shareEpisode(episode, this.selectedUsers, notificationText);
                this._cleanUpAfterSharing();
            } else if ( shareType === 'separatecopy' ) {
                // Determine if some bits need to be excluded
                if ( onlySelected === true ) {
                    this.LOG.debug('Only selected bits');
                    _.each(this.$el.find('select[name="only"] option:not(:selected)'), function(element) {
                        excluded.push($(element).val());
                    });
                }
                EpisodeData.copyEpisode(episode, this.selectedUsers, excluded, notificationText);
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
                $(autocomplete).parent().append('<div class="badge selectedUser" data-value="' + ui.item.value+ '"><span class="glyphicon glyphicon-user userIcon"></span> ' + ui.item.label + ' <span class="glyphicon glyphicon-remove-circle deleteIcon"><span></div>');
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
            version = this.getCurrentVersion(),
            widgets = version.get(Voc.hasWidget);
            _.each(widgets, function(widget) {
                if ( widget.get('@type').isof(Voc.ORGANIZE) ) {
                    response.circles = widget.get(Voc.hasCircle) || [];
                    if( !_.isArray(response.circles)) response.circles = [response.circles];
                    response.entities = widget.get(Voc.hasEntity) || [];
                    if( !_.isArray(response.entities)) response.entities = [response.entities];
                }
            });

            return response;
        },
        clickOnlySelected: function(e) {
            var current = this.getCurrentEntitiesAndCircles();
            if ( $(e.currentTarget).is(':checked') ) {
                // Add and render
                var select = $('<select name="only" multiple="multiple" class="form-control shareBitsOnly"></select>'),
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
        },
        getEpisodes: function() {
            var episodes = this.model.get(Voc.hasEpisode) || [];
            if( !_.isArray(episodes)) episodes = [episodes];
            return episodes;
        },
        searchEpisodes: function(searchable) {
            var regexp = new RegExp(searchable, 'i'),
                episodes = this.getEpisodes(),
                returned = [];

            searchable = searchable.trim();

            if ( _.isEmpty(searchable) ) return episodes;

            _.each(episodes, function(episode) {
                var label = episode.get(Voc.label),
                    description = episode.get(Voc.description);
                if ( label.search(regexp) !== -1 || description.search(regexp) !== -1 ) {
                    returned.push(episode);
                }
            });

            return returned;
        }
    });
});
