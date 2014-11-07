define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'userParams', 'utils/SystemMessages', 'utils/InputValidation',
        'text!templates/toolbar/episode.tpl', 'text!templates/toolbar/empty.tpl', 'text!templates/toolbar/components/selected_user.tpl',
        'data/episode/EpisodeData', 'data/episode/UserData', 'view/toolbar/EpisodeListingView'], function(Logger, tracker, _, $, Backbone, Voc, userParams, SystemMessages, InputValidation, EpisodeTemplate, EmptyTemplate, SelectedUserTemplate, EpisodeData, UserData, EpisodeListingView){
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
            'keyup input[name="search"]' : 'updateOnKeyUp',
            'keyup textarea[name="notificationtext"]' : 'revalidateNotificationText',
            'change select[name="only"]' : 'revalidateOnlySelected',
            'click .search a' : 'clearEpisodesSearch'
        },
        LOG: Logger.get('EpisodeToolbarView'),
        initialize: function() {
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.currentVersion), this.episodeVersionChanged, this);
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.hasEpisode), this.changeEpisodeSet, this);
            this.selectedUsers = [];
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
                this.$el.html(_.template(EmptyTemplate, {
                    title : 'Episode',
                    message : 'No episode'
                }));
                if (version) {
                    // Wait for the episode to be ready
                    version.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), this.render, this);
                }
                return;
            }

            this.$el.html(_.template(EpisodeTemplate, this.getEpisodeViewData()));

            // Initialize user select autocomplete
            this.$el.find('input[name="sharewith"]').autocomplete({
                source: UserData.getSearchableUsers(),// XXX If user loading finishes after rendering, the source will be empty. Get the value and saves that as available
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
        updateOnKeyUp: function(e) {
            this.LOG.debug('updateOnKeyUp', e);
            var currentTarget = $(e.currentTarget);
            if ( currentTarget.attr('name') === 'search' ) {
                this.addOrUpdateEpisodeViews( this.searchEpisodes(currentTarget.val()) );
            }
        },
        clearEpisodesSearch: function(e) {
            e.preventDefault();
            var currentTarget = $(e.currentTarget);

            this.LOG.debug('clearEpisodesSearch', e);
            currentTarget.parent().parent().find('input[name="search"]').val('');
            this.addOrUpdateEpisodeViews( this.searchEpisodes('') );
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
            episode.save(Voc.label, label, {
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
            episode.save(Voc.description, description, {
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
                hasErrors = false,
                notificationTextElem = this.$el.find('textarea[name="notificationtext"]'),
                shareType = this.$el.find('input[name="sharetype"]:checked').val(),
                onlySelected = this.$el.find('input[name="onlyselected"]').is(':checked'),
                notificationText = notificationTextElem.val(),
                users = [],
                excluded = [],
                episode = this.getCurrentEpisode();

            // Validation
            if ( !this.validateNotificationText() ) {
                hasErrors = true;
            }
            if ( !this.validateSharedWith() ) {
                hasErrors = true;
            }
            if ( !this.validateOnlySelected() ) {
                hasErrors = true;
            }
            if ( hasErrors ) {
                return false;
            }

            var sharedWithUsernames = this.getUserNamesFromUris(this.selectedUsers);
            if ( shareType === 'coediting' ) {
                var promise = EpisodeData.shareEpisode(episode, this.selectedUsers, notificationText);

                promise.done(function() {
                    that._cleanUpAfterSharing();
                    SystemMessages.addSuccessMessage('Your episode has been shared successfully. For co-editing with ' + sharedWithUsernames.join(', '));
                });

                promise.fail(function() {
                    SystemMessages.addDangerMessage('Episode sharing failed!');
                });

            } else if ( shareType === 'separatecopy' ) {
                // Determine if some bits need to be excluded
                if ( onlySelected === true ) {
                    this.LOG.debug('Only selected bits');
                    _.each(this.$el.find('select[name="only"] option:not(:selected)'), function(element) {
                        excluded.push($(element).val());
                    });
                }
                var promise = EpisodeData.copyEpisode(episode, this.selectedUsers, excluded, notificationText);

                promise.done(function() {
                    if ( onlySelected === true && excluded.length > 0 ) {
                        SystemMessages.addInfoMessage('You have chosen to only share the selected bits.');
                    }
                    that._cleanUpAfterSharing();
                    SystemMessages.addSuccessMessage('Your episode has been shared successfully. As a copy, with ' + sharedWithUsernames.join(', '));
                });

                promise.fail(function() {
                    SystemMessages.addDangerMessage('Episode sharing failed!');
                });

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
                var shareWithElem = $(autocomplete);
                this.selectedUsers.push(ui.item.value);
                shareWithElem.val('');
                shareWithElem.parent().append(_.template(SelectedUserTemplate, {
                    value : ui.item.value,
                    label : ui.item.label
                }));
                this.validateSharedWith();
            }
        },
        removeSelectedUser: function(e) {
            var removable = $(e.currentTarget).parent();
            this.selectedUsers = _.without(this.selectedUsers, removable.data('value'));

            removable.remove();
            this.validateSharedWith();
        },
        getCurrentEntitiesAndCircles: function() {
            var response = {
                circles: [],
                entities: []
            },
            version = this.getCurrentVersion();

            response.circles = version.get(Voc.hasCircle) || [];
            if( !_.isArray(response.circles)) response.circles = [response.circles];
            response.entities = version.get(Voc.hasEntity) || [];
            if( !_.isArray(response.entities)) response.entities = [response.entities];

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
                    circles.append('<option value="' + circle.getSubject() + '">' + circle.get(Voc.label) + '</option>');
                });
                _.each(current.entities, function(orgaentity) {
                    var entity = orgaentity.get(Voc.hasResource);
                    entities.append('<option value="' + orgaentity.getSubject() + '">' + entity.get(Voc.label) + '</option>');
                });
                select.append(circles);
                select.append(entities);
                $(e.currentTarget).after(select);
            } else {
                this.validateOnlySelected();
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
        },
        validateSharedWith: function() {
            var element = this.$el.find('input[name="sharewith"]'),
                alertText = 'Please select at least one user from suggested list!';

            return InputValidation.validateUserSelect(element, this.selectedUsers, alertText);
        },
        validateNotificationText: function() {
            var element = this.$el.find('textarea[name="notificationtext"]'),
                alertText = 'Please provide a text for notification!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidateNotificationText: function(e) {
            this.validateNotificationText();
        },
        validateOnlySelected: function() {
            var onlySelectedElem = this.$el.find('select[name="only"]'),
                onlySelected = this.$el.find('input[name="onlyselected"]').is(':checked');

            InputValidation.removeAlertsFromParent(onlySelectedElem);
            if ( !onlySelected ) {
                InputValidation.removeValidationStateFromParent(onlySelectedElem);
                return true;
            } else if ( onlySelectedElem.find('option:selected').length === 0 ) {
                InputValidation.addValidationStateToParent(onlySelectedElem, 'has-error');
                InputValidation.addAlert(onlySelectedElem, 'alert-danger', 'Please select at least one entity or circle!');
                return false;
            } else {
                InputValidation.removeValidationStateFromParent(onlySelectedElem);
                return true;
            }

        },
        revalidateOnlySelected: function() {
            this.validateOnlySelected();
        },
        getUserNamesFromUris: function(uris) {
            var that = this;
            return _.map(uris, function(uri) {
                // TODO This might become a problem in case of very large number of users
                // Might be better to create a lookup construct
                var user = _.findWhere(UserData.getSearchableUsers(), { value: uri });
                if ( _.isObject(user) ) {
                    return user.label;
                }
                return uri;
            });
        }
    });
});
