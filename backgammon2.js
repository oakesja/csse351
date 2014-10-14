// Graham Fuller and Jacob Oakes
var gl;
var points = [];
var canvasXOffset;
var canvasYOffset;
var maxPoints = 50000;
var triangleWidth = .15;
var triangleHeight = .8;
var diePointRad = .015;
var diePointNum = 8;
var dice = [];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
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

    drawBoard();
    createDice();
    drawDice();

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    // button listeners
    document.getElementById("reset").onclick = function () {
        window.location.reload();
    };

    document.getElementById("roll-dice").onclick = function () {
        dice[0].roll();
        dice[1].roll();
        points = [];
        drawBoard();
        drawDice();
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    };

    render();
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINES, 0, points.length);
    requestAnimFrame (render);
}

function randomBetween(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function drawPolygon(centerX, centerY, numPoints, radius){
    var theta=0;
    var lastPoint = vec2(centerX + radius, centerY);
    for(var i = 0; i < numPoints+1; i++){
        points.push(lastPoint);
        lastPoint = vec2(radius * Math.cos(theta) +centerX, radius * Math.sin(theta) + centerY); 
        points.push(lastPoint);
        theta+=2*Math.PI/numPoints;
    }
}

function drawDice(){
    for(var i=0; i<dice.length; i++){
        var die = dice[i]
        points.push(die.topLeft);
        points.push(die.topRight);
        points.push(die.topRight);
        points.push(die.bottomRight);
        points.push(die.bottomRight);
        points.push(die.bottomLeft);
        points.push(die.bottomLeft);
        points.push(die.topLeft);
        points.push(vec2(-0.3, 0.075))
        points.push(vec2(-0.3, -0.075))
        drawNumberOnDie(die.centerX, die.centerY, die.number);
    }
}

function createDice(){
    dice = [createDie(-triangleWidth*2, triangleWidth/2),
            createDie(triangleWidth, triangleWidth/2)]
}

function createDie(topLeftx, topLefty){
    var topLeft = vec2(topLeftx, topLefty);
    var topRight = vec2(topLeftx+triangleWidth, topLefty);
    var bottomRight = vec2(topLeftx+triangleWidth, -topLefty);
    var bottomLeft = vec2(topLeftx, -topLefty);
    var centerX = topLeftx + triangleWidth/2;
    var centerY = topLefty - triangleWidth/2;
    return new Die(topLeft, topRight, bottomRight, bottomLeft, centerX, centerY, 1)
}

function drawNumberOnDie(dieCenterx, dieCentery, value){
    
    if(value == 1 || value == 5 || value == 3){
        drawPolygon(dieCenterx, dieCentery, diePointNum, diePointRad);
    }
    
    if(value != 1){
        drawPolygon(dieCenterx-triangleWidth/4, dieCentery+triangleWidth/4, diePointNum, diePointRad);
        drawPolygon(dieCenterx+triangleWidth/4, dieCentery-triangleWidth/4, diePointNum, diePointRad);
    }
    
    if(value != 1 && value!=2 && value!=3){
        drawPolygon(dieCenterx+triangleWidth/4, dieCentery+triangleWidth/4, diePointNum, diePointRad);
        drawPolygon(dieCenterx-triangleWidth/4, dieCentery-triangleWidth/4, diePointNum, diePointRad);
    }
    
    if(value == 6){
        drawPolygon(dieCenterx+triangleWidth/4, dieCentery, diePointNum, diePointRad);
        drawPolygon(dieCenterx-triangleWidth/4, dieCentery, diePointNum, diePointRad);
    }
}

function drawBoard(){
    for(var i = 0; i<13; i++){
        if(i!=6){
            drawTriangle(-1+2/13*i, false);
            drawTriangle(-1+2/13*i, true);
        }
    }
    
    // draw boarder
    var topLeft = vec2(-1, 1);
    var topRight = vec2(1, 1);
    var bottomRight = vec2(1, -1);
    var bottomLeft = vec2(-1, -1);
    points.push(topLeft);
    points.push(topRight);
    points.push(topRight);
    points.push(bottomRight);
    points.push(bottomRight);
    points.push(bottomLeft);
    points.push(bottomLeft);
    points.push(topLeft);

    // draw middle
    topLeft = vec2(-triangleWidth/2, 1);
    topRight = vec2(triangleWidth/2, 1);
    bottomRight = vec2(triangleWidth/2, -1);
    bottomLeft = vec2(-triangleWidth/2, -1);
    
    points.push(topLeft);
    points.push(topRight);
    points.push(topRight);
    points.push(bottomRight);
    points.push(bottomRight);
    points.push(bottomLeft);
    points.push(bottomLeft);
    points.push(topLeft);
}


function drawTriangle(upLeft, flip){
    if(flip==false){
        var point1 = vec2(upLeft, 1);
        var point2 = vec2(upLeft+triangleWidth, 1);
        var point3 = vec2(upLeft+triangleWidth/2, 1-triangleHeight);
        points.push(point1);
        points.push(point2);
        points.push(point2);
        points.push(point3);
        points.push(point3);
        points.push(point1);
    }
    else{
        var point1 = vec2(upLeft, -1);
        var point2 = vec2(upLeft+triangleWidth, -1);
        var point3 = vec2(upLeft+triangleWidth/2, -1+triangleHeight);
        points.push(point1);
        points.push(point2);
        points.push(point2);
        points.push(point3);
        points.push(point3);
        points.push(point1);
    }
}

function Die(topLeft, topRight, bottomRight, bottomLeft, centerX, centerY, number){
    this.topLeft = topLeft;
    this.topRight = topRight;
    this.bottomRight = bottomRight;
    this.bottomLeft = bottomLeft;
    this.centerX = centerX;
    this.centerY = centerY;
    this.number = number;
    this.roll = roll;
}

function roll(){
    this.number = randomBetween(1,6);
}

