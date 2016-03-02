<div class="panel panel-default toolbarContent toolbarcontentActivityStream">

    <div class="panel-heading">
        <h3 class="panel-title">Activity Stream</h3>
    </div>

    <div class="panel-body">
        <div class="form-group showInToolbar">
            <label class="control-label">Show in toolbar:</label>

            <div class="form-group">
                <input type="checkbox" id="showActivities" name="showInToolbar[]" value="activities" checked="checked" />
                <label class="notBoldLabel" for="showActivities">Activities</label>
                <br />
                <input type="checkbox" id="showRecommendations" name="showInToolbar[]" value="recommendations" checked="checked" />
                <label class="notBoldLabel" for="showRecommendations">Recommendations</label>
            </div>

        </div><!-- .showInToolbar -->

        <div class="form-group hotTopics" style="display:none;">
            <label class="control-label">Hot topics:</label>

            <div class="tagcloud"></div>
        </div><!-- .hotTopics -->


        <div class="form-group stream">
            <label class="control-label">Stream:</label>
            <button class="btn btn-default activityStreamRefresh">
                <span class="glyphicon glyphicon-refresh"></span>
            </button>
            <div class="resultSet"></div>
        </div><!-- .stream -->

    </div><!-- .panel-body -->

</div>
