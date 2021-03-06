<div class="toolbarContent toolbarContentEpisode">

<div class="panel panel-default">

    <div class="panel-heading">
        <h3 class="panel-title">Episode info</h3>
    </div>

    <div class="panel-body">

        <div class="toolbarSection">
            <div class="form-group">
                <span class="episodeVisibility"><%= entity.visibility %></span>
                | <span class="episodeSharedWith"><%= entity.sharedWith %></span>
            </div>

            <div class="form-group">
                <label class="control-label">Episode Title:</label>
                <input type="text" class="form-control" name="label" value="<%= entity.label %>" />
            </div>

            <div class="form-group">
                <label class="control-label">Description</label>
                <textarea class="form-control" name="description"><%= entity.description %></textarea>
                <p class="help-block">Allows input of up to 5.000 characters. </p>
            </div>
        </div>

    </div>
</div>

<div class="panel panel-default">

    <div class="panel-heading">
        <h3 class="panel-title">Share Episode</h3>
    </div>

    <div class="panel-body">

        <div class="toolbarSection">

            <div class="shareEpisode">

                <div>
                    <input type="radio" id="coediting" name="sharetype" value="coediting" checked="checked" />
                    <label class="notBoldLabel" for="coediting">For co-editing</label>
                    <br />
                    <input type="radio" id="separatecopy" name="sharetype" value="separatecopy" />
                    <label class="notBoldLabel" for="separatecopy">As a separate copy</label>
                </div>

                <br />

                <div>
                    <label class="control-label">Selected bits only</label>
                    <input type="checkbox" name="onlyselected" value="1" disabled="disabled" />
                </div>

                <br />

                <div class="form-group">
                    <label class="control-label">Share with:</label>
                    <input type="text" class="form-control" name="sharewith" value="" placeholder="Enter username to search"/>
                </div>

                <div class="form-group" style="display:none;">
                    <label class="control-label">Sharing notification text:</label>
                    <textarea class="form-control" name="notificationtext" placeholder="Enter a text that user will receive when sharing episode"></textarea>
                </div>

                <div class="form-group" style="display:none;">
                    <label class="control-label">Share to folder:</label>
                    <select class="form-control" name="sharetofolder" disabled="disabled">
                        <option value="None">None</option>
                    </select>
                </div>

                <button type="button" class="btn btn-success" name="share">Share</button>
            </div>
        </div>

    </div><!-- .panel-body -->

</div><!-- .panel -->

<div class="panel panel-default">

    <div class="panel-heading">
        <h3 class="panel-title">Open Episode</h3>
    </div>

    <div class="panel-body">

        <div class="toolbarSection toolbarSectionEpisodes">
            <div class="form-group search">
                <label class="control-label">Search Episodes:</label>
                <div class="input-group">
                    <input type="text" class="form-control" name="search" value="" placeholder="Enter episode name to search" />
                    <span class="input-group-addon">
                        <a href="#"><span class="glyphicon glyphicon-remove-circle"></span></a>
                    </span>
                </div>
            </div>

            <div class="myEpisodes">
                <label>My Episodes</label>
                <ul class="episodeListing">
                </ul>
            </div>
        </div>

    </div><!-- .panel-body -->

</div><!-- .panel -->

</div>
