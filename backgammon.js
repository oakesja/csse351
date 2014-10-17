// Graham Fuller and Jacob Oakes
var gl;
var points = [];
var canvasXOffset;
var canvasYOffset;
var checkerRadius = .07;
var maxPoints = 50000;
var triangleWidth = .15;
var triangleHeight = .8;
var diePointRad = .015;
var diePointNum = 8;
var circlePoints = 20;
var dice = [];
var holders = [];
var jails = [];
var squares = [[],[]];
var circles = [[],[]];
var triangles = [[], []];
var vBuffer;
var cBuffer;

var black = vec4( 0.0, 0.0, 0.0, 1.0 );
var white = vec4( 1.0, 1.0, 1.0, 1.0 );
var brown = vec4( 0.59765625, 0.296875, 0.0, 1.0 )
var red = vec4( 0.9, 0.0, 0.0, 1.0 );
var gold = vec4( 1.0, 215/255, 0.0, 1.0);
var piece1 = vec4( 244/255, 164/255, 96/255, 1.0);
var piece2 = black;
var firstHolderSelected;
var whiteTurn = true;
var legalMoves = [];

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

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, 8*maxPoints, gl.STATIC_DRAW );  

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxPoints, gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    createHolders();
	createJails();
    drawBoard();
    createDice();
    drawDice();

    // click listener
    canvas.addEventListener ("click", function(event) {
        centerX = 2*(event.clientX-canvas.offsetLeft)/canvas.width-1;
        centerY = 2*(canvas.height-event.clientY+canvas.offsetTop)/canvas.height-1;
		if(firstHolderSelected==null){
            if(checkersInJail()){
                firstHolderSelected = true;
            } else if(holders[findNearestHolder(centerX, centerY)].checkers.length!=0){
				firstHolderSelected = findNearestHolder(centerX, centerY);
			}
		}
		else{
			var secondHolderSelected = findNearestHolder(centerX, centerY);
            if(checkersInJail()){
                moveFromJailIfValid(secondHolderSelected);
            } else {
                moveIfValid(firstHolderSelected, secondHolderSelected);
            }
		}
	});
	

    // button listeners
    document.getElementById("reset").onclick = function () {
        window.location.reload();
    };

    document.getElementById("roll-dice").onclick = function () {
        dice[0].roll();
        dice[1].roll();
		if(dice[0].number == dice[1].number){
			legalMoves.push(dice[0].number, dice[1].number);
			legalMoves.push(dice[0].number, dice[1].number);
		}
		else{
			legalMoves.push(dice[0].number, dice[1].number);
		}
		alert(legalMoves);
        redraw();
    };

    render();
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );

    //draws squares
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(squares[0]));
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(squares[1]));

    for(var i=0; i< squares[0].length; i+=4){
        gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
    }

    //draws triangles
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(triangles[0]));
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(triangles[1]));

    for(var i=0; i< triangles[0].length; i+=3){
        gl.drawArrays( gl.TRIANGLES, i, 3 );
    }

    //draws circles
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(circles[0]));
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(circles[1]));

    for(var i=0; i< circles[0].length; i+=circlePoints){
        gl.drawArrays( gl.TRIANGLE_FAN, i, circlePoints );
    }

    requestAnimFrame (render);
}

function moveIfValid(fromHolderIndex, toHolderIndex){
    var valid = true;
    // chose same holder
	if(fromHolderIndex == toHolderIndex){
		valid = false;
	}
	var fromCheckers = holders[fromHolderIndex].checkers;
	var toCheckers = holders[toHolderIndex].checkers;
    // chose a holder with no checkers
	if(fromCheckers.length == 0){
        valid = false;
	}
    // moving backwards
    if(fromHolderIndex - toHolderIndex > 0 && fromCheckers[0] == piece1){
        valid = false;
    }
    // moving backwards
    if(fromHolderIndex - toHolderIndex < 0 && fromCheckers[0] == piece2){
        valid = false;
    }
    // moving to a holder with opposite color and more than 1
	if(toCheckers.length > 1 && toCheckers[0] != fromCheckers[0]){
        valid = false;
	}
    // trying to move opposite color
    if(whiteTurn && fromCheckers[0] != piece1){
        valid = false;
    }
    // trying to move opposite color
    if(!whiteTurn && fromCheckers[0] == piece1){
        valid = false;
    }
    // capture
    if(toCheckers.length > 0 && toCheckers[0] != fromCheckers[0]){
        var piece = holders[toHolderIndex].checkers.pop();
        if(piece == piece2){
            jails[0].checkers.push(piece);
        } else {
            jails[1].checkers.push(piece);
        }
    }
    if(valid){
        var piece = holders[fromHolderIndex].checkers.pop();
        holders[toHolderIndex].checkers.push(piece);
        firstHolderSelected = null;
        redraw();
        changeTurn();
    } else {
        firstHolderSelected = null;
    }
}

function moveFromJailIfValid(toHolderIndex){
    var color;
    if(whiteTurn){
        color = jails[1].checkers[0];
    } else {
        color = jails[0].checkers[0];
    }
    var valid = true;
    var toCheckers = holders[toHolderIndex].checkers;
    // moving to a holder with opposite color and more than 1
    if(toCheckers.length > 1 && toCheckers[0] != color){
        valid = false;
    }
    // capture
    if(toCheckers.length > 0 && toCheckers[0] != color){
        var piece = holders[toHolderIndex].checkers.pop();
        if(piece == piece2){
            jails[0].checkers.push(piece);
        } else {
            jails[1].checkers.push(piece);
        }
    }
    if(valid){
        var piece;
        if(whiteTurn){
            piece = jails[1].checkers.pop();
        } else {
            piece = jails[0].checkers.pop();
        }
        holders[toHolderIndex].checkers.push(piece);
        firstHolderSelected = null;
        redraw();
        changeTurn();
    } else {
        firstHolderSelected = null;
    }
}

function changeTurn(){
    var turn = document.getElementById("turn");
    if(whiteTurn){
        whiteTurn = false;
        turn.value = "Black's Turn";
    } else {
        whiteTurn = true;
        turn.value = "White's Turn";
    }
    if(!possibleToMove()){
        changeTurn();
    }
}

function possibleToMove(){
    if(closedBoard()){
        return false;
    } else {
        return true
    }
}

function closedBoard(){
    var closed = true;
    if(whiteTurn && jails[1].checkers.length > 0){
        for(var i = 0; i < 6; i++){
            if(holders[i].checkers.length == 0 || holders[i].checkers[0] != piece2){
                closed = false;
            }
        }
        return closed;
    }
    if(!whiteTurn && jails[0].checkers.length > 0){
        for(var i = 18; i < 24; i++){
            if(holders[i].checkers.length == 0 || holders[i].checkers[0] != piece1){
                closed = false;
            }
        }
        return closed;
    }
    return false;
}

function checkersInJail(){
    if(whiteTurn && jails[1].checkers.length > 0){
        return true;
    } else if (jails[0].checkers.length > 0){
        return true;
    } else {
        return false;
    }
}

function findNearestHolder(centerX, centerY){
	closest = 0;
    closestDist = 2;
    for(var i=0; i<holders.length; i++){
        var x = holders[i].middle[0];
		var y = holders[i].middle[1];
		var dist = Math.sqrt(Math.pow(x-centerX,2) + Math.pow(y-centerY,2));
		if(dist < closestDist){
			closestDist = dist;
			closest = i;
		}
	}
	return closest;
}
    

function redraw(){
    circles = [[], []];
    squares = [[], []];
    triangles = [[], []];
    drawBoard();
    drawDice();
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
}

function randomBetween(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function drawCircle(centerX, centerY, radius, color){
    var theta=0;
    for(var i = 0; i < circlePoints; i++){
        point = vec2(radius * Math.cos(theta) +centerX, radius * Math.sin(theta) + centerY); 
        circles[0].push(point);
        circles[1].push(color);
        theta+=2*Math.PI/circlePoints;
    }
}

function drawDice(){
    for(var i=0; i<dice.length; i++){
        var die = dice[i]
        drawSquare(die.topLeft, die.topRight, die.bottomRight, die.bottomLeft, white);
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
    var color = black;
    if(value == 1 || value == 5 || value == 3){
        drawCircle(dieCenterx, dieCentery, diePointRad, color);
    }
    
    if(value != 1){
        drawCircle(dieCenterx-triangleWidth/4, dieCentery+triangleWidth/4, diePointRad, color);
        drawCircle(dieCenterx+triangleWidth/4, dieCentery-triangleWidth/4, diePointRad, color);
    }
    
    if(value != 1 && value!=2 && value!=3){
        drawCircle(dieCenterx+triangleWidth/4, dieCentery+triangleWidth/4, diePointRad, color);
        drawCircle(dieCenterx-triangleWidth/4, dieCentery-triangleWidth/4, diePointRad, color);
    }
    
    if(value == 6){
        drawCircle(dieCenterx+triangleWidth/4, dieCentery, diePointRad, color);
        drawCircle(dieCenterx-triangleWidth/4, dieCentery, diePointRad, color);
    }
}

function drawBoard(){
    drawHolders();
    
    // draw boarder
    var topLeft = vec2(-1, 1);
    var topRight = vec2(1, 1);
    var bottomRight = vec2(1, -1);
    var bottomLeft = vec2(-1, -1);
    drawSquare(topLeft, topRight, bottomRight, bottomLeft, brown);

    // draw middle
    topLeft = vec2(-triangleWidth/2, 1);
    topRight = vec2(triangleWidth/2, 1);
    bottomRight = vec2(triangleWidth/2, -1);
    bottomLeft = vec2(-triangleWidth/2, -1);
    drawSquare(topLeft, topRight, bottomRight, bottomLeft, black);
	
	drawJails();    
}

function createJails(){
	var topLeft = vec2(-triangleWidth/2 + .01, -.01);
    var topRight = vec2(triangleWidth/2 - .01, -.01);
    var bottomRight = vec2(triangleWidth/2 -.01, -1);
    var bottomLeft = vec2(-triangleWidth/2 + .01, -1);
	jails.push(new Jail(topLeft, topRight, bottomRight, bottomLeft, true));
	
	topLeft = vec2(-triangleWidth/2 + .01, 1);
    topRight = vec2(triangleWidth/2 -.01, 1);
    bottomRight = vec2(triangleWidth/2 -.01, .01);
    bottomLeft = vec2(-triangleWidth/2 + .01, .01);
	jails.push(new Jail(topLeft, topRight, bottomRight, bottomLeft, false));
}

function drawJails(){
	drawSquare(jails[0].topLeft, jails[0].topRight, jails[0].bottomRight, jails[0].bottomLeft, brown);
    drawSquare(jails[1].topLeft, jails[1].topRight, jails[1].bottomRight, jails[1].bottomLeft, brown);
	drawCheckersJails(jails[0]);
	drawCheckersJails(jails[1]);
}

function createHolders(){
    for(var i = 0; i<13; i++){
        var color = gold;
        if(i%2 == 0){
            color = red;
        }
        if(i!=6){
            holders.push(createHolder(-1+2/13*(12-i), false, color));
        }
    }
    for(var i = 0; i<13; i++){
        var color = red;
        if(i%2 == 0){
            color = gold;
        }
        if(i!=6){
            holders.push(createHolder(-1+2/13*i, true, color));
        }
    }
    holders[0].checkers.push(piece1, piece1);
    holders[5].checkers.push(piece2, piece2, piece2, piece2, piece2);
    holders[7].checkers.push(piece2, piece2, piece2);
    holders[11].checkers.push(piece1, piece1, piece1, piece1, piece1);
    holders[12].checkers.push(piece2, piece2, piece2, piece2, piece2);
    holders[16].checkers.push(piece1, piece1, piece1);
    holders[18].checkers.push(piece1, piece1, piece1, piece1, piece1);
    holders[23].checkers.push(piece2, piece2);
}

function createHolder(upLeft, flip, color){
    if(flip==false){
        var left = vec2(upLeft, 1);
        var right = vec2(upLeft+triangleWidth, 1);
        var middle = vec2(upLeft+triangleWidth/2, 1-triangleHeight);
        return new Holder(middle, left, right, flip, color);
    }
    else{
        var left = vec2(upLeft, -1);
        var right = vec2(upLeft+triangleWidth, -1);
        var middle = vec2(upLeft+triangleWidth/2, -1+triangleHeight);
        return new Holder(middle, left, right, flip, color);
    }
}

function drawHolders(){
    var i;
    for(i=0; i<holders.length; i++){
        holder = holders[i];
        triangles[0].push(holder.left, holder.right, holder.middle);
        triangles[1].push(holder.color, holder.color, holder.color);
        drawCheckers(holder);
    }
}

function drawCheckers(holder){
    for(var j=0; j<holder.checkers.length; j++){
        var x = holder.left[0] + triangleWidth/2;
        var y;
        if(holder.flipped){
            y = holder.left[1] + checkerRadius+ 2*checkerRadius*j;
        } else {
            y = holder.left[1] - checkerRadius- 2*checkerRadius*j;
        }
        drawCircle(x, y, checkerRadius, holder.checkers[j]);
    }
}

function drawCheckersJails(jail){
    for(var j=0; j<jail.checkers.length; j++){
        var y;
        if(jail.flipped){
            y = jail.bottomLeft[1] + checkerRadius+ 2*checkerRadius*j;
        } else {
            y = jail.topLeft[1] - checkerRadius- 2*checkerRadius*j;
        }
        drawCircle(0, y, checkerRadius, jail.checkers[j]);
    }
}

function drawSquare(topLeft, topRight, bottomRight, bottomLeft, color){
    squares[0].push(topLeft, topRight, bottomRight, bottomLeft);
    squares[1].push(color, color, color, color);
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

function Holder(middle, left, right, flipped, color){
    this.middle = middle
    this.left = left;
    this.right = right;
    this.flipped = flipped;
    this.color = color;
    this.checkers = [];
}

function Jail(topLeft, topRight, bottomRight, bottomLeft, flipped){
	this.topLeft = topLeft;
	this.topRight = topRight;
	this.bottomRight = bottomRight;
	this.bottomLeft = bottomLeft;
	this.flipped = flipped;
	this.checkers = [];
}

