
var gl;
var points;
var Nrand, GaussAdd, GaussFac;

var n = 3;
var m = 3;
// for(var cells = [];cells.length < n; cells.push([]));
var cells = [];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Compute the vertices for the line as the sum of Gaussian random variables.
    
    points = [vec2(-1.0, -1.0), vec2(-1.0, 1.0), vec2(1.0, 1.0), vec2(1.0, -1.0)]
    for(var i = 0; i < m; i++){
        for(var j = 0; j < n; j++){
            var ratioM = 2/m;
            var ratioN = 2/n;
            var bottomLeft = vec2(ratioM * i - 1, ratioN * j -1);
            var topLeft = vec2(ratioM * i - 1, ratioN * (j+1) - 1);
            var topRight = vec2(ratioM * (i+1)-1, ratioN * (j+1) - 1);
            var bottomRight = vec2(ratioM* (i+1) - 1, ratioN * j - 1);
            cells.push(bottomLeft, topLeft, topLeft, topRight, topRight, bottomRight, bottomRight, bottomLeft);
        } 
    }

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
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cells), gl.STATIC_DRAW );
    
   

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINES, 0, cells.length);
}

