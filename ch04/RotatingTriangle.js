//顶点着色器
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '}\n';

//像素着色器
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

//旋转角速度/s
var ANGLE_STEP = 45.0;
//主函数
function main() {
  //得到画布
  var canvas = document.getElementById('webgl');

  // 渲染上下文
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

  //设置顶点缓存
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  //清除颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //Get storage location of u_ModelMatrix
  //获得矩阵变量
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Current rotation angle
  //设置现在的角度
  var currentAngle = 0.0;
  // Model matrix
  //初始化矩阵
  var modelMatrix = new Matrix4();

  //开始绘画
  var tick = function() {
    currentAngle = animate(currentAngle);  // 更新旋转角度
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   //画角度
    requestAnimationFrame(tick, canvas); // 回调tick函数
  };
  tick();
}

function initVertexBuffers(gl) {
  //传入顶点数据
  var vertices = new Float32Array ([
    0, 0.5,   -0.5, -0.5,   0.5, -0.5
  ]);
  //三个点
  var n = 3;   // The number of vertices

  // Create a buffer object
  //创建缓存
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  //绑定缓存为顶点缓存
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  //为缓存中写入点，传入多点需要画不止一次
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  //获得本地位置position
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  //设置将缓存值按规则传给position
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  //激活缓存值
  gl.enableVertexAttribArray(a_Position);

  return n;
}
//绘画函数
function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
  // Set the rotation matrix
  //设置旋转函数
  modelMatrix.setRotate(currentAngle, 0, 0, 1); // Rotation angle, rotation axis (0, 0, 1)
 
  // Pass the rotation matrix to the vertex shader
  //把旋转矩阵传送给顶点着色器
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Clear <canvas>
  //清楚缓存色
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  //画点
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

// 记录上一次调用函数的时刻
var g_last = Date.now();
function animate(angle) {
  //计算经过了多少事件
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  //计算增加了的角度
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}
