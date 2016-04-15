define(['underscore', 'jquery', 'text!../data/help.json', 'text!../js/templates/navbar.tpl', 'text!../js/templates/overview_and_structure.tpl', 'colorbox', 'bootstrap'],
function(_, $, help, NavbarTemplate, OverviewAndStructureTemplate) {
    var generateVideoListItemHtml = function(video) {
        var listClasses = ['list-group-item'],
            html = '';

        if ( video.url === 'NONE' ) {
            listClasses.push('disabled');
        }
        html += '<li class="' + listClasses.join(' ') + '">';
        html += '<span class="badge"><i class="fa fa-clock-o"></i> ' + video.duration + '</span>';
        html += '<a href="' + video.url + '" class="youtube">';
        html += '<i class="fa fa-youtube"></i>';
        html += video.title;
        html += '</a>';
        html += '</li>';

        return html;
    };

    $(document).ready(function(){
        var helpData = JSON.parse(help),
            appContainerElement = $(document).find('#bnp-help-app'),
            helpText = '',
            navbar = _.template(NavbarTemplate, {}),
            overviewAndStructure = _.template(OverviewAndStructureTemplate, {});

        _.each(helpData.apps, function(app) {
            helpText += '<h2>' + app.title + '</h2>';

            if ( app.alerts && _.isArray(app.alerts) && app.alerts.length > 0 ) {
                _.each(app.alerts, function(single) {
                    helpText += '<div class="alert alert-' + single.type + '">' + single.text + '</div>';
                });
            }

            _.each(app.chapters, function(chapter) {
                helpText += '<h3>' + chapter.title + '</h3>';

                if ( chapter.template && chapter.template === 'overview_and_structure' ) {
                    helpText += overviewAndStructure;
                }

                if ( chapter.videos && _.isArray(chapter.videos) && chapter.videos.length > 0 ) {
                    helpText += '<ul class="list-group">';
                    _.each(chapter.videos, function(video) {
                        helpText += generateVideoListItemHtml(video);
                    });
                    helpText += '</ul>';
                }
            });
        });

        appContainerElement.find('.bnp-help-loading').hide();
        appContainerElement.parent().prepend(navbar);
        appContainerElement.append(helpText);

        $('.youtube').colorbox({
            iframe:true,
            innerWidth:560,
            innerHeight:315
        });
    });

    return null;
});
