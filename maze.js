
var gl;
var points;
var Nrand, GaussAdd, GaussFac;

var n = 4;
var m = 4;
for(var cells = [];cells.length < n; cells.push([]));
var points = [];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Compute the vertices for the line as the sum of Gaussian random variables.
    
    for(var i = 0; i < m; i++){
        for(var j = 0; j < n; j++){
            var ratioM = 2/m;
            var ratioN = 2/n;
            var bottomLeft = vec2(ratioM * i - 1, ratioN * j -1);
            var topLeft = vec2(ratioM * i - 1, ratioN * (j+1) - 1);
            var topRight = vec2(ratioM * (i+1)-1, ratioN * (j+1) - 1);
            var bottomRight = vec2(ratioM* (i+1) - 1, ratioN * j - 1);
            cells[i][j] = new Cell(bottomLeft, topLeft, topRight, bottomRight);
        } 
    }

    addOuterWalls();
    completeMaze();
    getPointsFromCells();

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
   

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINES, 0, points.length);
}

function addOuterWalls(){
    for(var i = 0; i < n; i++){
        cells[i][0].bottomLine = true;
        cells[i][m-1].topLine = true;
    }
    for(i = 0; i < m; i++){
        cells[0][i].leftLine = true;
        cells[n-1][i].rightLine = true;
    }
}

function completeMaze(){
    for(var i = 0; i < m; i++){
        cells[1][i].rightLine = true;
    }
}

function getPointsFromCells(){
    for(var i = 0; i < m; i++){
        for(var j = 0; j < n; j++){
            var cell = cells[i][j];
            if(cell.leftLine){
                points.push(cell.bottomLeft, cell.topLeft);
            }
            if(cell.topLine){
                points.push(cell.topLeft, cell.topRight);
            }
            if(cell.rightLine){
                points.push(cell.topRight, cell.bottomRight);
            }
            if(cell.bottomLine){
                points.push(cell.bottomRight, cell.bottomLeft);
            }
        } 
    }
}

function Cell(bottomLeft, topLeft, topRight, bottomRight){
    this.bottomLeft = bottomLeft;
    this.topLeft = topLeft;
    this.topRight = topRight;
    this.bottomRight = bottomRight;
    this.leftLine = false;
    this.rightLine = false;
    this.topLine = false;
    this.bottomLine = false;
}

