// Jacob Oakes
// used recursive algorithm to generate maze found here: http://weblog.jamisbuck.org/2011/1/12/maze-generation-recursive-division-algorithm

var gl;
var points;

var rows = 20;
var cols = 20;
for(var cells = [];cells.length < rows; cells.push([]));
var points = [];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Compute the vertices for each cell in the maze 
    var ratioCols = 2/(cols + 1);
    var ratioRows = 2/(rows + 1);   
    for(var i = 0; i < rows; i++){
        for(var j = 0; j < cols; j++){
            var bottomLeft = vec2(ratioCols * i - 1, ratioRows * j -1);
            var topLeft = vec2(ratioCols * i - 1, ratioRows * (j+1) - 1);
            var topRight = vec2(ratioCols * (i+1)-1, ratioRows * (j+1) - 1);
            var bottomRight = vec2(ratioCols* (i+1) - 1, ratioRows * j - 1);
            cells[i][j] = new Cell(bottomLeft, topLeft, topRight, bottomRight);
        } 
    }

    // construct the maze
    addOuterWalls();
    addWalls(0, rows, 0, cols, 0);

    // find the points for the lines for the maze
    getPointsFromCells();
    
    //  Configure WebGL
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
    for(var i = 0; i < rows; i++){
        cells[i][0].bottomLine = true;
        cells[i][cols-1].topLine = true;
    }
    for(i = 0; i < cols; i++){
        cells[0][i].leftLine = true;
        cells[rows-1][i].rightLine = true;
    }
    createOuterOpenings()
}

function createOuterOpenings(){
    var orientation = randomBetween(0, 1);
    if(orientation == 0){
        cells[0][randomBetween(0, cols - 1)].leftLine = false;
        cells[rows - 1][randomBetween(0, cols - 1)].rightLine = false;
    } else {
        cells[randomBetween(0, rows - 1)][0].bottomLine = false;
        cells[randomBetween(0, rows - 1)][cols -1].topLine = false;
    }
}

function addWalls(rowStart, rowEnd, colStart, colEnd, count){
    var numRows = rowEnd - rowStart;
    var numCols = colEnd - colStart;
    count+=1;
    if (numRows <= 1 && numCols <= 1){
        return;
    } else if ( numRows >= numCols){
        var divRow = Math.floor(numRows/2) + rowStart;
        createVerticalWall(divRow, colStart, colEnd);
        addWalls(divRow, rowEnd, colStart, colEnd, count);
        addWalls(rowStart, divRow, colStart, colEnd, count);
    } else {
        var divCol = Math.floor(numCols/2) + colStart;
        createHorizontalWall(divCol, rowStart, rowEnd);
        addWalls(rowStart, rowEnd, divCol, colEnd, count);
        addWalls(rowStart, rowEnd, colStart, divCol, count);
    }
}

function createVerticalWall(row, start, end){
    for(var i = start; i < end; i++){
        cells[row][i].leftLine = true;
    }
    var chosen = randomBetween(start, end - 1);
    cells[row][chosen].leftLine = false;
}

function createHorizontalWall(col, start, end){
    for(var i = start; i < end; i++){
        cells[i][col].bottomLine = true;
    }
    var chosen = randomBetween(start, end - 1);
    cells[chosen][col].bottomLine = false;
}

function getPointsFromCells(){
    for(var i = 0; i < rows; i++){
        for(var j = 0; j < cols; j++){
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

function randomBetween(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min
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

