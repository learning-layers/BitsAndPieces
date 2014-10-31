<div class="panel panel-default toolbarContent toolbarcontentNotifications">

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
                <input type="checkbox" id="showMessages" name="showInToolbar[]" value="messages" checked="checked" />
                <label class="notBoldLabel" for="showMessages">Messages</label>
                <br />
                <input type="checkbox" id="showNotifications" name="showInToolbar[]" value="notifications" checked="checked" />
                <label class="notBoldLabel" for="showNotifications">Notifications</label>
                <br />
                <input type="checkbox" id="showRecommendations" name="showInToolbar[]" value="recommendations" checked="checked" />
                <label class="notBoldLabel" for="showRecommendations">Recommendations</label>
            </div>

        </div><!-- .showInToolbar -->

        <div class="form-group hotTopics">
            <label class="control-label">Hot topics:</label>

            <div class="tagcloud"></div>
        </div><!-- .hotTopics -->


        <div class="form-group stream">
            <label class="control-label">Stream:</label>
            <div class="resultSet"></div>
        </div><!-- .stream -->

        <div class="form-group writeMessage">
            <label class="control-label">Write mew message to:</label>

            <div class="form-group">
                <input type="text" class="form-control" name="messageRecipient" value="" />
            </div>

            <div class="form-group">
                <textarea class="form-control" name="messageText"></textarea>
            </div>

        </div><!-- .writeMessage -->

    </div><!-- .panel-body -->

</div>
