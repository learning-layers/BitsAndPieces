define(['tracker', 'underscore', 'backbone', 'logger', 'jquery', 'voc',
        'userParams', 'utils/DateHelpers',
        'text!templates/sss/activity.tpl',
        'view/sss/EntityView'], function(tracker, _, Backbone, Logger, $, Voc, userParams, DateHelpers, ActivityTemplate, EntityView) {
    return Backbone.View.extend({
        LOG: Logger.get('ActivityView'),
        events: {
            'click' : 'activityClicked'
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
                        templateSettings.content = ' shared episode ' + this.encloseLabel(episodeLabel) + ' with ' + this.encloseLabel( userLabels.join(', ') );
                    } else {
                        templateSettings.content = ' shared with me ' + this.encloseLabel(episodeLabel);
                    }
                    break;
                case 'copyLearnEpForUsers':
                    var episodeLabel = this.getContainedEntityLabel(),
                        userLabels = this.getUsersLabels();

                    templateSettings.iconClass.push('glyphicon-bell');
                    if ( isLoggedInActor ) {
                        templateSettings.content = ' shared a copy of episode ' + this.encloseLabel(episodeLabel) + ' with ' + this.encloseLabel( userLabels.join(', ') );
                    } else {
                        templateSettings.content = ' shared a copy of ' + this.encloseLabel(episodeLabel) + ' with me';
                    }
                    break;
                case 'messageSend':
                    var messageText = this.model.get(Voc.contents)
                        userLabel = this.getUsersLabels().join(', ');

                    messageText = messageText ? messageText : this.labelNotFoundText;

                    if ( _.isArray(messageText) ) {
                        messageText = messageText.toString();
                    }

                    templateSettings.iconClass.push('glyphicon-envelope');
                    templateSettings.content = ' sent message ' + this.encloseLabel(messageText) + ' to ' + this.encloseLabel(userLabel);
                    break;
                case 'addEntityToLearnEpVersion':
                    var bitLabel = this.getContainedEntityLabelByType(Voc.ENTITY),
                        episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-plus-sign');
                    templateSettings.content = ' added bit ' + this.encloseLabel(bitLabel) + ' to episode ' + this.encloseLabel(episodeLabel);
                    break;
                case 'changeEntityForLearnEpVersionEntity':
                    var bitLabel = this.getContainedEntityLabelByType(Voc.ENTITY),
                        episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-info-sign');
                    templateSettings.content = ' updated bit ' + this.encloseLabel(bitLabel) + ' of episode ' + this.encloseLabel(episodeLabel);
                    break;
                case 'moveLearnEpVersionEntity':
                    var bitLabel = this.getContainedEntityLabelByType(Voc.ENTITY),
                        episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-info-sign');
                    templateSettings.content = ' moved bit ' + this.encloseLabel(bitLabel) + ' of episode ' + this.encloseLabel(episodeLabel);
                    break;
                case 'removeLearnEpVersionEntity':
                    var bitLabel = this.getContainedEntityLabelByType(Voc.ENTITY),
                        episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-minus-sign');
                    templateSettings.content = ' removed bit ' + this.encloseLabel(bitLabel) + ' from episode ' + this.encloseLabel(episodeLabel);
                    break;
                case 'addCircleToLearnEpVersion':
                    var circleLabel = this.getContainedEntityLabelByType(Voc.CIRCLE),
                        episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-plus-sign');
                    templateSettings.content = ' added circle ' + this.encloseLabel(circleLabel) + ' to episode ' + this.encloseLabel(episodeLabel);
                    break;
                case 'changeLearnEpVersionCircleLabel':
                    var circleLabel = this.getContainedEntityLabelByType(Voc.CIRCLE),
                        episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-info-sign');
                    templateSettings.content = ' changed label of circle ' + this.encloseLabel(circleLabel) + ' of episode ' + this.encloseLabel(episodeLabel);
                    break;
                case 'moveLearnEpVersionCircle':
                    var circleLabel = this.getContainedEntityLabelByType(Voc.CIRCLE),
                        episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-info-sign');
                    templateSettings.content = ' moved circle ' + this.encloseLabel(circleLabel) + ' of episode ' + this.encloseLabel(episodeLabel);
                    break;
                case 'removeLearnEpVersionCircle':
                    var episodeLabel = this.getContainedEntityLabel();

                    templateSettings.iconClass.push('glyphicon-minus-sign');
                    templateSettings.content = ' removed circle from episode ' + this.encloseLabel(episodeLabel);
                    break;
                default:
                    templateSettings.iconClass.push('glyphicon-question-sign');
                    templateSettings.author = '';
                    templateSettings.content = 'Unhandled activity type: ' + activityType;
            }

            templateSettings.iconClass.push(activityType);

            if ( isLoggedInActor ) {
                templateSettings.author = 'I';
            } else {
                templateSettings.author = this.getOwnerName();
            }

            this.$el.html(_.template(ActivityTemplate, templateSettings));
            return this;
        },
        encloseLabel: function(label) {
            return '<strong>' + label + '</strong>';
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

            if ( _.isEmpty(entities) ) {
                entities = [];
            } else if ( !_.isArray(entities) ) {
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
        getUsersLabels: function() {
            return this._getEntitiesLabelsArrayFromAttribute(Voc.hasUsers, [userParams.user]);
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
                    var episode = entity.get(Voc.belongsToEpisode);

                    if ( episode && episode.isEntity ) {
                        label = episode.get(Voc.label);
                    } else {
                        // In case episode not loaded for version, render again once it is loaded
                        entity.once('change:'+entity.vie.namespaces.uri(Voc.belongsToEpisode), this.render, this);
                    }
                } else {
                    label = entity.get(Voc.label);
                }
            }

            return label;
        },
        getContainedEntityLabelByType: function(type) {
            var label = this.labelNotFoundText,
                entities = this._getEntitiesArrayFromAttribute(Voc.hasEntities);

            if ( entities ) {
                _.each(entities, function(entity) {
                    if ( entity && entity.isEntity && entity.isof(type) ) {
                        label = entity.get(Voc.label);
                    }
                });
            }

            return label;
        },
        activityClicked: function(e) {
            tracker.info(tracker.CLICKBIT, tracker.NOTIFICATIONTAB, this.model.getSubject());
        }
    });
});
