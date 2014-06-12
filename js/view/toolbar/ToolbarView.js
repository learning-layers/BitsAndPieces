define(['logger', 'tracker', 'underscore', 'jquery', 'backbone', 'voc', 
        'view/toolbar/BitToolbarView', 'view/toolbar/SearchToolbarView',
        'text!templates/toolbar/toolbar.tpl'], function(Logger, tracker, _, $, Backbone, Voc, BitToolbarView, SearchToolbarView, ToolbarTemplate){
    return Backbone.View.extend({
        subViews: {},
        tabMap : {
            'notification' : 0,
            'search' : 1,
            'bit' : 2,
            'episode' : 3
        },
        events: {
            'click .toolbar-handle': 'showHide'
        },
        LOG: Logger.get('ToolbarView'),
        initialize: function() {
            this.is_hidden = true;
            this.$el.addClass('toolbarHidden');
        },
        setBit: function(entity) {
            this.subViews['bit'].setEntity(entity);
        },
        render: function() {
            var tabs = _.template(ToolbarTemplate, {});
            this.$el.html(tabs);
            this.$el.find('#tabs').tabs();

            this.subViews['search'] = new SearchToolbarView({
                el : this.getTabId('search')
            });
            this.subViews['search'].render();

            this.subViews['bit'] = new BitToolbarView({
                el : this.getTabId('bit')
            });
            this.subViews['bit'].render();
        },
        showHide: function(e) {
            var toolbar = this;
            if (this.isHidden()) {
                this.$el.switchClass('toolbarHidden', 'toolbarShown', function() {
                    toolbar.is_hidden = false;
                });
            } else {
                this.$el.switchClass('toolbarShown', 'toolbarHidden', function() {
                    toolbar.is_hidden = true;
                });
            }
        },
        isHidden: function() {
            return this.is_hidden;
        },
        getTabId: function(key) {
            return '#tab-' + this.tabMap[key];
        },
    });
});
