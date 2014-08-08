<div class="toolbarContent toolbarContentEpisode">

<div class="panel panel-default">

    <div class="panel-heading">
        <h3 class="panel-title">Episode</h3>
    </div>

    <div class="panel-body">

        <div class="toolbarSection">
            <div class="form-group">
                <label>Episode Title:</label>
                <input type="text" class="form-control" name="label" value="<%= entity.label %>" />
            </div>

            <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" name="description"><%= entity.description %></textarea>
            </div>

            <div class="shareEpisode">
                <label>Share Episode:</label>

                <div>
                    <input type="radio" id="coediting" name="sharetype" value="coediting" checked="checked" />
                    <label class="notBoldLabel" for="coediting">For co-editing</label>
                    <br />
                    <input type="radio" id="separatecopy" name="sharetype" value="separatecopy" />
                    <label class="notBoldLabel" for="separatecopy">As a separate copy</label>
                </div>

                <br />

                <div>
                    <label>Selected bits only</label>
                    <input type="checkbox" name="onlyselected" value="1" disabled="disabled" />
                </div>

                <br />

                <div class="form-group">
                    <label>Share with:</label>
                    <input type="text" class="form-control" name="sharewith" value="" placeholder="Enter username to search"/>
                </div>

                <div class="form-group">
                    <label>Sharing notification text:</label>
                    <textarea class="form-control" name="notificationtext" placeholder="Enter a text that user will receive when sharing episode"></textarea>
                </div>

                <div class="form-group">
                    <label>Share to folder:</label>
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
        <h3 class="panel-title">Open episode</h3>
    </div>

    <div class="panel-body">

        <div class="toolbarSection toolbarSectionEpisodes">
            <div class="form-group">
                <label>Search Episodes:</label>
                <input type="text" class="form-control" name="search" value="" placeholder="Enter episode name to search" />
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
