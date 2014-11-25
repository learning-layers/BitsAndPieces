define(['underscore', 'backbone', 'logger', 'jquery', 'voc',
        'userParams', 'utils/DateHelpers',
        'text!templates/sss/activity.tpl',
        'view/sss/EntityView'], function(_, Backbone, Logger, $, Voc, userParams, DateHelpers, ActivityTemplate, EntityView) {
    return Backbone.View.extend({
        LOG: Logger.get('ActivityView'),
        events: {
        },
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
                    var episodeLabel = this.getEntitiesLabels()[0];

                    templateSettings.iconClass.push('glyphicon-bell');
                    if ( isLoggedInActor ) {
                        templateSettings.content = ' shared episode ' + episodeLabel;
                        // TODO Missing information about whome the episode was shared with
                    } else {
                        templateSettings.content = ' shared with me ' + episodeLabel;
                    }
                    break;
                case 'createLearnEp':
                    var eisodeLabel = this.getEntitiesLabels()[0];

                    templateSettings.iconClass.push('glyphicon-briefcase');
                    templateSettings.content = ' created an episode ' + episodeLabel;
                    break;
                case 'addEntityToLearnEpVersion':
                    // XXX Labels not set
                    var bitLabel = '',
                        episodeLabel = '';

                    templateSettings.iconClass.push('glyphicon-plus-sign');
                    templateSettings.content = ' added bit ' + bitLabel + ' to episode ' + episodeLabel;
                    break;
                case 'updateLearnEpVersionEntity':
                    // XXX Labels not set
                    var bitLabel = '',
                        episodeLabel = '';

                    templateSettings.iconClass.push('glyphicon-info-sign');
                    templateSettings.content = ' updated bit ' + bitLabel + ' of episode' + episodeLabel;
                    break;
                case 'removeLearnEpVersionEntity':
                    // XXX Labels not set
                    var bitLabel = '',
                        episodeLabel = '';

                    templateSettings.iconClass.push('glyphicon-minus-sign');
                    templateSettings.content = ' removed bit ' + bitLabel + ' from episode' + episodeLabel;
                    break;
                case 'addCircleToLearnEpVersion':
                    // XXX Labels not set
                    var circleLabel = '',
                        episodeLabel = '';
                    templateSettings.iconClass.push('glyphicon-plus-sign');
                    templateSettings.content = ' added circle ' + circleLabel + ' to episode ' + episodeLabel;
                    break;
                case 'updateLearnEpVersionCircle':
                    // XXX Labels not set
                    var circleLabel = '',
                        episodeLabel = '';
                    templateSettings.iconClass.push('glyphicon-info-sign');
                    templateSettings.content = ' updated circle ' + circleLabel + ' of episode ' + episodeLabel;
                    break;
                case 'removeLearnEpVersionCircle':
                    // XXX Labels not set
                    var circleLabel = '',
                        episodeLabel = '';
                    templateSettings.iconClass.push('glyphicon-minus-sign');
                    templateSettings.content = ' removed circle ' + circleLabel + ' from episode ' + episodeLabel;
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
        _getEntitiesLabelsArrayFromAttribute: function(attribute) {
            var labels = [],
                entities = this._getEntitiesArrayFromAttribute(attribute);

            _.each(entities, function(entity) {
                // XXX There is no guarantee that an entity has already been loaded
                // Need to make sure that all is loaded (checks on the whole batch is probably needed)
                if ( entity && entity.isEntity ) {
                    labels.push(entity.get(Voc.label));
                } else {
                    labels.push(entity);
                }
            });

            return labels;
        },
        getEntitiesLabels: function() {
            return this._getEntitiesLabelsArrayFromAttribute(Voc.hasEntities);
        },
        getUsersLabels: function() {
            return this._getEntitiesLabelsArrayFromAttribute(Voc.hasUsers);
        }
    });
});
