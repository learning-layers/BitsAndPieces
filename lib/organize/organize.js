var Organize = function(){
 // GLOBAL VARIABLES...
 
 Organize.prototype.draw = null; // the SVG canvas
 Organize.prototype.selectedRect=null;
 Organize.prototype.xRect = null;
 Organize.prototype.yRect=null;
 
 Organize.prototype.selectedCirc=null;
 Organize.prototype.selectedLabel=null;
 Organize.prototype.selectedRectPisitionX=0;
 Organize.prototype.selectedRectPisitionY=0; 
 Organize.prototype.selectedEntity = null;
 Organize.prototype.selectedEntityRect = null; 
 Organize.prototype.currentLabel=null; 
 Organize.prototype.draggedLabelInitialX=0;
 Organize.prototype.draggedLabelInitialY=0;
 
 Organize.prototype.currentFobj = null;
 Organize.prototype.insideLabel=0;
 Organize.prototype.labelDistanceCx=0;
 Organize.prototype.labelDistanceCy=0;
 Organize.prototype.labelCounter=0;
 Organize.prototype.svgElements = new Array();
 Organize.prototype.outsideCircleElements = new Array();
 
 Organize.prototype.isDraggingEntity=0; //(0 - not dragging; 1 - dragging from
                        //inside SVG canvas; 2 - dragging from outside the SVG canvas)
 Organize.prototype.draggedEntity = null;
 Organize.prototype.draggedEntityInitialX = -1;
 Organize.prototype.draggedEntityInitialY = -1;
 Organize.prototype.isDraggingCircle=0;
 Organize.prototype.draggedCircle=null;
 Organize.prototype.draggedText=null;
 Organize.prototype.resizingCircle = false;
 Organize.prototype.svgDivID = null;
 
 	// constants to identify the border circles which was clicked
 Organize.prototype.TOPLEFT = 1
 Organize.prototype.TOPRIGHT = 2
 Organize.prototype.BOTTOMLEFT = 3
 Organize.prototype.BOTTOMRIGHT = 4
 
 // variables corresponding to each border circles
 
 Organize.prototype.circTopLeft = null;
 Organize.prototype.circTopRight = null;
 Organize.prototype.circBottomLeft = null;
 Organize.prototype.circBottomRight = null;
 
 // Left and right offset for the main svg canvas (Organize.prototype.svgDivID)
 // The valuea are set after loading the bitsandpieces div
 //int the loadOrganizeCanvas method
 
 Organize.prototype.LEFTOFFSET = 0;
 Organize.prototype.TOPOFFSET = 0;

};
 
 
Organize.prototype.clickOutside = function(event)
{	
	//Organize.prototype.test1();
        Organize.prototype.updateOffsets();
        if ( (Organize.prototype.selectedRect==null)||(((event.pageX-Organize.prototype.LEFTOFFSET)>=Organize.prototype.selectedRect.attr('x'))  &&  
		 ((event.pageX-Organize.prototype.LEFTOFFSET)<= (Organize.prototype.selectedRect.attr('x') + 2*Organize.prototype.selectedCirc.attr('rx'))+3) && 
		 ((event.pageY-Organize.prototype.TOPOFFSET)>=Organize.prototype.selectedRect.attr('y'))  && 
		 ((event.pageY-Organize.prototype.TOPOFFSET)<= (Organize.prototype.selectedRect.attr('y') + 2*Organize.prototype.selectedCirc.attr('ry'))+3)))	
        	return 0; //inside 
	else
		return 1; //outside	
}


 Organize.prototype.createObjectForEvent = function(type, element1, text1)
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
                element = Organize.prototype.selectedCirc; 
                text = Organize.prototype.selectedLabel;
                break;
            }
          case 3:// entity is passed as parameter
            {
                element = element1; 
                break;
            }
          case 4 :// entity is a global variable
            {
                element = Organize.prototype.selectedEntity; 
                break;
            }
       }    
           

    Organize.prototype.updateOffsets();
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
        entityIntegration.x = element.attr('x');
        entityIntegration.y = element.attr('y');  
        result = entityIntegration;        
     }       
     
    return result;
 }           
 

Organize.prototype.removeCircleAndEntity = function(event)
{
  var customevEnt, divSVG; 
    
    if (event.keyCode==8 || event.keyCode==46) // if bakspace (8) or delete (46) keys are pressed
     {
        if (Organize.prototype.selectedCirc!=null) // delete selected circle
            { 
                
    // creating an object which is then passed to the other componets through events
    // this circle object should contain information about the circle and the label
    
                var circIntegration = Organize.prototype.createObjectForEvent (2, null, null); //for selected circle and text     
                customevEnt = $.Event('RemoveCircle', { 'detail': circIntegration });          
                divSVG = document.getElementById(Organize.prototype.svgDivID);    
                //divSVG.dispatchEvent(customevEnt);                
                $(divSVG).trigger(customevEnt);
                
                Organize.prototype.removeCircleFromArray(Organize.prototype.selectedCirc); 
                Organize.prototype.selectedCirc.remove();
                Organize.prototype.selectedLabel.remove();
		Organize.prototype.removeRectSmallCirc();
                Organize.prototype.labelCounter--;           
            }
        if (Organize.prototype.selectedEntity!=null)    
            {
               var entIntegration = Organize.prototype.createObjectForEvent (4, null, null); //for selected circle and text     
               customevEnt = $.Event('RemoveEntity', { 'detail': entIntegration });          
               divSVG = document.getElementById(Organize.prototype.svgDivID);    
               //divSVG.dispatchEvent(customevEnt);                
                $(divSVG).trigger(customevEnt);

               Organize.prototype.removeEntityFromAllCircles(Organize.prototype.selectedEntity);
               Organize.prototype.selectedEntity.remove(); 
               Organize.prototype.selectedEntityRect.remove();
            }
     }
}

Organize.prototype.removeRectSmallCirc = function()
{	
	Organize.prototype.selectedRect.remove();
	Organize.prototype.circTopLeft.remove();
	Organize.prototype.circTopRight.remove();
	Organize.prototype.circBottomLeft.remove();
 	Organize.prototype.circBottomRight.remove();		
			
	Organize.prototype.selectedCirc=null
        Organize.prototype.selectedLabel=null;
	Organize.prototype.selectedRect = null;
	Organize.prototype.circTopLeft = null;
	Organize.prototype.circTopRight = null;
	Organize.prototype.circBottomLeft = null;
 	Organize.prototype.circBottomRight = null;
		
}

Organize.prototype.unselectLabel = function()
{
    if (Organize.prototype.currentLabel!=null)
       {
          
        // getting the id of the circle that contais the CurrentLabel
        var circ = null;
        for(var i=0;i<Organize.prototype.svgElements.length;i++)
         {
           if(Organize.prototype.svgElements[i].label.svg== Organize.prototype.currentLabel)  
             {  
               circ = Organize.prototype.svgElements[i].svg
               console.log("Circle found!!!")
               break;
             }  
         }   
      /*   
         
        // the foreign object HTML text are content is placed inside 
        // the SVG text
        var n = Organize.prototype.currentFobj.getChild(0);
        var newTextLabel=n.value;
        Organize.prototype.currentLabel.show();
        Organize.prototype.currentLabel.text(newTextLabel);
        Organize.prototype.currentFobj.remove();
        Organize.prototype.currentFobj=null;       
       */  
         
        //Firing the ChangeCircle event (due to eventual change on the label)
        var divSVG = document.getElementById(Organize.prototype.svgDivID);    
        var entIntegration = Organize.prototype.createObjectForEvent(1,circ, 
                                            Organize.prototype.currentLabel);     
        var customevEnt = $.Event('ChangeCircle', { 'detail': entIntegration });             
        //divSVG.dispatchEvent(customevEnt);
        $(divSVG).trigger(customevEnt);
        console.log("Change circle fired!");
        
        // reseting the currentLabel
        Organize.prototype.currentLabel=null;          
        
       }
}

Organize.prototype.unselectAllForDraggingEvent = function()
{
    Organize.prototype.unselectEntity();   

  if (Organize.prototype.selectedRect!=null) 
      {      
           // Removes small circles
      // Organize.prototype.removeRectSmallCirc();
      }           
        // If there is any selected ring label (Organize.prototype.insideLabel) then stop editing it
   if (Organize.prototype.insideLabel==0)                      
       Organize.prototype.unselectLabel();
      
}


Organize.prototype.unselectEntity = function()
{
  if (Organize.prototype.selectedEntity!=null)    
   {
      Organize.prototype.selectedEntity=null; 
      Organize.prototype.selectedEntityRect.remove();
      Organize.prototype.selectedEntityRect=null;
   }  
   
}


Organize.prototype.unselectCircAndLabel = function(event)
{
        

        // If there is any selected ring label (Organize.prototype.insideLabel) then stop editing it
      if (Organize.prototype.insideLabel==0)                      
            Organize.prototype.unselectLabel();
         
         // if users clicks outside the rectangle, then remove small circles
	if(Organize.prototype.clickOutside(event))
          {
            Organize.prototype.removeRectSmallCirc();
          }             
} 

Organize.prototype.stylySmallCircle = function(circ, type)
{
	switch (type)
	{
            case Organize.prototype.TOPLEFT:{ circ.style('cursor', 'nw-resize');break;}
            case Organize.prototype.TOPRIGHT:{ circ.style('cursor', 'ne-resize');break;}
            case Organize.prototype.BOTTOMLEFT:{ circ.style('cursor', 'sw-resize');break;}
            case Organize.prototype.BOTTOMRIGHT:{ circ.style('cursor', 'se-resize');break;}
	}
	
} 


Organize.prototype.drawSmallCircle = function(X,Y,bigCirc,bigRect,idSmallCic)
{

        var xMouseDown,yMouseDown,initialRectXSize;
        var initialRectYSize,initialRectX,initialRectY;         

        var circ = Organize.prototype.draw.circle(10).attr({ fill: 'blue' }).stroke({ width: 0.3 });
	circ.attr({ cx:X,cy:Y});
	circ.on('mousedown', function(event) {
		
		xMouseDown = event.pageX;
		yMouseDown = event.pageY;
		initialRectXSize = bigRect.attr('width');
		initialRectYSize = bigRect.attr('height');
		initialRectX = bigRect.attr('x');
		initialRectY = bigRect.attr('y');         

           Organize.prototype.labelDistanceCx=-( Organize.prototype.selectedCirc.attr('cx')- 
                                            Organize.prototype.selectedLabel.attr('x'));
           Organize.prototype.labelDistanceCy=-( Organize.prototype.selectedCirc.attr('cy')- 
                                            Organize.prototype.selectedLabel.attr('y'));

                
		
		document.getElementById(Organize.prototype.svgDivID).onmousemove= function(event) {	
		
			// Resizing the rectangle
                        
		Organize.prototype.resizingCircle = true; // this is usefull for the onmouseup event to stop
                                       //resizing the circle while moving the mouse
		var newRectXsize = Math.abs(initialRectXSize + (event.pageX-xMouseDown));
		var newRectYsize = Math.abs(initialRectYSize + (event.pageY-yMouseDown));
		
		Organize.prototype.updateOffsets();		
		if ((idSmallCic==Organize.prototype.BOTTOMLEFT) || (idSmallCic==Organize.prototype.TOPLEFT))
			{
					// crossing left border starting from the left border
				if((event.pageX-Organize.prototype.LEFTOFFSET)<initialRectX) 
					{
						newRectXsize = Math.abs(initialRectXSize + Math.abs(event.pageX-Organize.prototype.LEFTOFFSET-initialRectX));
						bigRect.attr('x',(event.pageX-Organize.prototype.LEFTOFFSET));
					}
				else
					{
						newRectXsize = Math.abs(initialRectXSize + -Math.abs(event.pageX-Organize.prototype.LEFTOFFSET-initialRectX));
						// crossing right border, coming from the left border
						if (!((event.pageX-Organize.prototype.LEFTOFFSET)> (initialRectX+initialRectXSize))) 
							bigRect.attr('x',(event.pageX-Organize.prototype.LEFTOFFSET));
	
					}
			}
			
		if ((idSmallCic==Organize.prototype.TOPLEFT) || (idSmallCic==Organize.prototype.TOPRIGHT))
			{
				// crossing top border starting from the top border
				if((event.pageY-Organize.prototype.TOPOFFSET)<initialRectY)
					{
						newRectYsize = Math.abs(initialRectYSize + Math.abs(event.pageY-Organize.prototype.TOPOFFSET-initialRectY));
						bigRect.attr('y',(event.pageY-Organize.prototype.TOPOFFSET));
					}
				else // crossing bottom border starting from the top border
					{
						newRectYsize = Math.abs(initialRectYSize + -Math.abs(event.pageY-Organize.prototype.TOPOFFSET-initialRectY));
						if (!((event.pageY-Organize.prototype.TOPOFFSET)> (initialRectY+initialRectYSize)))
							bigRect.attr('y',(event.pageY-Organize.prototype.TOPOFFSET));
					}
			}			
			
		if ((idSmallCic==Organize.prototype.TOPRIGHT) || (idSmallCic==Organize.prototype.BOTTOMRIGHT))
			{
				// crossing left border starting from the right border
				if((event.pageX-Organize.prototype.LEFTOFFSET)<initialRectX) 
						bigRect.attr('x',(event.pageX-Organize.prototype.LEFTOFFSET));
			}			
	
		if ((idSmallCic==Organize.prototype.BOTTOMLEFT) || (idSmallCic==Organize.prototype.BOTTOMRIGHT))
			{
				// crossing top border starting from the bottom border
				if((event.pageY-Organize.prototype.TOPOFFSET)<initialRectY) 
						bigRect.attr('y',(event.pageY-Organize.prototype.TOPOFFSET));
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
                //Organize.prototype.setTextDragLimit(Organize.prototype.selectedLabel,bigCirc.attr('cx'),bigCirc.attr('cy'),bigCirc.attr('rx'),bigCirc.attr('ry'));
                Organize.prototype.setTextDragLimit( Organize.prototype.selectedLabel,bigCirc.attr('cx'),bigCirc.attr('cy'),bigCirc.attr('rx'),bigCirc.attr('ry'));
                
                //Setting te ew location of the Label  
                //Organize.prototype.selectedLabel.move(bigCirc.attr('cx')-30,bigCirc.attr('cy')-bigCirc.attr('ry')-30);
                Organize.prototype.selectedLabel.move(bigCirc.attr('cx')+Organize.prototype.labelDistanceCx,
                                    bigCirc.attr('cy')+Organize.prototype.labelDistanceCy);


		// Adjusting the locaton of the border circles (small circles)			
		if (Organize.prototype.circTopLeft!=null)
			{
				Organize.prototype.circTopLeft.attr('cx',bigRect.attr('x'));
				Organize.prototype.circTopLeft.attr('cy',bigRect.attr('y'))
			}

		if (Organize.prototype.circTopRight!=null)
			{
				Organize.prototype.circTopRight.attr('cx',bigRect.attr('x')+newRectXsize);
				Organize.prototype.circTopRight.attr('cy',bigRect.attr('y'))
			}

		if (Organize.prototype.circBottomLeft!=null)
			{
				Organize.prototype.circBottomLeft.attr('cx',bigRect.attr('x'));
				Organize.prototype.circBottomLeft.attr('cy',bigRect.attr('y')+newRectYsize)
			}	
			
		if (Organize.prototype.circBottomRight!=null)
			{
				Organize.prototype.circBottomRight.attr('cx',bigRect.attr('x')+newRectXsize);
				Organize.prototype.circBottomRight.attr('cy',bigRect.attr('y')+newRectYsize)
			}
              // The circle resizing stops when mouseup event is triggered 
	  }

	})
	
	Organize.prototype.stylySmallCircle(circ, idSmallCic) // stylying small circles
	return circ;
}

Organize.prototype.clickCircle = function(circ,text)
{
	// if there is another selected circle, then unselect it by 
        // removing the rectangle and small circles...
	if (Organize.prototype.selectedCirc!=null)
		Organize.prototype.removeRectSmallCirc();
	
	var radiusx = circ.attr('rx');
	var radiusy = circ.attr('ry');
	
	var x = circ.attr('cx');
	var y = circ.attr('cy');
	Organize.prototype.xRect = radiusx*2;
	Organize.prototype.yRect = radiusy*2;
	
	var im1 = Organize.prototype.draw.rect(Organize.prototype.xRect,Organize.prototype.yRect).attr({ fill: 'none' }).stroke({ width: 0.3,color:'blue' });
	im1.center(x,y);
	//im1.draggable();	
	Organize.prototype.selectedRect = im1;
	Organize.prototype.selectedCirc = circ;
        Organize.prototype.selectedLabel = text;
	
	// Drawing small circles on the corners of the rectangles
	var topLeftX = x - radiusx;
	var topLeftY = y - radiusy;
	Organize.prototype.circTopLeft = Organize.prototype.drawSmallCircle(topLeftX,topLeftY,circ,im1,Organize.prototype.TOPLEFT);
		
	var topRigtX = x + radiusx;
	var topRigtY = y - radiusy;
	Organize.prototype.circTopRight = Organize.prototype.drawSmallCircle(topRigtX,topRigtY,circ,im1,Organize.prototype.TOPRIGHT);
	
	var bottomLeftX = x - radiusx;
	var bottomLeftY = y + radiusy;
	Organize.prototype.circBottomLeft = Organize.prototype.drawSmallCircle(bottomLeftX,bottomLeftY,circ,im1,Organize.prototype.BOTTOMLEFT);
	
	var bottomRightX = x + radiusx;
	var bottomRightY = y + radiusy;
	Organize.prototype.circBottomRight = Organize.prototype.drawSmallCircle(bottomRightX,bottomRightY,circ,im1,Organize.prototype.BOTTOMRIGHT);	
                
        var divSVG = document.getElementById(Organize.prototype.svgDivID);    
        divSVG.focus();
}	


Organize.prototype.clickRect = function(rect)
{
	Organize.prototype.selectedRect = rect;
	Organize.prototype.xRect = Organize.prototype.selectedRect.attr('x');
	Organize.prototype.yRect = Organize.prototype.selectedRect.attr('y');
	
	
	document.getElementById(Organize.prototype.svgDivID).onmousemove= function(event) {	
		var newXsize = event.pageX-Organize.prototype.xRect;
		var newYsize = event.pageY-Organize.prototype.yRect;

		Organize.prototype.selectedRect.size(newXsize,newYsize);
					
	}	
}


Organize.prototype.canvasDoubleClick = function(event)
{
    
    
    if (Organize.prototype.selectedEntity==null && Organize.prototype.currentFobj==null)
        Organize.prototype.drawCircle(event,null);
   /* else
        alert ("entity double clicked")
           opens the Organize.prototype.selectedEntity with the 
           right application 
*/

}



Organize.prototype.updateOffsets = function()
{ 
  
    var el=document.getElementById(Organize.prototype.svgDivID);  
    Organize.prototype.LEFTOFFSET = $(el).offset().left;
    Organize.prototype.TOPOFFSET = $(el).offset().top;
}


Organize.prototype.test = function(event)
{    

    Organize.prototype.clearCanvas();
}

Organize.prototype.changeCircleAndLabel = function(circ,text,circIntegration)
{
  
  //circ.attr('cx',circIntegration.x+Organize.prototype.LEFTOFFSET); 
  //circ.attr('cy',circIntegration.y+Organize.prototype.TOPOFFSET);
  
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
  //text.move(circIntegration.LabelX+Organize.prototype.LEFTOFFSET,circIntegration.LabelY+Organize.prototype.TOPOFFSET);
  text.text(circIntegration.Label);
} 


Organize.prototype.drawCircle = function(ev,circIntegration0)
{ 

        var x,y,circ,text,diameter,LabelContent,xLabel,yLabel,ArrayOfOverlappingCircles;
        var divSVG;

	Organize.prototype.updateOffsets();
        ArrayOfOverlappingCircles = new Array();
        
        if(ev==null) // The ircle is added from the server data
          {
            x = circIntegration0.cx;
            y = circIntegration0.cy;

            diameter = circIntegration0.rx*2;            
               
            xLabel = circIntegration0.LabelX; 
            yLabel = circIntegration0.LabelY;;   
            
            Organize.prototype.labelCounter++;
            LabelContent = circIntegration0.Label;
            text = Organize.prototype.drawTag(x,y,xLabel,yLabel,LabelContent,circIntegration0.rx,circIntegration0.ry);  
	    circ = Organize.prototype.draw.circle(diameter).attr({ fill: 'transparent',cx: x, cy: y,
                    rx:circIntegration0.rx,ry:circIntegration0.ry}).stroke({ width: 2 });                                     
          }  
        else // The circle is added by the user
         {   
            x = ev.pageX-Organize.prototype.LEFTOFFSET;
            y = ev.pageY-Organize.prototype.TOPOFFSET;
            diameter = 200;

            xLabel = x-30;
            yLabel = y-diameter/2-30;   
            
            
            Organize.prototype.labelCounter++;
            LabelContent = "Concept "+Organize.prototype.labelCounter;
            text = Organize.prototype.drawTag(x,y,xLabel,yLabel,LabelContent,diameter/2,diameter/2); // Label for circle
	    circ = Organize.prototype.draw.circle(diameter).attr({ fill: 'transparent',cx: x, cy: y }).stroke({ width: 2 });                       
         }
	circ.back(); 	
        
        var circlePositionInArray;
        var entitiesInitialPositions = new Array();
        var sharedEntities = new Array();    
        
        //circ.draggable({minX:0,minY:0,maxX:800,maxY:600 });
        circ.draggable();
	circ.style('cursor','move');
        circlePositionInArray = Organize.prototype.addCircleIntoArray(circ, text);    
                
        // MANAGING EVENTS FOR THE CIRCLE
	circ.click(function() {
		Organize.prototype.clickCircle(circ,text);
                //Organize.prototype.insideCircle(ev.pageX-Organize.prototype.LEFTOFFSET,ev.pageY-Organize.prototype.LEFTOFFSET,circ)
               })	             
              
       circ.dragstart = function() {
           
           Organize.prototype.isDraggingCircle=1;
           Organize.prototype.draggedCircle=circ;
           Organize.prototype.draggedText=text;
           // keeps the initial coordinates of the label and of each element 
           // inside the circle so that they can be dragger with the circle
           Organize.prototype.labelDistanceCx=-(circ.attr('cx')-text.attr('x'));
           Organize.prototype.labelDistanceCy=-(circ.attr('cy')-text.attr('y'));
           
           // Array entitiesInitialPositions stores the initial position off all 
           // entities that are inside a circle, so that they can be dragged 
           // with the circle
           
           for(var i=0;i<Organize.prototype.svgElements.length;i++) // getting the position of the circle in Organize.prototype.svgElements
               if (Organize.prototype.svgElements[i].svg==circ)
                 {  
                    circlePositionInArray=i;
                    break;
                 }  
         
           var entPos;
           for (var i=0; i<Organize.prototype.svgElements[circlePositionInArray].entities.length;i++)
            {
              entPos = new Object();
              entPos.x = Organize.prototype.svgElements[circlePositionInArray].entities[i].svg.attr('x'); 
              entPos.y = Organize.prototype.svgElements[circlePositionInArray].entities[i].svg.attr('y'); 
              entitiesInitialPositions.push(entPos);
            }
           
            // If there a circle is selected (in this case a rectanlge is shown 
            // around this circle as well as small circles on its corders
           if(Organize.prototype.selectedRect!=null){
               
               //If the selected circle is not the one which has been clicked
               // it is necessary to unselect it, by removing the rectangle and 
               // the small circles around it
               if (Organize.prototype.selectedCirc!=circ)
                   Organize.prototype.removeRectSmallCirc();
               else{
                Organize.prototype.selectedRectPisitionX=Organize.prototype.selectedRect.attr('x');
                Organize.prototype.selectedRectPisitionY=Organize.prototype.selectedRect.attr('y');                
               }
            }          
            //sharedEntities = Organize.prototype.getListOfSharedEntities(circ); 
            Organize.prototype.getArrayOfOverlappingCicles(circ,ArrayOfOverlappingCircles);
            console.log("Size of ArrayOfOverlappingCircles: "+ArrayOfOverlappingCircles.length)            
        }
        
        // drags the label and each element inside the circle along with the circle
       circ.dragmove = function(delta, event) {  
        var mm,ccx,ccy;
            
/*
       var addX = -
       var addY
       if (Organize.prototype.labelDistanceCx>0)
  */         

       
       text.move(circ.attr('cx')+Organize.prototype.labelDistanceCx,circ.attr('cy')+Organize.prototype.labelDistanceCy);
        
       Organize.prototype.dragEntitiesWithCircle(Organize.prototype.svgElements[circlePositionInArray],delta);
       //Organize.prototype.dragEntitiesWithCircle(circlePositionInArray,delta,entitiesInitialPositions);       
       //Organize.prototype.protectSharedEntitiesInCircDragging(sharedEntities,circ);
         
         // drags the selected rectangle and small circles with the big circle
         if(Organize.prototype.selectedRect!=null)
           {
               Organize.prototype.selectedRect.move(Organize.prototype.selectedRectPisitionX+delta.x,Organize.prototype.selectedRectPisitionY+delta.y);
               
               Organize.prototype.circTopLeft.move(Organize.prototype.selectedRectPisitionX+delta.x,Organize.prototype.selectedRectPisitionY+delta.y);
  //Organize.prototype.circTopLeft.move(circ.attr('cx')-circ.attr('rx')+delta.x,Organize.prototype.selectedRectPisitionY+delta.y);             
               Organize.prototype.circTopRight.move((Organize.prototype.selectedRectPisitionX+delta.x+2*circ.attr('rx')),Organize.prototype.selectedRectPisitionY+delta.y);
               Organize.prototype.circBottomLeft.move(Organize.prototype.selectedRectPisitionX+delta.x,(Organize.prototype.selectedRectPisitionY+delta.y+2*circ.attr('ry')));
               Organize.prototype.circBottomRight.move((Organize.prototype.selectedRectPisitionX+delta.x+2*circ.attr('rx')),(Organize.prototype.selectedRectPisitionY+delta.y+2*circ.attr('ry')));     
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
                        Organize.prototype.dragEntitiesWithCircle(ArrayOfOverlappingCircles[mm],delta);                        
                   }     
               }
        } 

    circ.dragend = function(delta, event) {
                
        //circ.draggable({minX:0,minY:0,maxX:800,maxY:600 });        
        circ.draggable();
        sharedEntities.length =0;
        
        
        
        //Organize.prototype.setTextDragLimit(text,circ.attr('cx'),circ.attr('cy'),circ.attr('rx'),circ.attr('ry'));
        // Cleanning the entitiesInitialPositions Array
        entitiesInitialPositions.length = 0;
        Organize.prototype.fireChangeEventsForEntitiesMovedWithCircle(circ);
        Organize.prototype.updateEntitiesInCircles();
        
                
        // updating  data for the OverlappingCircles (including the Entities)
        for (var mm=0; mm<ArrayOfOverlappingCircles.length;mm++)
          {
             ArrayOfOverlappingCircles[mm].cx = ArrayOfOverlappingCircles[mm].svg.attr('cx');
             ArrayOfOverlappingCircles[mm].cy = ArrayOfOverlappingCircles[mm].svg.attr('cy');  
             ArrayOfOverlappingCircles[mm].label.x = ArrayOfOverlappingCircles[mm].label.svg.attr('x');
             ArrayOfOverlappingCircles[mm].label.y = ArrayOfOverlappingCircles[mm].label.svg.attr('y');   

             for(var pp=0;pp<ArrayOfOverlappingCircles[mm].entities.length;pp++)
              {
                ArrayOfOverlappingCircles[mm].entities[pp].x = ArrayOfOverlappingCircles[mm].entities[pp].svg.attr('x');  
                ArrayOfOverlappingCircles[mm].entities[pp].y = ArrayOfOverlappingCircles[mm].entities[pp].svg.attr('y');
              } 

            // firing the changeEvent for each circles dragged along, as well as for 
            // all the elements that are inside each one of these circles            
            
             divSVG = document.getElementById(Organize.prototype.svgDivID);    
             var circIntegration2 = Organize.prototype.createObjectForEvent (1, ArrayOfOverlappingCircles[mm].svg, ArrayOfOverlappingCircles[mm].label.svg);     
             var customevEnt = $.Event('ChangeCircle', { 'detail': circIntegration2 });             
             // divSVG.dispatchEvent(customevEnt);            
             $(divSVG).trigger(customevEnt);
            
             Organize.prototype.fireChangeEventsForEntitiesMovedWithCircle(ArrayOfOverlappingCircles[mm].svg);  
             
             // updating the draggin limits for the circle's label
             var xCirc = ArrayOfOverlappingCircles[mm].svg.attr('cx');
             var yCirc = ArrayOfOverlappingCircles[mm].svg.attr('cy');
             var rxCirc = ArrayOfOverlappingCircles[mm].svg.attr('rx');
             var ryCirc = ArrayOfOverlappingCircles[mm].svg.attr('ry');
             Organize.prototype.setTextDragLimit(ArrayOfOverlappingCircles[mm].label.svg,xCirc,yCirc,rxCirc,ryCirc);
          }        
         ArrayOfOverlappingCircles.length=0;
        }    
    
    // creating an object which is then passed to the other componets through events
    // this circle object should contain information about the circle and the label
    // this event is only created when the user creats the circle (ev!=null) and 
    // not when the circle is created from the data which is stored in the database (ev==null)
    if (ev!=null)
     {
        var circIntegration = Organize.prototype.createObjectForEvent (1, circ, text);     
        var customevEnt = $.Event('AddCircle', { 'detail': circIntegration });          
        divSVG = document.getElementById(Organize.prototype.svgDivID);    
        //divSVG.dispatchEvent(customevEnt);
        $(divSVG).trigger(customevEnt);
     }       
    
    Organize.prototype.updateEntitiesInCircles();
    
 return circ.attr('id');
}


Organize.prototype.getArrayOfOverlappingCicles = function(circ,ArrayOfOverlappingCircles)
{
    var i,j,k,ent,pos,m,inserted;
    
    for(i=0;i<Organize.prototype.svgElements.length;i++) 
     {
         console.log("Searching svgElements position: "+i)
         
         if(Organize.prototype.svgElements[i].svg==circ) // the cirrent circle is found         
            {
                
                    //Each entity of this circle is searched in other circles
                    console.log("found current circle")
                for (j=0;j<Organize.prototype.svgElements[i].entities.length;j++)
                  {   console.log("checking entity at position: "+j)
                      ent = Organize.prototype.svgElements[i].entities[j].svg;
                      for(k=0;k<Organize.prototype.svgElements.length;k++)
                       {
                           // if the entity is in other circles and has not been 
                           // inserted into the ArrayOfOverlappingCircles, then it iss added
                           console.log("Trying to find that entity at circle: "+k)
                           if((k!=i)&&(Organize.prototype.isEntityInACircleInArray(k,ent)!=-1))
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
                                   ArrayOfOverlappingCircles.push(Organize.prototype.svgElements[k]);
                                   console.log("added")
                                 }  
                             }
                       }           
                  } 
                ArrayOfOverlappingCircles.push(Organize.prototype.svgElements[i]);  
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
                ArrayOfCirclesWithAnEntity = Organize.prototype.getArrayOfCirclesWithAnEntity(ent)
                
                
                for(k=0;k<ArrayOfCirclesWithAnEntity.length;k++)
                 {
                     if (!Organize.prototype.member(ArrayOfCirclesWithAnEntity[k].svg,ArrayOfOverlappingCircles))
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

Organize.prototype.getArrayOfCirclesWithAnEntity = function(ent)
{
    var i,j;
    var ArrayOfCirclesWithAnEntity= new Array();

    for(i=0;i<Organize.prototype.svgElements.length;i++)
     {
        for(j=0;j<Organize.prototype.svgElements[i].entities.length;j++)
         {
             if(Organize.prototype.svgElements[i].entities[j].svg==ent)
              {
                  ArrayOfCirclesWithAnEntity.push(Organize.prototype.svgElements[i])
                  break;
              }   
         }   
     }  
     return ArrayOfCirclesWithAnEntity;
}

Organize.prototype.member = function(element,arrayOfElements)
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


Organize.prototype.fireChangeEventsForEntitiesMovedWithCircle = function(circ)
{
    var i,j,numberOfEntities,entIntegration,customevEnt;
    var divSVG = document.getElementById(Organize.prototype.svgDivID);    
    
    for(i=0;i<Organize.prototype.svgElements.length;i++)
     {  
         
         if(Organize.prototype.svgElements[i].svg == circ)
             {
                 numberOfEntities = Organize.prototype.svgElements[i].entities.length;
                 for(j=0;j<numberOfEntities;j++)
                  { 
                    entIntegration = Organize.prototype.createObjectForEvent(3,
                                Organize.prototype.svgElements[i].entities[j].svg, null);     
                    customevEnt = $.Event('ChangeEntity', { 'detail': entIntegration });             
                    //divSVG.dispatchEvent(customevEnt);
                    $(divSVG).trigger(customevEnt);
                  }                 
             }
    }
}


Organize.prototype.protectSharedEntitiesInCircDragging = function(sharedEntities,circ)
{
  //alert("Inside")
  
  var limitX, limitY; 
  for (i=0;i<sharedEntities.length;i++)
   {
      limitX = sharedEntities[i].attr('x') + sharedEntities[i].attr('width')/2;
      limitY = sharedEntities[i].attr('y') + sharedEntities[i].attr('height')/2;
 
 
      //limitX = sharedEntities[i].attr('x') ;
      //limitY = sharedEntities[i].attr('y');
 
      if(!Organize.prototype.insideCircle(limitX,limitY,circ))
        {
            alert("found!!")
            //circ.fixed();
        }  
        
      //alert("Entrou no protect. Shared: "+sharedEntities.length + " limitX "+ 
        //  limitX + " limitY " + limitY + " cx "+ circ.attr('cx') + " cy " + circ.attr('cy'));    
   }       
}


/*
     var cx = x+Organize.prototype.draggedEntity.attr('width')/2;
    var cy = y+Organize.prototype.draggedEntity.attr('height')/2;
    
 **/

Organize.prototype.drawTag = function(xCirc,yCirc,x,y,initialLabelText,rxCirc,ryCirc)
{
    
     console.log("DRAW TAG!!!!") 
    var text = Organize.prototype.draw.text(initialLabelText);
    
    text.move(x,y);

        // When the user clicks on the SVG text, the SVG text is edited:
        // (1) A Foreign object is created (HTML textarea) 
        // (2) This textarea replaces the SVG text
    text.click(function() {
        
        if (Organize.prototype.currentLabel!=null && Organize.prototype.currentLabel!=text)
            Organize.prototype.unselectLabel();
          
          // if this click event was triggered from a drag and drop of the label
          // no text are should be found. when compairing the current text position
          // with the one it had from the dragstart event, one can know whether or 
          // not this is a drag event          
        
         var difX = Organize.prototype.draggedLabelInitialX-text.attr('x');
         var difY = Organize.prototype.draggedLabelInitialY-text.attr('y');    
    
         difX= Organize.prototype.truncateDecimals(difX,0);    
         difY= Organize.prototype.truncateDecimals(difY,0);              
    
         if(difX==0 && difY==0)  // If the coordinates of the Label did not change...
                            // the Label has been clicked. The corresponding textarea is shown
          {
             var labelText = text.content;
             Organize.prototype.currentLabel = text; 
             Organize.prototype.insideLabel=1; // to say that the text is being edited
                
             /*text.hide();  // hiding the current SVG text                                      
               
               var newText=prompt('Please Enter the concept',text.content);
               Organize.prototype.currentLabel = newText; 
               text.content=newText;
               */
               var newText=prompt('Please enter the Concept',text.content);
               if(newText!=null)
                    Organize.prototype.currentLabel.text(newText);               
               
               
               
               
               // replacing the SVG Text with the HTML textarea (foreignobject)
               /*
               console.log("Creating foreignObject !!!")
            var fobj = Organize.prototype.draw.foreignObject(200,100).attr({id: 'fobj'})
             fobj.appendChild("textarea", {id: 'mytextarea', rows:'4', cols:'15',innerHTML: labelText})
             fobj.move(Organize.prototype.currentLabel.attr('x'),Organize.prototype.currentLabel.attr('y'));
             */

               // To say that the mouse is outside the textare
               // thus, if the user clicks outside the textarea, the textarea 
               // content is inserted into the SVG text
               // this is done so that the dragging function can work smothly
            Organize.prototype.currentLabel.mouseout(function() { 
                Organize.prototype.insideLabel=0;
                }) 
            
           // Organize.prototype.currentFobj=fobj;            
        } 
                  //BBB
        else // The label has been dragged. the CircleChange event has to be fired
        {
                    // getting the id of the circle that contains the Label
            var circL = null;
            for(var i=0;i<Organize.prototype.svgElements.length;i++)
             {
                if(Organize.prototype.svgElements[i].label.svg== text)  
                {  
                  circL = Organize.prototype.svgElements[i].svg
                  console.log("Circle found!!!")
                  break;
                 }  
            }                       

            //Firing the ChangeCircle event (due to change on the label position)
            var divSVG = document.getElementById(Organize.prototype.svgDivID);    
            var entIntegration = Organize.prototype.createObjectForEvent(1,circL,text);     
            var customevEnt = $.Event('ChangeCircle', { 'detail': entIntegration });             
            //divSVG.dispatchEvent(customevEnt);
            $(divSVG).trigger(customevEnt);
            console.log("Change circle fired!");            
        }
    })               

          // The label is draggable but not too far away from the circle
    Organize.prototype.setTextDragLimit(text,xCirc,yCirc,rxCirc,ryCirc);    
    
    text.dragstart=function() {
        Organize.prototype.draggedLabelInitialX = text.attr('x');
        Organize.prototype.draggedLabelInitialY = text.attr('y');
    }

    return text;
}


Organize.prototype.setTextDragLimit = function(text,xCirc,yCirc,rxCirc,ryCirc)
{
    var minDragX = xCirc-(rxCirc+70);
    var minDragY = yCirc-(ryCirc+70);
    var maxDragX = xCirc+(rxCirc+70);
    var maxDragY = yCirc+(ryCirc+70);  
    text.draggable({minX:minDragX,minY:minDragY,maxX:maxDragX,maxY:maxDragY });
}


Organize.prototype.clickEntity = function(ent,event)
{        
    var xIm = ent.attr('x');
    var yIm = ent.attr('y');        
    
    var rect = Organize.prototype.draw.rect(ent.attr('width')+5,ent.attr('width')+5).attr({ fill: 'none' }).stroke({ width: 0.5,color:'blue' });
    rect.attr({ x: xIm, y: yIm });
    Organize.prototype.selectedEntity = ent;
    Organize.prototype.selectedEntityRect = rect;
    
    // If there any circle is selected(Organize.prototype.selectedRect), this circle is unselected
    // by removing unselecting the corresponding label (if it is selected) 
    // and by removing the small circle, no matter if the user clicked 
    // in an entity which is inside the circle
    if(Organize.prototype.selectedRect!=null)
      {
         if (Organize.prototype.insideLabel!=0)
             Organize.prototype.unselectLabel(); 
         Organize.prototype.removeRectSmallCirc() 
      }  
      
    // Firing the ClickEntity event only when the entity is clicked (not dragged)       
    // If the entity was not dragged but only clicked on...
    // the ClickEntity event is fired
          
    var difX = Organize.prototype.draggedEntityInitialX-ent.attr('x');
    var difY = Organize.prototype.draggedEntityInitialY-ent.attr('y');    
    
    difX= Organize.prototype.truncateDecimals(difX,0);    
    difY= Organize.prototype.truncateDecimals(difY,0);              
    
    if(difX==0 && difY==0)  // If the coordinates of the entity did not change...
                            // the entity has been clicked. the corresponding event is fired
      {  
        var divSVG = document.getElementById(Organize.prototype.svgDivID);          
        var entIntegration = Organize.prototype.createObjectForEvent(3,ent, null);             
        var customevEnt = $.Event('ClickEntity', { 'detail': entIntegration });             
        //divSVG.dispatchEvent(customevEnt);              
        $(divSVG).trigger(customevEnt);
       console.log('ClickEntity Triggered ')       
      } 
}


Organize.prototype.truncateDecimals = function (number, digits) {
    var multiplier = Math.pow(10, digits),
        adjustedNum = number * multiplier,
        truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

    return truncatedNum / multiplier;
};

Organize.prototype.loadOrganizeCanvas = function(divID)
{
       //divID= "bitsandpeaces"; // REMOVE XXXX!!!!!!!
 
        // Setting global variables for Left and right
        //  offset for the main svg canvas (Organize.prototype.svgDivID)
       Organize.prototype.svgDivID = divID;
       var el=document.getElementById(divID);                        
       
       Organize.prototype.svgDivID = divID;
                     
       //Creating the SVG canvas and seting its event handlers 

       Organize.prototype.draw = SVG(divID); // the SVG canvas 
       Organize.prototype.draw.click(Organize.prototype.unselectCircAndLabel);
       Organize.prototype.draw.dblclick(Organize.prototype.canvasDoubleClick);
       //Organize.prototype.draw.dblclick(Organize.prototype.test);
       Organize.prototype.draw.mouseup(Organize.prototype.canvasMouseUp);
       Organize.prototype.draw.mousedown(Organize.prototype.unselectAllForDraggingEvent);
       
       //Setting the kedown even (for deleting circles and entities)
       // this is achieved using jQuery
       //$('#bitsandpeaces').bind('keydown', function(event) {           
       $('#'+divID).bind('keydown', function(event) {                      
            Organize.prototype.removeCircleAndEntity(event);
        });              
}



Organize.prototype.updateEntitiesInCircles = function()
{
    var i,j,k,ent,x,y;
    
       // checking if entities that are inside the cricles, are now 
       // inside or outside other circles  
       
    for(i=0;i<Organize.prototype.svgElements.length;i++)
     {  
         numberOfEntities = Organize.prototype.svgElements[i].entities.length;
         for(j=0;j<numberOfEntities;j++)
          { 
            ent = Organize.prototype.svgElements[i].entities[j].svg; 
            // x and y store the coordinates of the center of the entity(image)
            x = ent.attr('x') + ent.attr('width')/2;
            y = ent.attr('y')+ ent.attr('height')/2;
            
            
            // Remove from the Entity list of a circle
            // all the elements which are now outside the circle are, 
            // after the circle has been dragged
            if(!Organize.prototype.insideCircle(x,y,Organize.prototype.svgElements[i].svg)) 
              {
                Organize.prototype.svgElements[i].entities.splice(j,1);  
                j--;
                numberOfEntities--;
                
               // alert("Removeu. i = "+i+" j = "+j +" numberOfEntities: "+numberOfEntities + 
               //     " x = "+x+" y= "+y+" cx = "+Organize.prototype.svgElements[i].svg.attr('cx')+" cy = "+Organize.prototype.svgElements[i].svg.attr('cy')+
               // " rx = "+Organize.prototype.svgElements[i].svg.attr('rx')+" ry = "+Organize.prototype.svgElements[i].svg.attr('ry'));
              }  

            // Adds the Entity to the entity list of every circle
            // inside of which the entity is now  
            // after the circle has been dragger
            
            for(k=0;k<Organize.prototype.svgElements.length;k++)
             {   
                 
                 if(Organize.prototype.insideCircle(x,y,Organize.prototype.svgElements[k].svg) && (Organize.prototype.isEntityInACircleInArray(k,ent)==-1))
                  {
                      Organize.prototype.svgElements[k].entities.push(Organize.prototype.newEntity(x,y,ent));                      
                  }                        
             }   
          }   
     }  
       // checking if entities that were outside circles, are now inside anyone
    
    var OutsideListSize = Organize.prototype.outsideCircleElements.length;
    for(i=0;i<OutsideListSize;i++)
     {  var added= false;
        ent = Organize.prototype.outsideCircleElements[i];
        x = ent.attr('x') + ent.attr('width')/2;
        y = ent.attr('y')+ ent.attr('height')/2; 
                
        for(j=0;j<Organize.prototype.svgElements.length;j++)
         {  var circAdd = Organize.prototype.svgElements[j].svg;             
            if (Organize.prototype.insideCircle(x,y,circAdd))   //Add to circle
              {  
                Organize.prototype.svgElements[j].entities.push(Organize.prototype.newEntity(x,y,ent));                      
                added = true;
              }  
         }   
         // if the element has been added to circle than it its
         // removed form outsideCircleElements
       if (added)
        {
          Organize.prototype.outsideCircleElements.splice(i,1);
          OutsideListSize--;
          i--;
        }
     }             
}

Organize.prototype.newEntity = function(x,y,entSvg)
{
    ent = new Object();
    ent.x=x;
    ent.y=y;
    ent.svg=entSvg;
    
    return ent;
}


Organize.prototype.getListOfSharedEntities = function(circ)
{
    var sharedEnt = new Array();
    var i, j;
    
    for(i=0; i< Organize.prototype.svgElements.length;i++)
     {
       if(Organize.prototype.svgElements[i].svg==circ)  
        {
            for (j=0;j<Organize.prototype.svgElements[i].entities.length;j++)
              {
                var isInOtherCirc = Organize.prototype.isEntityInOtherCircleInArray(Organize.prototype.svgElements[i].entities[j].svg,i)
                if(isInOtherCirc)
                 {
                   //alert("Found shared")
                   sharedEnt.push(Organize.prototype.svgElements[i].entities[j].svg); 
                 } 
                      
              }  
        }   
     }     
     //alert("Going to finish")
     //alert("Number of Share entities Found "+sharedEnt.length);
     
   return sharedEnt;   
}


Organize.prototype.isEntityInOtherCircleInArray = function(ent,posCurrentCirc)
{
  var i;
  var result=false;
  
  //alert("Organize.prototype.isEntityInOtherCircleInArray -inicio");
  for(i=0; i<=Organize.prototype.svgElements.length;i++)
   {
     if ((i!=posCurrentCirc) && (Organize.prototype.isEntityInACircleInArray(i,ent)!=-1)) 
      {
         result = true;
         break;
      }   
   }   
  // alert("Organize.prototype.isEntityInOtherCircleInArray -FIM: "+result);
   return result;
}



/*Organize.prototype.dragEntitiesWithCircle = function(circlePositionInArray,delta,entitiesInitialPositions)
{    
    var x;
    var y;
    
    for (var i=0; i<Organize.prototype.svgElements[circlePositionInArray].entities.length;i++)
     {
       x = entitiesInitialPositions[i].x + delta.x;
       y = entitiesInitialPositions[i].y + delta.y;
    
       Organize.prototype.svgElements[circlePositionInArray].entities[i].svg.move(x,y);
       Organize.prototype.svgElements[circlePositionInArray].entities[i].x = x;
       Organize.prototype.svgElements[circlePositionInArray].entities[i].y = y;
     }
}*/

Organize.prototype.dragEntitiesWithCircle = function(objectInSvgElementsArray,delta)
{    
    var x;
    var y;
    
    for (var i=0; i<objectInSvgElementsArray.entities.length;i++)
     {
       x = objectInSvgElementsArray.entities[i].x + delta.x;
       y = objectInSvgElementsArray.entities[i].y + delta.y;
    
       objectInSvgElementsArray.entities[i].svg.move(x,y);
       //Organize.prototype.svgElements[circlePositionInArray].entities[i].x = x;
       //Organize.prototype.svgElements[circlePositionInArray].entities[i].y = y;
     }
}


Organize.prototype.addCircleIntoArray = function(circ, label) 
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
    
    var pos = Organize.prototype.svgElements.push(circ1) - 1;      
    return pos;
} 

Organize.prototype.addEntityIntoCircleInArray = function(entity, circle, pos) 
{   
   entity.next = Organize.prototype.svgElements[pos].entities;
   Organize.prototype.svgElements[i].entities=entity;
} 


Organize.prototype.removeCircleFromArray = function(circ) 
{
   // removing all entities from the circle

   var i,j;
   for (i=0;i<Organize.prototype.svgElements.length;i++)
    {  
     if (Organize.prototype.svgElements[i].svg==circ) // finds the circle in array
       {          
         var numberOfEntities = Organize.prototype.svgElements[i].entities.length;  
         for(j=0;j<numberOfEntities;j++) // finds all entities
           {
            var ent = Organize.prototype.svgElements[i].entities[0].svg;
            Organize.prototype.svgElements[i].entities.splice(0,1);
                // If the entity is not inside any other circle
                // then it should be removed from the screen

            if (!Organize.prototype.isEntityInAnyCircleInArray(ent))
                {   
                    // triggers an event stating that the entity is about to be removed
                    
                    var entIntegration = Organize.prototype.createObjectForEvent (3, ent, null); //for selected circle and text     
                    var customevEnt = $.Event('RemoveEntity', { 'detail': entIntegration });          
                    var divSVG = document.getElementById(Organize.prototype.svgDivID);    
                    //divSVG.dispatchEvent(customevEnt); 
                    $(divSVG).trigger(customevEnt);
                    ent.remove(); // removes the entity from the screen                                  
                }
           }  
         Organize.prototype.svgElements.splice(i,1);  //removing circle form array
         break;
       }  
    }
} 

Organize.prototype.removeEntityFromCircleInArray = function(arrayPos, ent) 
{
    var i;
    
    for(i=0; i<Organize.prototype.svgElements[arrayPos].entities.length;i++)
      {  
       if(Organize.prototype.svgElements[arrayPos].entities[i].svg==ent)
        {   
          Organize.prototype.svgElements[arrayPos].entities.splice(i,1); 
          //break;
        }  
      }
}   
  
Organize.prototype.removeEntityFromAllCircles = function(ent) 
{
    var i;
    
    for(i=0; i<Organize.prototype.svgElements.length;i++)
      {  
        Organize.prototype.removeEntityFromCircleInArray(i, ent)
          
      }
}


Organize.prototype.isEntityInACircleInArray = function(arrayPos,ent) 
{
    //alert("Entered Organize.prototype.isEntityInACircleInArray")
    var i,result = -1;
    for(i=0; i<Organize.prototype.svgElements[arrayPos].entities.length;i++)
      {          
        if(Organize.prototype.svgElements[arrayPos].entities[i].svg==ent)
        {
            result=i;
            break;
        }     
      }  
      //alert("Exiting sEntityInACircleInArray. result: "+result);
    return result;
}


Organize.prototype.isEntityInAnyCircleInArray = function(ent) 
{
    var i,result = false;
    for(i=0; i<Organize.prototype.svgElements.length;i++)
     {
        if (Organize.prototype.isEntityInACircleInArray(i,ent)!=-1)
          {  
             result = true;
             break;
          }   
     }
    return result;
} 



Organize.prototype.insideCircle = function(x,y,circ)
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


Organize.prototype.canvasMouseUp = function(event)
{
   var divSVG = document.getElementById(Organize.prototype.svgDivID);    
   
   if(Organize.prototype.resizingCircle)
     {                  
       var circIntegration = Organize.prototype.createObjectForEvent (1, Organize.prototype.selectedCirc, Organize.prototype.selectedLabel);     
       var customevEnt = $.Event('ChangeCircle', { 'detail': circIntegration });             
       //divSVG.dispatchEvent(customevEnt);
       $(divSVG).trigger(customevEnt);

       divSVG.onmousemove=null;  
       Organize.prototype.updateEntitiesInCircles();
       Organize.prototype.resizingCircle = false;
     }       
     
     
   if (Organize.prototype.isDraggingEntity!=0)
      {
       var entIntegration = Organize.prototype.createObjectForEvent(3,Organize.prototype.draggedEntity, null);     
       var customevEnt = $.Event('ChangeEntity', { 'detail': entIntegration });             
       //divSVG.dispatchEvent(customevEnt);
       $(divSVG).trigger(customevEnt);
          
       Organize.prototype.dropElement(); // will then set isDraggingEntity to 0
       
       
      }   
   
   if(Organize.prototype.isDraggingCircle==1)
      {
       var circIntegration = Organize.prototype.createObjectForEvent (1, Organize.prototype.draggedCircle, Organize.prototype.draggedText);     
       var customevEnt = $.Event('ChangeCircle', { 'detail': circIntegration });             
       //divSVG.dispatchEvent(customevEnt);
       $(divSVG).trigger(customevEnt);

       Organize.prototype.isDraggingCircle=0
      } 
}


Organize.prototype.createAndDropSvgEntity = function(ousideEntity)
{
        // Creating the entity
    var ent = Organize.prototype.draw.image(ousideEntity.imageURL, 50, 50)        
    ent.attr({ x: ousideEntity.x, y: ousideEntity.y });
    ent.draggable();
    ent.dragstart=function() {Organize.prototype.isDraggingEntity=1;
        Organize.prototype.draggedEntity=ent;
        
            // used to differentiate a click on an entity from a 
            // drag and drop operation. If draggedEntityInitialX or 
            // draggedEntityInitialY are different from the current position of 
            // of entity in in the clickEntity method,than theelement was gragged
            // otherwise, it was just clicked
        Organize.prototype.draggedEntityInitialX = ent.attr('x');
        Organize.prototype.draggedEntityInitialY = ent.attr('y');
                 } 
    ent.click(function() {
        var divSVG = document.getElementById(Organize.prototype.svgDivID);    
        divSVG.focus();
        Organize.prototype.clickEntity(ent);
    })
     
    // Dropping the entity
    Organize.prototype.draggedEntity = ent;  
    Organize.prototype.isDraggingEntity = 2;
    Organize.prototype.dropElement(); 
       
    // Firing the event about the creation of a new entity
    var circIntegration = Organize.prototype.createObjectForEvent (3, ent, null);     
    var customevEnt = $.Event('AddEntity', { 'detail': circIntegration });          
    var divSVG = document.getElementById(Organize.prototype.svgDivID);    
   // divSVG.dispatchEvent(customevEnt); 
    $(divSVG).trigger(customevEnt);
    
    return ent.attr('id');  
}

Organize.prototype.dropElement = function()
{
    var x = Organize.prototype.draggedEntity.attr('x');
    var y = Organize.prototype.draggedEntity.attr('y');
    var dropedInCircle=false;

    // the image will only be considered inside a circle,  
    //  if its center is inside the circle
    var cx = x+Organize.prototype.draggedEntity.attr('width')/2;
    var cy = y+Organize.prototype.draggedEntity.attr('height')/2;
    
    var ent;
    
   if (Organize.prototype.isDraggingEntity!=0) // an entity is being dragged
    {      
        // looks for every circle where the entity is being dropped
      for(var i=0; i<Organize.prototype.svgElements.length;i++)
       {
                // if the entity is being dropped within this circle...
         if(Organize.prototype.insideCircle(cx,cy,Organize.prototype.svgElements[i].svg))
            {
              dropedInCircle = true;  
              if(Organize.prototype.isEntityInAnyCircleInArray(Organize.prototype.draggedEntity))  
               {     
                // remove the entity from all other circles it is not positioned 
                // inside of anymore
                for(var ii=0; ii<Organize.prototype.svgElements.length; ii++)
                {
                    if ((Organize.prototype.isEntityInACircleInArray(ii,Organize.prototype.draggedEntity)!=-1) &&(!Organize.prototype.insideCircle(cx,cy,Organize.prototype.svgElements[ii].svg)))
                    {
                        Organize.prototype.removeEntityFromCircleInArray(ii,Organize.prototype.draggedEntity);   
                    }
                }                 
                  
               }  
                  
                // the entity is added to the circles element list
                // but only if it is not already there
              if (Organize.prototype.isEntityInACircleInArray(i,Organize.prototype.draggedEntity)==-1)
                {
                    ent = Organize.prototype.newEntity(x,y,Organize.prototype.draggedEntity)
                    Organize.prototype.svgElements[i].entities.push(ent);
                }
            } 
       }       

      // If the entity is not dropped inside any circle, than it is added to the 
      // List of outsideCircleElements
    if(!dropedInCircle)
      {  
         Organize.prototype.outsideCircleElements.push(Organize.prototype.draggedEntity);
         for(var i=0; i<Organize.prototype.svgElements.length;i++)
          {
              Organize.prototype.removeEntityFromAllCircles(Organize.prototype.draggedEntity);  
          }
      }   
    else
      if(dropedInCircle && Organize.prototype.isMemberOfOutsideCircleElements(Organize.prototype.draggedEntity))        
          Organize.prototype.removeFromOutsideCircleElements(Organize.prototype.draggedEntity)

      //updating the coordenates of the Entity in the svgElements
      Organize.prototype.updateDraggedEntityProperties();

      Organize.prototype.isDraggingEntity=0;
      Organize.prototype.draggedEntity=null;      
    }           
}


Organize.prototype.updateDraggedEntityProperties =  function()
  {
   
   var i,j;
   var ent = Organize.prototype.draggedEntity;
   
    for(i=0; i<Organize.prototype.svgElements.length;i++)
     {
        for(j=0; j<Organize.prototype.svgElements[i].entities.length;j++)
        {          
          if(Organize.prototype.svgElements[i].entities[j].svg == ent)
            {
              Organize.prototype.svgElements[i].entities[j].x = ent.attr('x');
              Organize.prototype.svgElements[i].entities[j].y = ent.attr('y');
            }  
        }
    }
  }


 Organize.prototype.removeFromOutsideCircleElements =  function(ent)
{
   var i;
   
   for(i=0;i<Organize.prototype.outsideCircleElements.length;i++)
    {
      if(Organize.prototype.outsideCircleElements[i]==ent)
       {   
         Organize.prototype.outsideCircleElements.splice(i,1)  
         break;
       } 
    }      
}

 Organize.prototype.isMemberOfOutsideCircleElements =  function(ent)
{
   var i;
   var result = false;
   
   for(i=0;i<Organize.prototype.outsideCircleElements.length;i++)
    {
      if(Organize.prototype.outsideCircleElements[i]==ent)
       {   
         result = true 
         break;
       } 
    }      
    return result;
}

Organize.prototype.clearCanvas =  function()
{
    Organize.prototype.draw.clear();
    Organize.prototype.svgElements.length=0;
    Organize.prototype.outsideCircleElements.length=0
}