define(['logger', 'underscore', 'jquery', 'backbone', 'voc',
        'view/toolbar/BitToolbarView', 'view/toolbar/SearchToolbarView', 'view/toolbar/EpisodeToolbarView', 'view/toolbar/ActivityStreamToolbarView',
        'text!templates/toolbar/toolbar.tpl'], function(Logger, _, $, Backbone, Voc, BitToolbarView, SearchToolbarView, EpisodeToolbarView, ActivityStreamToolbarView, ToolbarTemplate){
    return Backbone.View.extend({
        subViews: {},
        tabMap : {
            'activity_stream' : 0,
            'search' : 1,
            'bit' : 2,
            'episode' : 3
        },
        events: {
            'click .toolbar-handle': 'showHide',
            'bnp:clickEntity' : 'clickEntity',
            'bnp:createEpisode' : 'handleCreateEpisode'
        },
        LOG: Logger.get('ToolbarView'),
        _triggerShowHideEvent: function(type) {
            var ev = $.Event("bnp:showHideToolbar", {
                customType: type
            });
            this.$el.trigger(ev);
        },
        _calculateAndSetToolbarHeight: function() {
            var windowHeight = $(window).height(),
                toolbarPosition = this.$el.position();
            this.$el.css('height', windowHeight - toolbarPosition.top);
        },
        initialize: function() {
            var that = this;

            this.is_hidden = true;
            this.$el.addClass('toolbarHidden');

            // Set real height
            this._calculateAndSetToolbarHeight();
            // Add resize listener
            this.timerId = null;
            $(window).on('resize', function() {
                if ( that.timerId ) {
                    clearTimeout(that.timerId);
                }

                that.timerId = setTimeout(function() {
                    that.timerId = null;
                    that._calculateAndSetToolbarHeight();
                }, 500);
            });
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

            this.subViews['activity_stream'] = new ActivityStreamToolbarView({
                el : this.getTabId('activity_stream')
            });
            this.subViews['activity_stream'].render();

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
                toolbar._triggerShowHideEvent('shown');
            } else {
                this.$el.switchClass('toolbarShown', 'toolbarHidden', function() {
                    toolbar.is_hidden = true;
                    handle.find('.glyphicon').switchClass('glyphicon-chevron-right', 'glyphicon-chevron-left');
                });
                toolbar._triggerShowHideEvent('hidden');
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
        },
        handleCreateEpisode: function(e) {
            this.$el.find('#tabs').tabs("option", "active", this.tabMap['episode']);
            if ( this.isHidden() ) this.showHide();
        }
    });
});
