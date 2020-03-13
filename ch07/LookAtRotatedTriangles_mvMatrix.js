// LookAtRotatedTriangles_modelViewMatrix.js (c) 2012 matsuda
// 顶点着色器
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_ModelViewMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelViewMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

//片元着色器
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

function main() {
  // 从浏览器中获得画布
  var canvas = document.getElementById('webgl');

  // 用WebGl画上下文
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  //初始化着色器
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 初始化着色器缓存
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //清理颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //获得本地旋转矩阵
  var u_ModelViewMatrix = gl.getUniformLocation(gl.program, 'u_ModelViewMatrix');
  if(!u_ModelViewMatrix) { 
    console.log('u_ModelViewMatrixの格納場所の取得に失敗');
    return;
  }

  // 设置视角矩阵
  var viewMatrix = new Matrix4();
  viewMatrix.setLookAt(0.20, 0.25, 0.25, 0, 0, 0, 0, 1, 0);

  // 计算矩阵旋转后的
  var modelMatrix = new Matrix4();
  modelMatrix.setRotate(-10, 0, 0, 1);

  //旋转矩阵与视角矩阵相乘
  var modelViewMatrix = viewMatrix.multiply(modelMatrix);

  // 将值传入着色器中
  gl.uniformMatrix4fv(u_ModelViewMatrix, false, modelViewMatrix.elements);

  // 清楚画布
  gl.clear(gl.COLOR_BUFFER_BIT);

  //画三角形
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
  var verticesColors = new Float32Array([
    // Vertex coordinates and color
     0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
    -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
     0.5, -0.5,  -0.4,  1.0,  0.4,  0.4, 
   
     0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
    -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
     0.0, -0.6,  -0.2,  1.0,  1.0,  0.4, 

     0.0,  0.5,   0.0,  0.4,  0.4,  1.4,  // The front blue one 
    -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
     0.5, -0.5,   0.0,  1.0,  0.4,  0.4, 
  ]);
  var n = 9;

  // 创建一个缓存
  var vertexColorBuffer = gl.createBuffer();  
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // 绑定缓存为顶点缓存
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  //顶点缓存里面传值
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
  //获得每个元素的位数
  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // 获得本地a_position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  //传入值
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  //传入值
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}
