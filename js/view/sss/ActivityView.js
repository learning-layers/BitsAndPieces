define(['underscore', 'backbone', 'logger', 'jquery', 'voc',
        'userParams', 'utils/DateHelpers',
        'text!templates/sss/activity.tpl',
        'view/sss/EntityView'], function(_, Backbone, Logger, $, Voc, userParams, DateHelpers, ActivityTemplate, EntityView) {
    return Backbone.View.extend({
        LOG: Logger.get('ActivityView'),
        events: {
        },
        labelNotFoundText: 'NOT FOUND',
        initialize: function(options) {
            this.listenTo(this.model, 'change', this.render);
            this.owner = this.model.get(Voc.author);
            this.listenTo(this.owner, 'change:'+this.model.vie.namespaces.uri(Voc.label), this.render);
        },
        render: function() {
            this.$el.attr({
              'class' : 'activity singleEntry singleActivity',
              'about' : this.model.getSubject()
            });

            var activityType = this.model.get(Voc.hasActivityType),
                isLoggedInActor = (this.getOwnerUri() === userParams.user),
                templateSettings = {
                    'iconClass' : [],
                    'date' : DateHelpers.formatTimestampDateDMYHM(this.model.get(Voc.creationTime)),
                    'author' : '',
                    'content' : ''
                };

            switch (activityType) {
                case 'shareLearnEpWithUser':
                    var episodeLabel = this.getContainedEntityLabel(),
                        userLabels = this.getUsersLabels();

                    templateSettings.iconClass.push('glyphicon-bell');
                    if ( isLoggedInActor ) {
                        // XXX NEED TO REMOVE AUTHOR
                        templateSettings.content = ' shared episode <strong>' + episodeLabel + '</strong> with <strong>' + userLabels.join(', ') + '</strong>';
                    } else {
                        templateSettings.content = ' shared with me ' + episodeLabel;
                    }
                    break;
                /* dtheiler
                 case 'createLearnEp':
                    var episodeLabel = this.getEpisodeLabel();

                    templateSettings.iconClass.push('glyphicon-briefcase');
                    templateSettings.content = ' created an episode ' + episodeLabel;
                    break;
                    
                */
                case 'addEntityToLearnEpVersion':
                    // XXX Labels not set
                    var bitLabel = '',
                        episodeLabel = this.getEpisodeLabel();

                    templateSettings.iconClass.push('glyphicon-plus-sign');
                    templateSettings.content = ' added bit ' + bitLabel + ' to episode ' + episodeLabel;
                    break;
                case 'updateLearnEpVersionEntity':
                    // XXX Labels not set
                    var bitLabel = '',
                        episodeLabel = this.getEpisodeLabel();

                    templateSettings.iconClass.push('glyphicon-info-sign');
                    templateSettings.content = ' updated bit ' + bitLabel + ' of episode' + episodeLabel;
                    break;
                case 'removeLearnEpVersionEntity':
                    // XXX Labels not set
                    var bitLabel = '',
                        episodeLabel = this.getEpisodeLabel();

                    templateSettings.iconClass.push('glyphicon-minus-sign');
                    templateSettings.content = ' removed bit ' + bitLabel + ' from episode' + episodeLabel;
                    break;
                case 'addCircleToLearnEpVersion':
                    // XXX Labels not set
                    var circleLabel = this.labelNotFoundText,
                        episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-plus-sign');
                    templateSettings.content = ' added circle <strong>' + circleLabel + '</strong> to episode <strong>' + episodeLabel + '</strong>';
                    break;
                case 'updateLearnEpVersionCircle':
                    var circleLabel = this.getContainedEntityLabel(),
                        episodeLabel = this.labelNotFoundText;

                    templateSettings.iconClass.push('glyphicon-info-sign');
                    templateSettings.content = ' updated circle <strong>' + circleLabel + '</strong> of episode <strong>' + episodeLabel + '</strong>';
                    break;
                case 'removeLearnEpVersionCircle':
                    // XXX Labels not set
                    var episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-minus-sign');
                    templateSettings.content = ' removed circle from episode <strong>' + episodeLabel + '</strong>';
                    break;
                default:
                    templateSettings.iconClass.push('glyphicon-question-sign');
                    templateSettings.author = '';
                    templateSettings.content = 'Unhandled activity type: ' + activityType;
            }

            if ( isLoggedInActor ) {
                templateSettings.author = 'I';
                templateSettings.iconClass.push('streamActionMine');
            } else {
                templateSettings.author = this.getOwnerName();
                templateSettings.iconClass.push('streamActionOthers');
            }

            this.$el.html(_.template(ActivityTemplate, templateSettings));
            return this;
        },
        getOwnerUri: function() {
            if ( this.owner && this.owner.isEntity ) {
                return this.owner.getSubject();
            }
            return this.owner;
        },
        getOwnerName: function() {
            if ( this.owner && this.owner.isEntity ) {
                return this.owner.get(Voc.label);
            }
            return this.owner;
        },
        _getEntitiesArrayFromAttribute: function(attribute) {
            var entities = this.model.get(attribute);

            if ( !_.isArray(entities) ) {
                entities = [entities];
            }

            return entities;
        },
        _getEntitiesLabelsArrayFromAttribute: function(attribute, ignored) {
            var labels = [],
                entities = this._getEntitiesArrayFromAttribute(attribute);

            if ( _.isEmpty(ignored) || !_.isArray(ignored) ) {
                ignored = [];
            }

            _.each(entities, function(entity) {
                if ( entity && entity.isEntity && _.indexOf(ignored, entity.getSubject()) === -1 ) {
                    labels.push(entity.get(Voc.label));
                }
            });

            return labels;
        },
        getEntitiesLabels: function() {
            return this._getEntitiesLabelsArrayFromAttribute(Voc.hasEntities);
        },
        getUsersLabels: function() {
            return this._getEntitiesLabelsArrayFromAttribute(Voc.hasUsers, [userParams.user]);
        },
        getEpisodeLabel: function() {
            var entities = this.model.get(Voc.hasEntities);
            if ( !_.isEmpty(entities) ) {
                entities = ( _.isArray(entities) ) ? entities : [entities];

                var episode =  _.find(entities, function(entity) {
                    if ( entity.isEntity ) {
                        if ( entity.isof(Voc.EPISODE) ) {
                            return true;
                        }
                    }
                    return false;
                });

                if ( episode ) {
                    return episode.get(Voc.label);
                }
            }

            return '';
        },
        getContainedEntity: function() {
            var entity = this.model.get(Voc.hasResource);

            if ( entity && entity.isEntity ) {
                return entity;
            }

            return false;
        },
        getContainedEntityLabel: function() {
            var label = this.labelNotFoundText,
                entity = this.getContainedEntity();

            if ( entity ) {
                if ( entity.isof(Voc.VERSION) ) {
                    var episode = version.get(Voc.belongsToEpisode);

                    if ( episode && episode.isEntity ) {
                        label = episode.get(Voc.label);
                    } else {
                        // In case episode not loaded for version, render again once it is loaded
                        version.once('change:'+this.model.vie.namespaces.uri(Voc.belongsToEpisode), this.render, this);
                    }
                } else {
                    label = entity.get(Voc.label);
                }
            }

            return label;
        }
    });
});
