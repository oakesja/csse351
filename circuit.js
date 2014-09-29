// Graham Fuller and Jacob Oakes
var gl;
var canvas;
var canvasXOffset;
var canvasYOffset;
var points;
var pointCount = 0;
var radius = .1;
var maxPoints = 1000000;
var drag = false;
var firstPoint;

window.onload = function init(){
	points = [];
    canvas = document.getElementById( "gl-canvas" );
	
	canvasXOffset = canvas.offsetLeft;
	canvasYOffset = canvas.offsetTop;
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
  
    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxPoints, gl.STATIC_DRAW );	
	
	// Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	canvas.addEventListener ("click", function(event) {
		centerX = -1 + 2*(event.clientX-canvasXOffset)/canvas.width;
		centerY = -1 + 2*(canvas.height-event.clientY+canvasYOffset)/canvas.height;
		if(pointCount<maxPoints){
			if(document.getElementById('and').checked){
				makeAndGate(centerX, centerY);
			} else if(document.getElementById('or').checked){
				makeOrGate(centerX, centerY);
			} else if(document.getElementById('not').checked){
				makeNotGate(centerX, centerY);
			} else if(document.getElementById('wire').checked){
				if(drag==false){
					firstPoint = vec2(centerX, centerY);
					drag=true;
				} else{
					points.push(firstPoint, vec2(centerX, centerY));
					pointCount+=2;
					drag = false;
				}
			}
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));		
		}
	});
	
	document.getElementById("clear").onclick = function () {
		window.location.reload();
    };
	
	render();
};

function render() {
	gl.clear( gl.COLOR_BUFFER_BIT );
	gl.drawArrays( gl.LINES, 0, pointCount);
	requestAnimFrame (render);
}

function makeNotGate(centerX, centerY){
	var cRadius = radius/6;
	var tRadius = radius/2;
	drawPolygon(centerX, centerY, 30, cRadius);
	drawPolygon(centerX - tRadius-cRadius, centerY, 3, tRadius);
	var triangleLeft = centerX-cRadius-tRadius-tRadius*Math.cos(Math.PI/3);
	points.push(vec2(triangleLeft, centerY), vec2(triangleLeft-radius, centerY));
	points.push(vec2(centerX+cRadius, centerY), vec2(centerX+cRadius+radius, centerY));
	pointCount+=4;
}

function makeAndGate(centerX, centerY){
	makeGate(centerX, centerY);
	points.push(vec2(centerX+radius/2+.002, centerY), vec2(centerX+radius/2-.002, centerY));
	pointCount+=2;
}

function makeOrGate(centerX, centerY){
	makeGate(centerX, centerY);
	points.push(vec2(centerX+radius/2+.01, centerY), vec2(centerX+radius/2-.01, centerY));
	points.push(vec2(centerX+radius/2, centerY+.01), vec2(centerX+radius/2, centerY-.01));
	pointCount+=4;
}

function makeGate(centerX, centerY){
	semiCircle(centerX, centerY);
	drawGateWires(centerX, centerY);
}

function drawGateWires(centerX, centerY){
	points.push(vec2(centerX, centerY+radius/2), vec2(centerX-radius, centerY+radius/2));
	points.push(vec2(centerX, centerY-radius/2), vec2(centerX-radius, centerY-radius/2));
	points.push(vec2(centerX+radius, centerY), vec2(centerX+radius*2, centerY));
	pointCount+=6;
}

function drawPolygon(centerX, centerY, numPoints, radius){
	var theta=0;
	var lastPoint = vec2(centerX + radius, centerY);
	for(var i = 0; i < numPoints+1; i++){
		points.push(lastPoint);
		lastPoint = vec2(radius * Math.cos(theta) +centerX, radius * Math.sin(theta) + centerY); 
		points.push(lastPoint);
		theta+=2*Math.PI/numPoints;
		pointCount += 2;
	}
}

function semiCircle(centerX, centerY){
	var theta=-90*Math.PI/180;
	total = 50;
	var lastPoint = vec2(centerX, centerY - radius);
	for(var i = 0; i < total; i++){
		points.push(lastPoint);
		lastPoint = vec2(radius * Math.cos(theta) +centerX, radius * Math.sin(theta) + centerY); 
		points.push(lastPoint);
		theta+=Math.PI/(total - 1);
		pointCount += 2;
	}
	points.push(vec2(centerX, centerY-radius), vec2(centerX, centerY+radius));
	pointCount += 2;
}
