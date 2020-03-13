//顶点着色器
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute float a_PointSize;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = a_PointSize;\n' +
  '}\n';
//片元着色器
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

function main() {
  // 获得画布
  var canvas = document.getElementById('webgl');

  //用WebGL绘制上下文
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  //初始化shader
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 设置缓存区
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // 清楚颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // 
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 画点
  gl.drawArrays(gl.POINTS, 0, n);
}

function initVertexBuffers(gl) {
  //传入缓存区顶点坐标
  var vertices = new Float32Array([
    0.0, 0.5,   -0.5, -0.5,   0.5, -0.5
  ]);
  var n = 3;
  //传入大小值
  var sizes = new Float32Array([
    10.0, 20.0, 30.0  // Point sizes
  ]);

  // Create a buffer object
  //创建缓存区
  var vertexBuffer = gl.createBuffer();  
  var sizeBuffer = gl.createBuffer();
  if (!vertexBuffer || !sizeBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  //绑定顶点缓存区
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  //传入值得画好多次
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  //把点传入
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  //设置
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  //开启
  gl.enableVertexAttribArray(a_Position);

  // Bind the point size buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
  var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
  if(a_PointSize < 0) {
    console.log('Failed to get the storage location of a_PointSize');
    return -1;
  }
  gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_PointSize);

  // 解除绑定
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}
