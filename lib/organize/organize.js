var Organize = function(){
};

Organize.prototype = {
    // GLOBAL VARIABLES...

    draw : null, // the SVG canvas
    selectedRect:null,
    xRect : null,
    yRect:null,

    selectedCirc:null,
    selectedLabel:null,
    selectedRectPisitionX:0,
    selectedRectPisitionY:0, 
    selectedEntity : null,
    selectedEntityRect : null, 
    currentLabel:null, 
    draggedLabelInitialX:0,
    draggedLabelInitialY:0,

    currentFobj : null,
    insideLabel:0,
    labelDistanceCx:0,
    labelDistanceCy:0,
    labelCounter:0,
    svgElements : new Array(),
    outsideCircleElements : new Array(),

    isDraggingEntity:0, //(0 - not dragging; 1 - dragging from

    //inside SVG canvas; 2 - dragging from outside the SVG canvas)
    draggedEntity : null,
    draggedEntityInitialX : -1,
    draggedEntityInitialY : -1,
    isDraggingCircle:0,
    draggedCircle:null,
    draggedText:null,
    resizingCircle : false,
    svgDiv : null,

    // constants to identify the border circles which was clicked
    TOPLEFT : 1,
    TOPRIGHT : 2,
    BOTTOMLEFT : 3,
    BOTTOMRIGHT : 4,

    // variables corresponding to each border circles

    circTopLeft : null,
    circTopRight : null,
    circBottomLeft : null,
    circBottomRight : null,

    // Left and right offset for the main svg canvas (svgDiv)
    // The valuea are set after loading the bitsandpieces div
    //int the loadOrganizeCanvas method

    LEFTOFFSET : 0,
    TOPOFFSET : 0


    ,clickOutside : function(event)
    {	
        //this.test1();
        this.updateOffsets();
        if ( (this.selectedRect==null)||(((event.pageX-this.LEFTOFFSET)>=this.selectedRect.attr('x'))  &&  
        ((event.pageX-this.LEFTOFFSET)<= (this.selectedRect.attr('x') + 2*this.selectedCirc.attr('rx'))+3) && 
        ((event.pageY-this.TOPOFFSET)>=this.selectedRect.attr('y'))  && 
        ((event.pageY-this.TOPOFFSET)<= (this.selectedRect.attr('y') + 2*this.selectedCirc.attr('ry'))+3)))	
return 0; //inside 
else
    return 1; //outside	
    }


    ,createObjectForEvent : function(type, element1, text1)
    {    
        var customevEnt, entityIntegration,circIntegration, text=null,result=null;

        // creating an object which is then passed to the other componets through events

        var element, text;
        switch (type){
        case 1: // circle and text are passed as parameters
            {
                element = element1; 
                text = text1;
                break;
            }
        case 2: // circle and text are global variables
            {
                element = this.selectedCirc; 
                text = this.selectedLabel;
                break;
            }
        case 3:// entity is passed as parameter
            {
                element = element1; 
                break;
            }
        case 4 :// entity is a global variable
            {
                element = this.selectedEntity; 
                break;
            }
        }    


    this.updateOffsets();
    if (type==1 || type==2)// circle
    {       
        circIntegration = new Object();
        circIntegration.id = element.attr('id');                
        circIntegration.cx = element.attr('cx');
        circIntegration.cy = element.attr('cy');                
        circIntegration.rx = element.attr('rx');
        circIntegration.ry = element.attr('ry');
        circIntegration.Label = text.content;        
        circIntegration.LabelX = text.attr('x');
        circIntegration.LabelY = text.attr('y');        
        result = circIntegration;             
    }
    if (type == 3 || type==4) //entity
    {
        entityIntegration = new Object();
        entityIntegration.id = element.attr('id');        
        entityIntegration.x = element.transform().x;
        entityIntegration.y = element.transform().y;  
        result = entityIntegration;        
    }       

    return result;
    }           


    ,removeCircleAndEntity : function(event)
    {
        var customevEnt, divSVG; 

        if (event.keyCode==8 || event.keyCode==46) // if bakspace (8) or delete (46) keys are pressed
        {
            if (this.selectedCirc!=null) // delete selected circle
            { 

                // creating an object which is then passed to the other componets through events
                // this circle object should contain information about the circle and the label

                var circIntegration = this.createObjectForEvent (2, null, null); //for selected circle and text     
                customevEnt = $.Event('RemoveCircle', { 'detail': circIntegration });          
                divSVG = this.svgDiv;    
                //divSVG.dispatchEvent(customevEnt);                
                $(divSVG).trigger(customevEnt);

                this.removeCircleFromArray(this.selectedCirc); 
                this.selectedCirc.remove();
                this.selectedLabel.remove();
                this.removeRectSmallCirc();
                this.labelCounter--;           
            }
            if (this.selectedEntity!=null)    
            {
                var entIntegration = this.createObjectForEvent (4, null, null); //for selected circle and text     
                customevEnt = $.Event('RemoveEntity', { 'detail': entIntegration });          
                divSVG = this.svgDiv;    
                //divSVG.dispatchEvent(customevEnt);                
                $(divSVG).trigger(customevEnt);

                this.removeEntityFromAllCircles(this.selectedEntity);
                this.selectedEntity.remove(); 
                this.selectedEntityRect.remove();
            }
        }
    }

    ,removeRectSmallCirc : function()
    {	
        this.selectedRect.remove();
        this.circTopLeft.remove();
        this.circTopRight.remove();
        this.circBottomLeft.remove();
        this.circBottomRight.remove();		

        this.selectedCirc=null
        this.selectedLabel=null;
        this.selectedRect = null;
        this.circTopLeft = null;
        this.circTopRight = null;
        this.circBottomLeft = null;
        this.circBottomRight = null;

    }

    ,unselectLabel : function()
    {
        if (this.currentLabel!=null)
        {

            // getting the id of the circle that contais the CurrentLabel
            var circ = null;
            for(var i=0;i<this.svgElements.length;i++)
            {
                if(this.svgElements[i].label.svg== this.currentLabel)  
                {  
                    circ = this.svgElements[i].svg
                    console.log("Circle found!!!")
                    break;
                }  
            }   
            /*   

             // the foreign object HTML text are content is placed inside 
             // the SVG text
             var n = this.currentFobj.getChild(0);
             var newTextLabel=n.value;
             this.currentLabel.show();
             this.currentLabel.text(newTextLabel);
             this.currentFobj.remove();
             this.currentFobj=null;       
             */  

            //Firing the ChangeCircle event (due to eventual change on the label)
            var divSVG = this.svgDiv;    
            var entIntegration = this.createObjectForEvent(1,circ, 
                this.currentLabel);     
            var customevEnt = $.Event('ChangeCircle', { 'detail': entIntegration });             
            //divSVG.dispatchEvent(customevEnt);
            $(divSVG).trigger(customevEnt);
            console.log("Change circle fired!");

            // reseting the currentLabel
            this.currentLabel=null;          

        }
    }

    ,unselectAllForDraggingEvent : function()
    {
        this.unselectEntity();   

        if (this.selectedRect!=null) 
        {      
            // Removes small circles
            // this.removeRectSmallCirc();
        }           
        // If there is any selected ring label (this.insideLabel) then stop editing it
        if (this.insideLabel==0)                      
            this.unselectLabel();

    }


    ,unselectEntity : function()
    {
        if (this.selectedEntity!=null)    
        {
            this.selectedEntity=null; 
            this.selectedEntityRect.remove();
            this.selectedEntityRect=null;
        }  

    }


    ,unselectCircAndLabel : function(event)
    {


        // If there is any selected ring label (this.insideLabel) then stop editing it
        if (this.insideLabel==0)                      
            this.unselectLabel();

        // if users clicks outside the rectangle, then remove small circles
        if(this.clickOutside(event))
        {
            this.removeRectSmallCirc();
        }             
    } 

    ,stylySmallCircle : function(circ, type)
    {
        switch (type)
        {
        case this.TOPLEFT:{ circ.style('cursor', 'nw-resize');break;}
        case this.TOPRIGHT:{ circ.style('cursor', 'ne-resize');break;}
        case this.BOTTOMLEFT:{ circ.style('cursor', 'sw-resize');break;}
        case this.BOTTOMRIGHT:{ circ.style('cursor', 'se-resize');break;}
        }

    } 


    ,drawSmallCircle : function(X,Y,bigCirc,bigRect,idSmallCic)
    {

        var xMouseDown,yMouseDown,initialRectXSize;
        var initialRectYSize,initialRectX,initialRectY;         

        var circ = this.draw.circle(10).attr({ fill: 'blue' }).stroke({ width: 0.3 });
        circ.attr({ cx:X,cy:Y});
        var that = this;
        circ.on('mousedown', function(event) {

            xMouseDown = event.pageX;
            yMouseDown = event.pageY;
            initialRectXSize = bigRect.attr('width');
            initialRectYSize = bigRect.attr('height');
            initialRectX = bigRect.attr('x');
            initialRectY = bigRect.attr('y');         

            that.labelDistanceCx=-( that.selectedCirc.attr('cx')- that.selectedLabel.attr('x'));
            that.labelDistanceCy=-( that.selectedCirc.attr('cy')- that.selectedLabel.attr('y'));

            that.svgDiv.onmousemove= function(event) {	

                // Resizing the rectangle

                that.resizingCircle = true; // this is usefull for the onmouseup event to stop
                //resizing the circle while moving the mouse
                var newRectXsize = Math.abs(initialRectXSize + (event.pageX-xMouseDown));
                var newRectYsize = Math.abs(initialRectYSize + (event.pageY-yMouseDown));

                that.updateOffsets();		
                if ((idSmallCic==that.BOTTOMLEFT) || (idSmallCic==that.TOPLEFT))
                {
                    // crossing left border starting from the left border
                    if((event.pageX-that.LEFTOFFSET)<initialRectX) 
                    {
                        newRectXsize = Math.abs(initialRectXSize + Math.abs(event.pageX-that.LEFTOFFSET-initialRectX));
                        bigRect.attr('x',(event.pageX-that.LEFTOFFSET));
                    }
                    else
                    {
                        newRectXsize = Math.abs(initialRectXSize + -Math.abs(event.pageX-that.LEFTOFFSET-initialRectX));
                        // crossing right border, coming from the left border
                        if (!((event.pageX-that.LEFTOFFSET)> (initialRectX+initialRectXSize))) 
                            bigRect.attr('x',(event.pageX-that.LEFTOFFSET));

                    }
                }

                if ((idSmallCic==that.TOPLEFT) || (idSmallCic==that.TOPRIGHT))
                {
                    // crossing top border starting from the top border
                    if((event.pageY-that.TOPOFFSET)<initialRectY)
                    {
                        newRectYsize = Math.abs(initialRectYSize + Math.abs(event.pageY-that.TOPOFFSET-initialRectY));
                        bigRect.attr('y',(event.pageY-that.TOPOFFSET));
                    }
                    else // crossing bottom border starting from the top border
                    {
                        newRectYsize = Math.abs(initialRectYSize + -Math.abs(event.pageY-that.TOPOFFSET-initialRectY));
                        if (!((event.pageY-that.TOPOFFSET)> (initialRectY+initialRectYSize)))
                            bigRect.attr('y',(event.pageY-that.TOPOFFSET));
                    }
                }			

                if ((idSmallCic==that.TOPRIGHT) || (idSmallCic==that.BOTTOMRIGHT))
                {
                    // crossing left border starting from the right border
                    if((event.pageX-that.LEFTOFFSET)<initialRectX) 
                        bigRect.attr('x',(event.pageX-that.LEFTOFFSET));
                }			

                if ((idSmallCic==that.BOTTOMLEFT) || (idSmallCic==that.BOTTOMRIGHT))
                {
                    // crossing top border starting from the bottom border
                    if((event.pageY-that.TOPOFFSET)<initialRectY) 
                        bigRect.attr('y',(event.pageY-that.TOPOFFSET));
                }				


                bigRect.size(newRectXsize,newRectYsize); // final resizing of the rectangle

                // Resizing the (big) circle: changing the radius			
                var newCircXRad = newRectXsize/2;
                var newCircYRad = newRectYsize/2; 
                bigCirc.attr('rx',newCircXRad);
                bigCirc.attr('ry',newCircYRad);
                bigCirc.attr('x',bigRect.attr('x'));
                bigCirc.attr('y',bigRect.attr('y'));

                // Changinh the center of the big circle				
                bigCirc.attr('cx',(bigRect.attr('x')+(newRectXsize/2)) );
                bigCirc.attr('cy',(bigRect.attr('y')+(newRectYsize/2)) );

                // Setting the new dragging border of the circle Label                 
                //that.setTextDragLimit(that.selectedLabel,bigCirc.attr('cx'),bigCirc.attr('cy'),bigCirc.attr('rx'),bigCirc.attr('ry'));
                that.setTextDragLimit( that.selectedLabel,bigCirc.attr('cx'),bigCirc.attr('cy'),bigCirc.attr('rx'),bigCirc.attr('ry'));

                //Setting te ew location of the Label  
                //that.selectedLabel.move(bigCirc.attr('cx')-30,bigCirc.attr('cy')-bigCirc.attr('ry')-30);
                that.selectedLabel.move(bigCirc.attr('cx')+that.labelDistanceCx,
                bigCirc.attr('cy')+that.labelDistanceCy);


                // Adjusting the locaton of the border circles (small circles)			
                if (that.circTopLeft!=null)
                {
                    that.circTopLeft.attr('cx',bigRect.attr('x'));
                    that.circTopLeft.attr('cy',bigRect.attr('y'))
                }

                if (that.circTopRight!=null)
                {
                    that.circTopRight.attr('cx',bigRect.attr('x')+newRectXsize);
                    that.circTopRight.attr('cy',bigRect.attr('y'))
                }

                if (that.circBottomLeft!=null)
                {
                    that.circBottomLeft.attr('cx',bigRect.attr('x'));
                    that.circBottomLeft.attr('cy',bigRect.attr('y')+newRectYsize)
                }	

                if (that.circBottomRight!=null)
                {
                    that.circBottomRight.attr('cx',bigRect.attr('x')+newRectXsize);
                    that.circBottomRight.attr('cy',bigRect.attr('y')+newRectYsize)
                }
            // The circle resizing stops when mouseup event is triggered 
            }

        });

        this.stylySmallCircle(circ, idSmallCic) // stylying small circles
        return circ;
    }

    ,clickCircle : function(circ,text)
    {
        // if there is another selected circle, then unselect it by 
        // removing the rectangle and small circles...
        if (this.selectedCirc!=null)
            this.removeRectSmallCirc();

        var radiusx = circ.attr('rx');
        var radiusy = circ.attr('ry');

        var x = circ.attr('cx');
        var y = circ.attr('cy');
        this.xRect = radiusx*2;
        this.yRect = radiusy*2;

        var im1 = this.draw.rect(this.xRect,this.yRect).attr({ fill: 'none' }).stroke({ width: 0.3,color:'blue' });
        im1.center(x,y);
        //im1.draggable();	
        this.selectedRect = im1;
        this.selectedCirc = circ;
        this.selectedLabel = text;

        // Drawing small circles on the corners of the rectangles
        var topLeftX = x - radiusx;
        var topLeftY = y - radiusy;
        this.circTopLeft = this.drawSmallCircle(topLeftX,topLeftY,circ,im1,this.TOPLEFT);

        var topRigtX = x + radiusx;
        var topRigtY = y - radiusy;
        this.circTopRight = this.drawSmallCircle(topRigtX,topRigtY,circ,im1,this.TOPRIGHT);

        var bottomLeftX = x - radiusx;
        var bottomLeftY = y + radiusy;
        this.circBottomLeft = this.drawSmallCircle(bottomLeftX,bottomLeftY,circ,im1,this.BOTTOMLEFT);

        var bottomRightX = x + radiusx;
        var bottomRightY = y + radiusy;
        this.circBottomRight = this.drawSmallCircle(bottomRightX,bottomRightY,circ,im1,this.BOTTOMRIGHT);	

        var divSVG = this.svgDiv;    
        divSVG.focus();
    }	


    ,clickRect : function(rect)
    {
        this.selectedRect = rect;
        this.xRect = this.selectedRect.attr('x');
        this.yRect = this.selectedRect.attr('y');


        this.svgDiv.onmousemove= function(event) {	
            var newXsize = event.pageX-this.xRect;
            var newYsize = event.pageY-this.yRect;

            this.selectedRect.size(newXsize,newYsize);

        }	
    }


    ,canvasDoubleClick : function(event)
    {


        if (this.selectedEntity==null && this.currentFobj==null)
            this.drawCircle(event,null);
        /* else
         alert ("entity double clicked")
         opens the this.selectedEntity with the 
         right application 
         */

    }



    ,updateOffsets : function()
    { 

        var el=this.svgDiv;  
        this.LEFTOFFSET = $(el).offset().left;
        this.TOPOFFSET = $(el).offset().top;
    }


    ,test : function(event)
    {    

        this.clearCanvas();
    }

    ,changeCircleAndLabel : function(circ,text,circIntegration)
    {

        //circ.attr('cx',circIntegration.x+this.LEFTOFFSET); 
        //circ.attr('cy',circIntegration.y+this.TOPOFFSET);

        console.log("Received parameters:")

        console.log("cx: "+circIntegration.cx);
        console.log("cy: "+circIntegration.cy);
        console.log("rx: "+circIntegration.rx);
        console.log("ry: "+circIntegration.ry);
        console.log("LabelX: "+circIntegration.LabelX);
        console.log("LabelY: "+circIntegration.LabelY);
        console.log("LabelX: "+circIntegration.Label);


        circ.attr('cx',circIntegration.x); 
        circ.attr('cy',circIntegration.y);


        circ.attr('rx',circIntegration.rx);
        circ.attr('ry',circIntegration.ry);

        //text.move(circIntegration.LabelX,circIntegration.LabelY);
        //text.move(circIntegration.LabelX+this.LEFTOFFSET,circIntegration.LabelY+this.TOPOFFSET);
        text.text(circIntegration.Label);
    } 


    ,drawCircle : function(ev,circIntegration0)
    { 

        var x,y,circ,text,diameter,LabelContent,xLabel,yLabel,ArrayOfOverlappingCircles;
        var divSVG;

        this.updateOffsets();
        ArrayOfOverlappingCircles = new Array();

        if(ev==null) // The ircle is added from the server data
        {
            x = circIntegration0.cx;
            y = circIntegration0.cy;

            diameter = circIntegration0.rx*2;            

            xLabel = circIntegration0.LabelX; 
            yLabel = circIntegration0.LabelY;;   

            this.labelCounter++;
            LabelContent = circIntegration0.Label;
            text = this.drawTag(x,y,xLabel,yLabel,LabelContent,circIntegration0.rx,circIntegration0.ry);  
            circ = this.draw.circle(diameter).attr({ fill: 'transparent',cx: x, cy: y,
                    rx:circIntegration0.rx,ry:circIntegration0.ry}).stroke({ width: 2 });                                     
        }  
        else // The circle is added by the user
        {   
            x = ev.pageX-this.LEFTOFFSET;
            y = ev.pageY-this.TOPOFFSET;
            diameter = 200;

            xLabel = x-30;
            yLabel = y-diameter/2-30;   


            this.labelCounter++;
            LabelContent = "Concept "+this.labelCounter;
            text = this.drawTag(x,y,xLabel,yLabel,LabelContent,diameter/2,diameter/2); // Label for circle
            circ = this.draw.circle(diameter).attr({ fill: 'transparent',cx: x, cy: y }).stroke({ width: 2 });                       
        }
        circ.back(); 	

        var circlePositionInArray;
        var entitiesInitialPositions = new Array();
        var sharedEntities = new Array();    

        //circ.draggable({minX:0,minY:0,maxX:800,maxY:600 });
        circ.draggable();
        circ.style('cursor','move');
        circlePositionInArray = this.addCircleIntoArray(circ, text);    

        var that = this;
        // MANAGING EVENTS FOR THE CIRCLE
        circ.click(function() {
            that.clickCircle(circ,text);
            //that.insideCircle(ev.pageX-that.LEFTOFFSET,ev.pageY-that.LEFTOFFSET,circ)
        });

        circ.dragstart = function() {

            that.isDraggingCircle=1;
            that.draggedCircle=circ;
            that.draggedText=text;
            // keeps the initial coordinates of the label and of each element 
            // inside the circle so that they can be dragger with the circle
            that.labelDistanceCx=-(circ.attr('cx')-text.attr('x'));
            that.labelDistanceCy=-(circ.attr('cy')-text.attr('y'));

            // Array entitiesInitialPositions stores the initial position off all 
            // entities that are inside a circle, so that they can be dragged 
            // with the circle

            for(var i=0;i<that.svgElements.length;i++) // getting the position of the circle in that.svgElements
                if (that.svgElements[i].svg==circ)
            {  
                circlePositionInArray=i;
                break;
            }  

            var entPos;
            for (var i=0; i<that.svgElements[circlePositionInArray].entities.length;i++)
            {
                entPos = new Object();
                entPos.x = that.svgElements[circlePositionInArray].entities[i].svg.transform().x; 
                entPos.y = that.svgElements[circlePositionInArray].entities[i].svg.transform().y; 
                entitiesInitialPositions.push(entPos);
            }

            // If there a circle is selected (in this case a rectanlge is shown 
            // around this circle as well as small circles on its corders
            if(that.selectedRect!=null){

                //If the selected circle is not the one which has been clicked
                // it is necessary to unselect it, by removing the rectangle and 
                // the small circles around it
                if (that.selectedCirc!=circ)
                    that.removeRectSmallCirc();
                else{
                    that.selectedRectPisitionX=that.selectedRect.attr('x');
                    that.selectedRectPisitionY=that.selectedRect.attr('y');                
                }
            }          
            //sharedEntities = that.getListOfSharedEntities(circ); 
            that.getArrayOfOverlappingCicles(circ,ArrayOfOverlappingCircles);
            console.log("Size of ArrayOfOverlappingCircles: "+ArrayOfOverlappingCircles.length)            
        };

        // drags the label and each element inside the circle along with the circle
        circ.dragmove = function(delta, event) {  
            var mm,ccx,ccy;

            /*
             var addX = -
             var addY
             if (that.labelDistanceCx>0)
             */         


            text.move(circ.attr('cx')+that.labelDistanceCx,circ.attr('cy')+that.labelDistanceCy);

            that.dragEntitiesWithCircle(that.svgElements[circlePositionInArray],delta);
            //that.dragEntitiesWithCircle(circlePositionInArray,delta,entitiesInitialPositions);       
            //that.protectSharedEntitiesInCircDragging(sharedEntities,circ);

            // drags the selected rectangle and small circles with the big circle
            if(that.selectedRect!=null)
            {
                that.selectedRect.move(that.selectedRectPisitionX+delta.x,that.selectedRectPisitionY+delta.y);

                that.circTopLeft.move(that.selectedRectPisitionX+delta.x,that.selectedRectPisitionY+delta.y);
                //that.circTopLeft.move(circ.attr('cx')-circ.attr('rx')+delta.x,that.selectedRectPisitionY+delta.y);             
                that.circTopRight.move((that.selectedRectPisitionX+delta.x+2*circ.attr('rx')),that.selectedRectPisitionY+delta.y);
                that.circBottomLeft.move(that.selectedRectPisitionX+delta.x,(that.selectedRectPisitionY+delta.y+2*circ.attr('ry')));
                that.circBottomRight.move((that.selectedRectPisitionX+delta.x+2*circ.attr('rx')),(that.selectedRectPisitionY+delta.y+2*circ.attr('ry')));     
            }

            // Moving all the overlapping circles, along with their corresponding entities
            for (mm=0; mm<ArrayOfOverlappingCircles.length;mm++)
            {                  
                if(ArrayOfOverlappingCircles[mm].svg!=circ)
                {
                    ccx = ArrayOfOverlappingCircles[mm].cx;
                    ccy = ArrayOfOverlappingCircles[mm].cy;                  
                    ArrayOfOverlappingCircles[mm].svg.attr('cx',ccx+delta.x);
                    ArrayOfOverlappingCircles[mm].svg.attr('cy',ccy+delta.y);

                    ccx = ArrayOfOverlappingCircles[mm].label.x;
                    ccy = ArrayOfOverlappingCircles[mm].label.y;                  
                    ArrayOfOverlappingCircles[mm].label.svg.move(ccx+delta.x,ccy+delta.y);
                    that.dragEntitiesWithCircle(ArrayOfOverlappingCircles[mm],delta);                        
                }     
            }
        }; 

        circ.dragend = function(delta, event) {

            //circ.draggable({minX:0,minY:0,maxX:800,maxY:600 });        
            circ.draggable();
            sharedEntities.length =0;



            //that.setTextDragLimit(text,circ.attr('cx'),circ.attr('cy'),circ.attr('rx'),circ.attr('ry'));
            // Cleanning the entitiesInitialPositions Array
            entitiesInitialPositions.length = 0;
            that.fireChangeEventsForEntitiesMovedWithCircle(circ);
            that.updateEntitiesInCircles();


            // updating  data for the OverlappingCircles (including the Entities)
            for (var mm=0; mm<ArrayOfOverlappingCircles.length;mm++)
            {
                ArrayOfOverlappingCircles[mm].cx = ArrayOfOverlappingCircles[mm].svg.attr('cx');
                ArrayOfOverlappingCircles[mm].cy = ArrayOfOverlappingCircles[mm].svg.attr('cy');  
                ArrayOfOverlappingCircles[mm].label.x = ArrayOfOverlappingCircles[mm].label.svg.attr('x');
                ArrayOfOverlappingCircles[mm].label.y = ArrayOfOverlappingCircles[mm].label.svg.attr('y');   

                for(var pp=0;pp<ArrayOfOverlappingCircles[mm].entities.length;pp++)
                {
                    ArrayOfOverlappingCircles[mm].entities[pp].transform({'x': ArrayOfOverlappingCircles[mm].entities[pp].svg.transform().x});  
                    ArrayOfOverlappingCircles[mm].entities[pp].transform({'y': ArrayOfOverlappingCircles[mm].entities[pp].svg.transform().y});
                } 

            // firing the changeEvent for each circles dragged along, as well as for 
            // all the elements that are inside each one of these circles            

            divSVG = that.svgDiv;    
            var circIntegration2 = that.createObjectForEvent (1, ArrayOfOverlappingCircles[mm].svg, ArrayOfOverlappingCircles[mm].label.svg);     
            var customevEnt = $.Event('ChangeCircle', { 'detail': circIntegration2 });             
            // divSVG.dispatchEvent(customevEnt);            
            $(divSVG).trigger(customevEnt);

            that.fireChangeEventsForEntitiesMovedWithCircle(ArrayOfOverlappingCircles[mm].svg);  

            // updating the draggin limits for the circle's label
            var xCirc = ArrayOfOverlappingCircles[mm].svg.attr('cx');
            var yCirc = ArrayOfOverlappingCircles[mm].svg.attr('cy');
            var rxCirc = ArrayOfOverlappingCircles[mm].svg.attr('rx');
            var ryCirc = ArrayOfOverlappingCircles[mm].svg.attr('ry');
            that.setTextDragLimit(ArrayOfOverlappingCircles[mm].label.svg,xCirc,yCirc,rxCirc,ryCirc);
            }        
            ArrayOfOverlappingCircles.length=0;
        };

        // creating an object which is then passed to the other componets through events
        // this circle object should contain information about the circle and the label
        // this event is only created when the user creats the circle (ev!=null) and 
        // not when the circle is created from the data which is stored in the database (ev==null)
        if (ev!=null)
        {
            var circIntegration = this.createObjectForEvent (1, circ, text);     
            var customevEnt = $.Event('AddCircle', { 'detail': circIntegration });          
            divSVG = this.svgDiv;    
            //divSVG.dispatchEvent(customevEnt);
            $(divSVG).trigger(customevEnt);
        }       

        this.updateEntitiesInCircles();

        return circ.attr('id');
    }


    ,getArrayOfOverlappingCicles : function(circ,ArrayOfOverlappingCircles)
    {
        var i,j,k,ent,pos,m,inserted;

        for(i=0;i<this.svgElements.length;i++) 
        {
            console.log("Searching svgElements position: "+i)

            if(this.svgElements[i].svg==circ) // the cirrent circle is found         
            {

                //Each entity of this circle is searched in other circles
                console.log("found current circle")
                for (j=0;j<this.svgElements[i].entities.length;j++)
                {   console.log("checking entity at position: "+j)
                    ent = this.svgElements[i].entities[j].svg;
                    for(k=0;k<this.svgElements.length;k++)
                    {
                        // if the entity is in other circles and has not been 
                        // inserted into the ArrayOfOverlappingCircles, then it iss added
                        console.log("Trying to find that entity at circle: "+k)
                        if((k!=i)&&(this.isEntityInACircleInArray(k,ent)!=-1))
                        {
                            console.log("found new circle!")
                            inserted = false; 
                            for (m=0;m<ArrayOfOverlappingCircles.length; m++)
                            { 
                                if(ArrayOfOverlappingCircles[m].svg==circ)
                                { 
                                    inserted = true;                               
                                    break;
                                }  
                            } 
                            if(!inserted)
                            {  
                                ArrayOfOverlappingCircles.push(this.svgElements[k]);
                                console.log("added")
                            }  
                        }
                    }           
                } 
                ArrayOfOverlappingCircles.push(this.svgElements[i]);  
                break;  
            } 
        }


        var ArrayOfCirclesWithAnEntity,changed,sizeArray;    
        do{
            changed=false;

            sizeArray = ArrayOfOverlappingCircles.length;
            for(i=0;i<sizeArray;i++)
            {
                for(j=0;j<ArrayOfOverlappingCircles[i].entities.length;j++)
                {
                    ent = ArrayOfOverlappingCircles[i].entities[j].svg;
                    ArrayOfCirclesWithAnEntity = this.getArrayOfCirclesWithAnEntity(ent)


                    for(k=0;k<ArrayOfCirclesWithAnEntity.length;k++)
                    {
                        if (!this.member(ArrayOfCirclesWithAnEntity[k].svg,ArrayOfOverlappingCircles))
                        {
                            ArrayOfOverlappingCircles.push(ArrayOfCirclesWithAnEntity[k]);
                            sizeArray++;
                            changed = true;
                        }  
                    }   
                }   
            }   

        }while(changed);               
    }

    ,getArrayOfCirclesWithAnEntity : function(ent)
    {
        var i,j;
        var ArrayOfCirclesWithAnEntity= new Array();

        for(i=0;i<this.svgElements.length;i++)
        {
            for(j=0;j<this.svgElements[i].entities.length;j++)
            {
                if(this.svgElements[i].entities[j].svg==ent)
                {
                    ArrayOfCirclesWithAnEntity.push(this.svgElements[i])
                    break;
                }   
            }   
        }  
        return ArrayOfCirclesWithAnEntity;
    }

    ,member : function(element,arrayOfElements)
    {
        var i;
        var result = false;

        for(i=0; i<arrayOfElements.length;i++)
        {
            if(arrayOfElements[i].svg==element)
            {  
                result = true;
                break;
            }  
        }  
        return result;  
    }


    ,fireChangeEventsForEntitiesMovedWithCircle : function(circ)
    {
        var i,j,numberOfEntities,entIntegration,customevEnt;
        var divSVG = this.svgDiv;    

        for(i=0;i<this.svgElements.length;i++)
        {  

            if(this.svgElements[i].svg == circ)
            {
                numberOfEntities = this.svgElements[i].entities.length;
                for(j=0;j<numberOfEntities;j++)
                { 
                    entIntegration = this.createObjectForEvent(3,
                        this.svgElements[i].entities[j].svg, null);     
                    customevEnt = $.Event('ChangeEntity', { 'detail': entIntegration });             
                    //divSVG.dispatchEvent(customevEnt);
                    $(divSVG).trigger(customevEnt);
                }                 
            }
        }
    }


    ,protectSharedEntitiesInCircDragging : function(sharedEntities,circ)
    {
        //alert("Inside")

        var limitX, limitY; 
        for (i=0;i<sharedEntities.length;i++)
        {
            limitX = sharedEntities[i].transform().x + 25; // half width of an entity
            limitY = sharedEntities[i].transform().y + 25; // half height of an entity


            //limitX = sharedEntities[i].attr('x') ;
            //limitY = sharedEntities[i].attr('y');

            if(!this.insideCircle(limitX,limitY,circ))
            {
                alert("found!!")
                //circ.fixed();
            }  

        //alert("Entrou no protect. Shared: "+sharedEntities.length + " limitX "+ 
        //  limitX + " limitY " + limitY + " cx "+ circ.attr('cx') + " cy " + circ.attr('cy'));    
        }       
    }


    /*
     var cx = x+this.draggedEntity.attr('width')/2;
     var cy = y+this.draggedEntity.attr('height')/2;

     **/

    ,drawTag : function(xCirc,yCirc,x,y,initialLabelText,rxCirc,ryCirc)
    {

        console.log("DRAW TAG!!!!") 
        var text = this.draw.text(initialLabelText);

        text.move(x,y);

        // When the user clicks on the SVG text, the SVG text is edited:
        // (1) A Foreign object is created (HTML textarea) 
        // (2) This textarea replaces the SVG text
        var that = this;
        text.click(function() {

            if (that.currentLabel!=null && that.currentLabel!=text)
                that.unselectLabel();

            // if this click event was triggered from a drag and drop of the label
            // no text are should be found. when compairing the current text position
            // with the one it had from the dragstart event, one can know whether or 
            // not this is a drag event          

            var difX = that.draggedLabelInitialX-text.attr('x');
            var difY = that.draggedLabelInitialY-text.attr('y');    

            difX= that.truncateDecimals(difX,0);    
            difY= that.truncateDecimals(difY,0);              

            if(difX==0 && difY==0)  // If the coordinates of the Label did not change...
                // the Label has been clicked. The corresponding textarea is shown
                {
                    var labelText = text.content;
                    that.currentLabel = text; 
                    that.insideLabel=1; // to say that the text is being edited

                    /*text.hide();  // hiding the current SVG text                                      

                     var newText=prompt('Please Enter the concept',text.content);
                     that.currentLabel = newText; 
                     text.content=newText;
                     */
                    var newText=prompt('Please enter the Concept',text.content);
                    if(newText!=null)
                        that.currentLabel.text(newText);               




                    // replacing the SVG Text with the HTML textarea (foreignobject)
                    /*
                     console.log("Creating foreignObject !!!")
                     var fobj = that.draw.foreignObject(200,100).attr({id: 'fobj'})
                     fobj.appendChild("textarea", {id: 'mytextarea', rows:'4', cols:'15',innerHTML: labelText})
                     fobj.move(that.currentLabel.attr('x'),that.currentLabel.attr('y'));
                     */

                    // To say that the mouse is outside the textare
                    // thus, if the user clicks outside the textarea, the textarea 
                    // content is inserted into the SVG text
                    // this is done so that the dragging function can work smothly
                    that.currentLabel.mouseout(function() { 
                        that.insideLabel=0;
                    }) 

                // that.currentFobj=fobj;            
                } 
                // getting the id of the circle that contains the Label
                var circL = null;
                for(var i=0;i<that.svgElements.length;i++)
                {
                    if(that.svgElements[i].label.svg== text)  
                    {  
                        circL = that.svgElements[i].svg
                        console.log("Circle found!!!")
                        break;
                    }  
                }                       

                //Firing the ChangeCircle event (due to change on the label position)
                var divSVG = that.svgDiv;    
                var entIntegration = that.createObjectForEvent(1,circL,text);     
                var customevEnt = $.Event('ChangeCircle', { 'detail': entIntegration });             
                //divSVG.dispatchEvent(customevEnt);
                $(divSVG).trigger(customevEnt);
                console.log("Change circle fired!");            
        });

        // The label is draggable but not too far away from the circle
        this.setTextDragLimit(text,xCirc,yCirc,rxCirc,ryCirc);    

        text.dragstart=function() {
            that.draggedLabelInitialX = text.attr('x');
            that.draggedLabelInitialY = text.attr('y');
        }

        return text;
    }


    ,setTextDragLimit : function(text,xCirc,yCirc,rxCirc,ryCirc)
    {
        var minDragX = xCirc-(rxCirc+70);
        var minDragY = yCirc-(ryCirc+70);
        var maxDragX = xCirc+(rxCirc+70);
        var maxDragY = yCirc+(ryCirc+70);  
        text.draggable({minX:minDragX,minY:minDragY,maxX:maxDragX,maxY:maxDragY });
    }


    ,clickEntity : function(ent,event)
    {        
        var xIm = ent.transform().x;
        var yIm = ent.transform().y;

        // 50 is width/height of an entity
        var rect = this.draw.rect(50+5,50+5).attr({ fill: 'none' }).stroke({ width: 0.5,color:'blue' });
        rect.attr({ x: xIm, y: yIm });
        this.selectedEntity = ent;
        this.selectedEntityRect = rect;

        // If there any circle is selected(this.selectedRect), this circle is unselected
        // by removing unselecting the corresponding label (if it is selected) 
        // and by removing the small circle, no matter if the user clicked 
        // in an entity which is inside the circle
        if(this.selectedRect!=null)
        {
            if (this.insideLabel!=0)
                this.unselectLabel(); 
            this.removeRectSmallCirc() 
        }  

        // Firing the ClickEntity event only when the entity is clicked (not dragged)       
        // If the entity was not dragged but only clicked on...
        // the ClickEntity event is fired

        var difX = this.draggedEntityInitialX-ent.transform().x;
        var difY = this.draggedEntityInitialY-ent.transform().y;

        difX= this.truncateDecimals(difX,0);    
        difY= this.truncateDecimals(difY,0);              

        if(difX==0 && difY==0)  // If the coordinates of the entity did not change...
        // the entity has been clicked. the corresponding event is fired
        {  
            var divSVG = this.svgDiv;          
            var entIntegration = this.createObjectForEvent(3,ent, null);             
            var customevEnt = $.Event('ClickEntity', { 'detail': entIntegration });             
            //divSVG.dispatchEvent(customevEnt);              
            $(divSVG).trigger(customevEnt);
            console.log('ClickEntity Triggered ')       
        } 
    }


    ,truncateDecimals : function (number, digits) {
        var multiplier = Math.pow(10, digits),
        adjustedNum = number * multiplier,
        truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

        return truncatedNum / multiplier;
    }

    ,loadOrganizeCanvas : function(divID)
    {
        //divID= "bitsandpeaces"; // REMOVE XXXX!!!!!!!

        // Setting global variables for Left and right
        //  offset for the main svg canvas (this.svgDiv)
        if( typeof divID === 'string' )
            this.svgDiv = document.getElementById(divID);
        else 
            this.svgDiv = divID;

        //Creating the SVG canvas and seting its event handlers 

        this.draw = SVG(divID); // the SVG canvas 
        var that = this;
        this.draw.click(function(event){
            that.unselectCircAndLabel(event);
        });
        this.draw.dblclick(function(event){
            that.canvasDoubleClick(event);
        });
        //this.draw.dblclick(this.test);
        this.draw.mouseup(function(event){
            that.canvasMouseUp(event);
        });
        this.draw.mousedown(function(event){
            that.unselectAllForDraggingEvent(event);
        });

        //Setting the kedown even (for deleting circles and entities)
        // this is achieved using jQuery
        //$('#bitsandpeaces').bind('keydown', function(event) {           
        $(this.svgDiv).bind('keydown', function(event) {                      
            that.removeCircleAndEntity(event);
        });              
    }



    ,updateEntitiesInCircles : function()
    {
        var i,j,k,ent,x,y;

        // checking if entities that are inside the cricles, are now 
        // inside or outside other circles  

        for(i=0;i<this.svgElements.length;i++)
        {  
            numberOfEntities = this.svgElements[i].entities.length;
            for(j=0;j<numberOfEntities;j++)
            { 
                ent = this.svgElements[i].entities[j].svg; 
                // x and y store the coordinates of the center of the entity(image)
                x = ent.transform().x + 25; // half width of an entity
                y = ent.transform().y + 25; // half height of an entity


                // Remove from the Entity list of a circle
                // all the elements which are now outside the circle are, 
                // after the circle has been dragged
                if(!this.insideCircle(x,y,this.svgElements[i].svg)) 
                {
                    this.svgElements[i].entities.splice(j,1);  
                    j--;
                    numberOfEntities--;

                    // alert("Removeu. i = "+i+" j = "+j +" numberOfEntities: "+numberOfEntities + 
                    //     " x = "+x+" y= "+y+" cx = "+this.svgElements[i].svg.attr('cx')+" cy = "+this.svgElements[i].svg.attr('cy')+
                    // " rx = "+this.svgElements[i].svg.attr('rx')+" ry = "+this.svgElements[i].svg.attr('ry'));
                }  

            // Adds the Entity to the entity list of every circle
            // inside of which the entity is now  
            // after the circle has been dragger

            for(k=0;k<this.svgElements.length;k++)
            {   

                if(this.insideCircle(x,y,this.svgElements[k].svg) && (this.isEntityInACircleInArray(k,ent)==-1))
                {
                    this.svgElements[k].entities.push(this.newEntity(x,y,ent));                      
                }                        
            }   
            }   
        }  
        // checking if entities that were outside circles, are now inside anyone

        var OutsideListSize = this.outsideCircleElements.length;
        for(i=0;i<OutsideListSize;i++)
        {  var added= false;
            ent = this.outsideCircleElements[i];
            x = ent.transform().x + 25; //half width of an entity
            y = ent.transform().y + 25; //half height of an entity

            for(j=0;j<this.svgElements.length;j++)
            {  var circAdd = this.svgElements[j].svg;             
                if (this.insideCircle(x,y,circAdd))   //Add to circle
                {  
                    this.svgElements[j].entities.push(this.newEntity(x,y,ent));                      
                    added = true;
                }  
            }   
            // if the element has been added to circle than it its
            // removed form outsideCircleElements
            if (added)
            {
                this.outsideCircleElements.splice(i,1);
                OutsideListSize--;
                i--;
            }
        }             
    }

    ,newEntity : function(x,y,entSvg)
    {
        ent = new Object();
        ent.x=x;
        ent.y=y;
        ent.svg=entSvg;

        return ent;
    }


    ,getListOfSharedEntities : function(circ)
    {
        var sharedEnt = new Array();
        var i, j;

        for(i=0; i< this.svgElements.length;i++)
        {
            if(this.svgElements[i].svg==circ)  
            {
                for (j=0;j<this.svgElements[i].entities.length;j++)
                {
                    var isInOtherCirc = this.isEntityInOtherCircleInArray(this.svgElements[i].entities[j].svg,i)
                    if(isInOtherCirc)
                    {
                        //alert("Found shared")
                        sharedEnt.push(this.svgElements[i].entities[j].svg); 
                    } 

                }  
            }   
        }     
        //alert("Going to finish")
        //alert("Number of Share entities Found "+sharedEnt.length);

        return sharedEnt;   
    }


    ,isEntityInOtherCircleInArray : function(ent,posCurrentCirc)
    {
        var i;
        var result=false;

        //alert("this.isEntityInOtherCircleInArray -inicio");
        for(i=0; i<=this.svgElements.length;i++)
        {
            if ((i!=posCurrentCirc) && (this.isEntityInACircleInArray(i,ent)!=-1)) 
            {
                result = true;
                break;
            }   
        }   
        // alert("this.isEntityInOtherCircleInArray -FIM: "+result);
        return result;
    }



    /*dragEntitiesWithCircle : function(circlePositionInArray,delta,entitiesInitialPositions)
     {    
         var x;
         var y;

         for (var i=0; i<this.svgElements[circlePositionInArray].entities.length;i++)
         {
             x = entitiesInitialPositions[i].x + delta.x;
             y = entitiesInitialPositions[i].y + delta.y;

             this.svgElements[circlePositionInArray].entities[i].svg.move(x,y);
             this.svgElements[circlePositionInArray].entities[i].x = x;
             this.svgElements[circlePositionInArray].entities[i].y = y;
}
}*/

    ,dragEntitiesWithCircle : function(objectInSvgElementsArray,delta)
    {    
        var x;
        var y;

        for (var i=0; i<objectInSvgElementsArray.entities.length;i++)
        {
            x = objectInSvgElementsArray.entities[i].x + delta.x;
            y = objectInSvgElementsArray.entities[i].y + delta.y;

            objectInSvgElementsArray.entities[i].svg.move(x,y);
            //this.svgElements[circlePositionInArray].entities[i].x = x;
            //this.svgElements[circlePositionInArray].entities[i].y = y;
        }
    }


    ,addCircleIntoArray : function(circ, label) 
    {         
        circ1=new Object(); 

        circ1.cx = circ.attr('cx');
        circ1.cy = circ.attr('cy'); 
        circ1.rx = circ.attr('rx'); 
        circ1.ry = circ.attr('ry'); 
        circ1.svg = circ; 
        circ1.label = new Object(); 
        circ1.label.x = label.attr('x'); 
        circ1.label.y = label.attr('y'); 
        circ1.label.content = label.content; 
        circ1.label.svg= label;     
        circ1.entities = new Array();

        var pos = this.svgElements.push(circ1) - 1;      
        return pos;
    } 

    ,addEntityIntoCircleInArray : function(entity, circle, pos) 
    {   
        entity.next = this.svgElements[pos].entities;
        this.svgElements[i].entities=entity;
    } 


    ,removeCircleFromArray : function(circ) 
    {
        // removing all entities from the circle

        var i,j;
        for (i=0;i<this.svgElements.length;i++)
        {  
            if (this.svgElements[i].svg==circ) // finds the circle in array
            {          
                var numberOfEntities = this.svgElements[i].entities.length;  
                for(j=0;j<numberOfEntities;j++) // finds all entities
                {
                    var ent = this.svgElements[i].entities[0].svg;
                    this.svgElements[i].entities.splice(0,1);
                    // If the entity is not inside any other circle
                    // then it should be removed from the screen

                    if (!this.isEntityInAnyCircleInArray(ent))
                    {   
                        // triggers an event stating that the entity is about to be removed

                        var entIntegration = this.createObjectForEvent (3, ent, null); //for selected circle and text     
                        var customevEnt = $.Event('RemoveEntity', { 'detail': entIntegration });          
                        var divSVG = this.svgDiv;    
                        //divSVG.dispatchEvent(customevEnt); 
                        $(divSVG).trigger(customevEnt);
                        ent.remove(); // removes the entity from the screen                                  
                    }
                }  
                this.svgElements.splice(i,1);  //removing circle form array
                break;
            }  
        }
    } 

    ,removeEntityFromCircleInArray : function(arrayPos, ent) 
    {
        var i;

        for(i=0; i<this.svgElements[arrayPos].entities.length;i++)
        {  
            if(this.svgElements[arrayPos].entities[i].svg==ent)
            {   
                this.svgElements[arrayPos].entities.splice(i,1); 
                //break;
            }  
        }
    }   

    ,removeEntityFromAllCircles : function(ent) 
    {
        var i;

        for(i=0; i<this.svgElements.length;i++)
        {  
            this.removeEntityFromCircleInArray(i, ent)

        }
    }


    ,isEntityInACircleInArray : function(arrayPos,ent) 
    {
        //alert("Entered this.isEntityInACircleInArray")
        var i,result = -1;
        for(i=0; i<this.svgElements[arrayPos].entities.length;i++)
        {          
            if(this.svgElements[arrayPos].entities[i].svg==ent)
            {
                result=i;
                break;
            }     
        }  
        //alert("Exiting sEntityInACircleInArray. result: "+result);
        return result;
    }


    ,isEntityInAnyCircleInArray : function(ent) 
    {
        var i,result = false;
        for(i=0; i<this.svgElements.length;i++)
        {
            if (this.isEntityInACircleInArray(i,ent)!=-1)
            {  
                result = true;
                break;
            }   
        }
        return result;
    } 



    ,insideCircle : function(x,y,circ)
    {
        var cx = circ.attr('cx');
        var cy = circ.attr('cy');
        var rx = circ.attr('rx');
        var ry = circ.attr('ry');

        var inside = Math.pow(((x-cx)/rx),2) + Math.pow(((y-cy)/ry),2);
        if(inside<=1){
            //alert("Inside");
            return true;
        }
        else{
            //alert("Outside");
            return false;
        }
    }


    ,canvasMouseUp : function(event)
    {
        var divSVG = this.svgDiv;    

        if(this.resizingCircle)
        {                  
            var circIntegration = this.createObjectForEvent (1, this.selectedCirc, this.selectedLabel);     
            var customevEnt = $.Event('ChangeCircle', { 'detail': circIntegration });             
            //divSVG.dispatchEvent(customevEnt);
            $(divSVG).trigger(customevEnt);

            divSVG.onmousemove=null;  
            this.updateEntitiesInCircles();
            this.resizingCircle = false;
        }       


        if (this.isDraggingEntity!=0)
        {
            var entIntegration = this.createObjectForEvent(3,this.draggedEntity, null);     
            var customevEnt = $.Event('ChangeEntity', { 'detail': entIntegration });             
            //divSVG.dispatchEvent(customevEnt);
            $(divSVG).trigger(customevEnt);

            this.dropElement(); // will then set isDraggingEntity to 0


        }   

        if(this.isDraggingCircle==1)
        {
            var circIntegration = this.createObjectForEvent (1, this.draggedCircle, this.draggedText);     
            var customevEnt = $.Event('ChangeCircle', { 'detail': circIntegration });             
            //divSVG.dispatchEvent(customevEnt);
            $(divSVG).trigger(customevEnt);

            this.isDraggingCircle=0
        } 
    }


    ,createEntity: function(entity) {
        var group = this.draw.group();
        group.image(entity.imageURL, 50, 50)        
        group.transform({ x: entity.x, y: entity.y });
        group.attr({'class' : 'labelable'});
        console.log('entity', entity);
        group.text(function(add) {
            add.tspan(entity.label?entity.label:"").dy(60);
        });
        return group;

    }
    ,createAndDropSvgEntity : function(ousideEntity)
    {
        // Creating the entity
        var ent = this.createEntity(ousideEntity);
        ent.draggable();
        var that = this;
        ent.dragstart=function() {
            that.isDraggingEntity=1;
            that.draggedEntity=ent;

            // used to differentiate a click on an entity from a 
            // drag and drop operation. If draggedEntityInitialX or 
            // draggedEntityInitialY are different from the current position of 
            // of entity in in the clickEntity method,than theelement was gragged
            // otherwise, it was just clicked
            that.draggedEntityInitialX = ent.transform().x;
            that.draggedEntityInitialY = ent.transform().y;
        };
        ent.click(function() {
            var divSVG = that.svgDiv;    
            divSVG.focus();
            that.clickEntity(ent);
        });

        // Dropping the entity
        this.draggedEntity = ent;  
        this.isDraggingEntity = 2;
        this.dropElement(); 

        // Firing the event about the creation of a new entity
        var circIntegration = this.createObjectForEvent (3, ent, null);     
        var customevEnt = $.Event('AddEntity', { 'detail': circIntegration });          
        var divSVG = this.svgDiv;    
        // divSVG.dispatchEvent(customevEnt); 
        $(divSVG).trigger(customevEnt);

        return ent.attr('id');  
    }

    ,dropElement : function()
    {
        var x = this.draggedEntity.transform().x;
        var y = this.draggedEntity.transform().y;
        var dropedInCircle=false;

        // the image will only be considered inside a circle,  
        //  if its center is inside the circle
        var cx = x+25; // half width of an entity
        var cy = y+25; // half height of an entity

        var ent;

        if (this.isDraggingEntity!=0) // an entity is being dragged
        {      
            // looks for every circle where the entity is being dropped
            for(var i=0; i<this.svgElements.length;i++)
            {
                // if the entity is being dropped within this circle...
                if(this.insideCircle(cx,cy,this.svgElements[i].svg))
                {
                    dropedInCircle = true;  
                    if(this.isEntityInAnyCircleInArray(this.draggedEntity))  
                    {     
                        // remove the entity from all other circles it is not positioned 
                        // inside of anymore
                        for(var ii=0; ii<this.svgElements.length; ii++)
                        {
                            if ((this.isEntityInACircleInArray(ii,this.draggedEntity)!=-1) &&(!this.insideCircle(cx,cy,this.svgElements[ii].svg)))
                            {
                                this.removeEntityFromCircleInArray(ii,this.draggedEntity);   
                            }
                        }                 

                    }  

                // the entity is added to the circles element list
                // but only if it is not already there
                if (this.isEntityInACircleInArray(i,this.draggedEntity)==-1)
                {
                    ent = this.newEntity(x,y,this.draggedEntity)
                    this.svgElements[i].entities.push(ent);
                }
                } 
            }       

        // If the entity is not dropped inside any circle, than it is added to the 
        // List of outsideCircleElements
        if(!dropedInCircle)
        {  
            this.outsideCircleElements.push(this.draggedEntity);
            for(var i=0; i<this.svgElements.length;i++)
            {
                this.removeEntityFromAllCircles(this.draggedEntity);  
            }
        }   
        else
            if(dropedInCircle && this.isMemberOfOutsideCircleElements(this.draggedEntity))        
                this.removeFromOutsideCircleElements(this.draggedEntity)

            //updating the coordenates of the Entity in the svgElements
            this.updateDraggedEntityProperties();

            this.isDraggingEntity=0;
            this.draggedEntity=null;      
        }           
    }


    ,updateDraggedEntityProperties :  function()
    {

        var i,j;
        var ent = this.draggedEntity;

        for(i=0; i<this.svgElements.length;i++)
        {
            for(j=0; j<this.svgElements[i].entities.length;j++)
            {          
                if(this.svgElements[i].entities[j].svg == ent)
                {
                    this.svgElements[i].entities[j].x = ent.transform().x;
                    this.svgElements[i].entities[j].y = ent.transform().y;
                }  
            }
        }
    }


    ,removeFromOutsideCircleElements :  function(ent)
    {
        var i;

        for(i=0;i<this.outsideCircleElements.length;i++)
        {
            if(this.outsideCircleElements[i]==ent)
            {   
                this.outsideCircleElements.splice(i,1)  
                break;
            } 
        }      
    }

    ,isMemberOfOutsideCircleElements :  function(ent)
    {
        var i;
        var result = false;

        for(i=0;i<this.outsideCircleElements.length;i++)
        {
            if(this.outsideCircleElements[i]==ent)
            {   
                result = true 
                break;
            } 
        }      
        return result;
    }

    ,clearCanvas :  function()
    {
        this.draw.clear();
        this.svgElements.length=0;
        this.outsideCircleElements.length=0
    }
};
