//顶点着色器
var VSHADER_SOURCE =
//传入位置
  'attribute vec4 a_Position;\n' +
  //传入颜色
  'attribute vec4 a_Color;\n' +
  //传入矩阵
  'uniform mat4 u_mvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_mvpMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

//像素着色器
var FSHADER_SOURCE =
  
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  //传入颜色
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

function main() {
  // 获得画布
  var canvas = document.getElementById('webgl');

  //用WebGl绘制上下文
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

  //设置缓存区
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //清楚颜色设定
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // 开启深度检测
  gl.enable(gl.DEPTH_TEST);

  // 矩阵地址赋予
  var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');
  if (!u_mvpMatrix) { 
    console.log('Failed to get the storage location of u_mvpMatrix');
    return;
  }

  //设置矩阵
  var modelMatrix = new Matrix4(); // Model matrix
  var viewMatrix = new Matrix4();  // View matrix
  var projMatrix = new Matrix4();  // Projection matrix
  var mvpMatrix = new Matrix4();   // Model view projection matrix

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0.75, 0, 0);
  viewMatrix.setLookAt(0, 0, 5, 0, 0, -100, 0, 1, 0);
  //设置透视摄像机
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  // 模型视图投影矩阵的计算 
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  // 通过模型视图投影矩阵 
  gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);

    //清楚颜色缓存和深度缓存区
    //开启了就好在哪好像无所谓
   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //画三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);   // Draw the triangles

  // 为另一对三角形准备模型矩阵 
  modelMatrix.setTranslate(-0.75, 0, 0);
  // 模型视图投影矩阵的计算 
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
  // 将模型视图投影矩阵传递到UE-MVP-矩阵 
  gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);

  gl.drawArrays(gl.TRIANGLES, 0, n);   // Draw the triangles
}

function initVertexBuffers(gl) {
  var verticesColors = new Float32Array([
    // Vertex coordinates and color
     0.0,  1.0,   0.0,  0.4,  0.4,  1.0,  // The front blue one 
    -0.5, -1.0,   0.0,  0.4,  0.4,  1.0,
     0.5, -1.0,   0.0,  1.0,  0.4,  0.4, 

     0.0,  1.0,  -2.0,  1.0,  1.0,  0.4, // The middle yellow one
    -0.5, -1.0,  -2.0,  1.0,  1.0,  0.4,
     0.5, -1.0,  -2.0,  1.0,  0.4,  0.4,

     0.0,  1.0,  -4.0,  0.4,  1.0,  0.4, // The back green one
    -0.5, -1.0,  -4.0,  0.4,  1.0,  0.4,
     0.5, -1.0,  -4.0,  1.0,  0.4,  0.4, 
  ]);
  var n = 9;

  // Create a buffer object
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}
