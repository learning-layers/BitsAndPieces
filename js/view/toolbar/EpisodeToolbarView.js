define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc',
        'userParams', 'utils/SystemMessages', 'utils/InputValidation',
        'text!templates/toolbar/episode.tpl', 'text!templates/toolbar/empty.tpl', 'text!templates/toolbar/components/selected_user.tpl',
        'data/episode/EpisodeData', 'view/toolbar/EpisodeListingView',
        'utils/SearchHelper', 'utils/EntityHelpers'], function(Logger, tracker, _, $, Backbone, Voc, userParams, SystemMessages, InputValidation, EpisodeTemplate, EmptyTemplate, SelectedUserTemplate, EpisodeData, EpisodeListingView, SearchHelper, EntityHelpers){
    return Backbone.View.extend({
        episodeViews: [],
        events: {
            'keypress input[name="label"]' : 'updateOnEnter',
            'blur input[name="label"]' : 'changeLabel',
            'blur textarea[name="description"]' : 'changeDescription',
            'change input[name="sharetype"]' : 'shareTypeChanged',
            'click button[name="share"]' : 'shareEpisode',
            'click .selectedUser > span' : 'removeSelectedUser',
            'click input[name="onlyselected"]' : 'clickOnlySelected',
            'keyup input[name="search"]' : 'updateOnKeyUp',
            'keyup textarea[name="notificationtext"]' : 'revalidateNotificationText',
            'change input[name="only[]"]' : 'revalidateOnlySelected',
            'click .search a' : 'clearEpisodesSearch',
            'click .shareBitsOnly label.selectable' : 'clickCheckboxLabel'
        },
        LOG: Logger.get('EpisodeToolbarView'),
        initialize: function() {
            this.model.on('change:' + this.model.vie.namespaces.uri(Voc.currentVersion), this.episodeVersionChanged, this);
            this.selectedUsers = [];
            this.shareBitsOnlySelector = '.shareBitsOnly';
            this.onlySelector = 'input[name="only[]"]';
            this.onlySelectedSelector = 'input[name="onlyselected"]';
            this.shareWithSelector = 'input[name="sharewith"]';
        },
        episodeVersionChanged: function() {
            this.render();

            // Remove chnage listeners if previous version and episode exist
            var previousVersion = this.model.previous(Voc.currentVersion);
            if ( previousVersion && previousVersion.isEntity ) {
                var previousEpisode = previousVersion.get(Voc.belongsToEpisode);
                if ( previousEpisode && previousEpisode.isEntity ) {
                    previousEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.circleTypes), this.renderVisibility, this);
                    previousEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.hasUsers), this.renderSharedWith, this);
                    previousEpisode.off('change:'+this.model.vie.namespaces.uri(Voc.label), this.updateEpisodesOnLabelChanged, this);
                }
            }

            // Add listeners if version and episode set
            var currentVersion = this.getCurrentVersion();
            if ( currentVersion && currentVersion.isEntity ) {
                var currentEpisode = this.getCurrentEpisode();
                if ( currentEpisode && currentEpisode.isEntity ) {
                    currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.circleTypes), this.renderVisibility, this);
                    currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.hasUsers), this.renderSharedWith, this);
                    currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.updateEpisodesOnLabelChanged, this);
                } else {
                    // Deal with situation when episode is not there yet
                    currentVersion.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), function(model, value, options) {
                        var currentEpisode = this.getCurrentEpisode();

                        currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.circleTypes), this.renderVisibility, this);
                        currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.hasUsers), this.renderSharedWith, this);
                        currentEpisode.on('change:'+this.model.vie.namespaces.uri(Voc.label), this.updateEpisodesOnLabelChanged, this);
                    }, this);
                }
            }
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
            this.$el.find(this.shareWithSelector).autocomplete({
                source: SearchHelper.userAutocompleteSource,
                select: function(event, ui) {
                    event.preventDefault();
                    that.addSelectedUser(event, ui, this);
                }
            });

            this.addOrUpdateEpisodeViews();
        },
        renderVisibility: function(model, value, options) {
            this.$el.find('.episodeVisibility').html(EntityHelpers.getEpisodeVisibility(model));
        },
        renderSharedWith: function(model, value, options) {
            this.$el.find('.episodeSharedWith').html(EntityHelpers.getSharedWithNames(model).join(', '));
        },
        updateEpisodesOnLabelChanged: function() {
            var episodes = null,
                searchValue = this.$el.find('input[name="search"]').val();

            if ( searchValue.trim() ) {
                episodes = this.searchEpisodes(searchValue.trim());
            }

            this.addOrUpdateEpisodeViews(episodes);
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
            var orderedEpisodes = _.sortBy(episodes, function(episode) {
                return episode.get(Voc.label).trim();
            });
            _.each(orderedEpisodes, function(episode) {
                var view = new EpisodeListingView({
                    model: episode,
                    toolContext: tracker.EPISODETAB,
                    trackerEvtContent: that.$el.find('input[name="search"]').val()
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
                    description : EntityHelpers.fixNewlinesForInput(episode.get(Voc.description)),
                    visibility : EntityHelpers.getEpisodeVisibility(episode),
                    sharedWith : EntityHelpers.getSharedWithNames(episode).join(', ')
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

            tracker.info(tracker.CHANGELABEL, tracker.EPISODETAB, episode.getSubject(), label);
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

            tracker.info(tracker.CHANGEDESCRIPTION, tracker.EPISODETAB, episode.getSubject(), description);
        },
        shareTypeChanged: function(e) {
            if ( $(e.currentTarget).val() === 'coediting' ) {
                var onlyselected = this.$el.find(this.onlySelectedSelector);
                if ( onlyselected.is(':checked') ) {
                    onlyselected.trigger('click');
                }
                onlyselected.prop('disabled', true);
                // Replace user search autocomplete with default one
                this.$el.find(this.shareWithSelector).autocomplete('option', 'source', SearchHelper.userAutocompleteSource);
                // Remove current user is selected
                this.$el.find(".selectedUser[data-value='"+userParams.user+"'] > span").trigger('click');
            } else if ( $(e.currentTarget).val() === 'separatecopy' ) {
                this.$el.find(this.onlySelectedSelector).prop('disabled', false);
                // Replace user search autocomplete with one that allows current user
                this.$el.find(this.shareWithSelector).autocomplete('option', 'source', SearchHelper.userAutocompleteSourceWithCurrent);
            }
        },
        shareEpisode: function(e) {
            var that = this,
                hasErrors = false,
                notificationTextElem = this.$el.find('textarea[name="notificationtext"]'),
                shareType = this.$el.find('input[name="sharetype"]:checked').val(),
                onlySelected = this.$el.find(this.onlySelectedSelector).is(':checked'),
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
                    // Add "group" to circle types. This will enable the overlay
                    var circleTypes = episode.get(Voc.circleTypes);

                    if ( _.isEmpty(circleTypes) ) {
                        circleTypes = ['priv'];
                    } else if ( !_.isArray(circleTypes) ) {
                        circleTypes = [circleTypes];
                    }

                    if ( _.indexOf(circleTypes, 'group') === -1 ) {
                        circleTypes.push('group');
                        episode.set(Voc.circleTypes, circleTypes);
                    }

                    EntityHelpers.addSharedWith(episode, that.selectedUsers);

                    that._cleanUpAfterSharing();
                    SystemMessages.addSuccessMessage('Your episode has been shared successfully. For co-editing with ' + sharedWithUsernames.join(', '));
                });

                promise.fail(function() {
                    SystemMessages.addDangerMessage('Episode sharing failed!');
                });

            } else if ( shareType === 'separatecopy' ) {
                var included = [];

                // Determine if some bits need to be excluded
                if ( onlySelected === true ) {
                    this.LOG.debug('Only selected bits');
                    _.each(this.$el.find(this.onlySelector + ':not(:checked)'), function(element) {
                        excluded.push($(element).val());
                    });

                    _.each(this.$el.find(this.onlySelector + ':checked'), function(element) {
                        if ( 'circle' === $(element).data('type') ) {
                            included.push($(element).val());
                        } else if ( 'entity' === $(element).data('type') ) {
                            included.push($(element).data('contained-entity'));
                        }
                    });
                } else {
                    var tmpCirclesAndEntities = this.getCurrentEntitiesAndCircles();
                    if ( !_.isEmpty(tmpCirclesAndEntities.circles) ) {
                        _.each(tmpCirclesAndEntities.circles, function(single) {
                            included.push(single.getSubject());
                        });
                    }
                    if ( !_.isEmpty(tmpCirclesAndEntities.entities) ) {
                        _.each(tmpCirclesAndEntities.entities, function(single) {
                            included.push(single.get(Voc.hasResource).getSubject());
                        });
                    }
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
            this.$el.find(this.shareWithSelector).val('');
            this.$el.find('textarea[name="notificationtext"]').val('');
            this.$el.find('.selectedUser').remove();
            this.$el.find(this.shareBitsOnlySelector).remove();
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
                var select = $('<div class="panel panel-default shareBitsOnly"><div class="panel-body"></div></div>'),
                    circles = $('<div><label>Circles</label></div>'),
                    entities = $('<div><label>Entities</label></div>');
                _.each(current.circles, function(circle) {
                    var circleSubect = circle.getSubject(),
                        circleElemId = 'only-' + circleSubect;
                    circles.append(
                        '<div><input type="checkbox" id="'
                        + circleElemId
                        + '" name="only[]" value="'
                        + circleSubect
                        + '" data-type="circle" /><label for="'
                        + circleElemId
                        + '" class="selectable">'
                        + circle.get(Voc.label)
                        + '</label></div>'
                    );
                });
                _.each(current.entities, function(orgaentity) {
                    var entity = orgaentity.get(Voc.hasResource),
                        orgaEntitySubject = orgaentity.getSubject(),
                        orgaEntityElemId = 'only-' + orgaEntitySubject;
                    entities.append(
                        '<div><input type="checkbox" id="'
                        + orgaEntityElemId
                        + '" name="only[]" value="'
                        + orgaEntitySubject + '" data-type="entity" data-contained-entity="' + entity.getSubject() + '" /><label for="'
                        + orgaEntityElemId
                        + '" class="selectable">'
                        + entity.get(Voc.label)
                        + '</label></div>'
                    );
                });
                select.find('.panel-body').append(circles);
                select.find('.panel-body').append(entities);
                $(e.currentTarget).after(select);
            } else {
                this.validateOnlySelected();
                this.$el.find(this.shareBitsOnlySelector).remove();
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
            var element = this.$el.find(this.shareWithSelector),
                alertText = 'Please select at least one user from suggested list!';

            return InputValidation.validateUserSelect(element, this.selectedUsers, alertText);
        },
        validateNotificationText: function() {
            // TEMPORARY DISABLE NOTIFICATION TEXT VALIDATION
            return true;

            var element = this.$el.find('textarea[name="notificationtext"]'),
                alertText = 'Please provide a text for notification!';

            return InputValidation.validateTextInput(element, alertText);
        },
        revalidateNotificationText: function(e) {
            this.validateNotificationText();
        },
        validateOnlySelected: function() {
            var onlySelectedElemsChecked = this.$el.find(this.onlySelector + ':checked'),
                shareBitsOnlyElem = this.$el.find(this.shareBitsOnlySelector),
                onlySelected = this.$el.find(this.onlySelectedSelector).is(':checked');

            InputValidation.removeAlertsFromParent(shareBitsOnlyElem);
            if ( !onlySelected ) {
                InputValidation.removeValidationStateFromParent(shareBitsOnlyElem);
                return true;
            } else if ( onlySelectedElemsChecked.length === 0 ) {
                InputValidation.addValidationStateToParent(shareBitsOnlyElem, 'has-error');
                InputValidation.addAlert(shareBitsOnlyElem, 'alert-danger', 'Please select at least one entity or circle!');
                return false;
            } else {
                InputValidation.removeValidationStateFromParent(shareBitsOnlyElem);
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
                var user = _.findWhere(SearchHelper.getSearchableUsers(), { value: uri });
                if ( _.isObject(user) ) {
                    return user.label;
                }
                return uri;
            });
        },
        clickCheckboxLabel: function(e) {
            $(e.currentTarget).toggleClass('selected');
        }
    });
});
