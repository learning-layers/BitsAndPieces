define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'view/toolbar/BitToolbarView', 'view/toolbar/SearchToolbarView', 'view/toolbar/EpisodeToolbarView', 'view/toolbar/NotificationsToolbarView',
        'text!templates/toolbar/toolbar.tpl'], function(Logger, tracker, _, $, Backbone, Voc, BitToolbarView, SearchToolbarView, EpisodeToolbarView, NotificationsToolbarView, ToolbarTemplate){
    return Backbone.View.extend({
        subViews: {},
        tabMap : {
            'notifications' : 0,
            'search' : 1,
            'bit' : 2,
            'episode' : 3
        },
        events: {
            'click .toolbar-handle': 'showHide',
            'bnp:clickEntity' : 'clickEntity'
        },
        LOG: Logger.get('ToolbarView'),
        initialize: function() {
            this.is_hidden = true;
            this.$el.addClass('toolbarHidden');
        },
        setBit: function(entity) {
            this.subViews['bit'].setEntity(entity);
            this.$el.find('#tabs').tabs("option", "active", this.tabMap['bit']);
            if ( this.isHidden() ) this.showHide();
        },
        render: function() {
            var tabs = _.template(ToolbarTemplate, {});
            this.$el.html(tabs);
            this.$el.find('#tabs').tabs();

            this.subViews['notifications'] = new NotificationsToolbarView({
                el : this.getTabId('notifications')
            });
            this.subViews['notifications'].render();

            this.subViews['search'] = new SearchToolbarView({
                el : this.getTabId('search')
            });
            this.subViews['search'].render();

            this.subViews['bit'] = new BitToolbarView({
                el : this.getTabId('bit')
            });
            this.subViews['bit'].render();

            this.subViews['episode'] = new EpisodeToolbarView({
                model: this.model,
                el : this.getTabId('episode')
            });
            this.subViews['episode'].render();
        },
        showHide: function(e) {
            var toolbar = this,
                handle = this.$el.find('.toolbar-handle');
            if (this.isHidden()) {
                this.$el.switchClass('toolbarHidden', 'toolbarShown', function() {
                    toolbar.is_hidden = false;
                    handle.find('.glyphicon').switchClass('glyphicon-chevron-left', 'glyphicon-chevron-right');
                });
            } else {
                this.$el.switchClass('toolbarShown', 'toolbarHidden', function() {
                    toolbar.is_hidden = true;
                    handle.find('.glyphicon').switchClass('glyphicon-chevron-right', 'glyphicon-chevron-left');
                });
            }
        },
        isHidden: function() {
            return this.is_hidden;
        },
        getTabId: function(key) {
            return '#tab-' + this.tabMap[key];
        },
        clickEntity: function(e) {
            // Setting viewContext to event
            e['viewContext'] = this;
        }
    });
});
