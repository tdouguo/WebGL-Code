// RotateObject.js (c) 2012 matsuda and kanda
// 顶点着色器
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

function main() {
  //得到webgl根据标签
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // 初始化着色器
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  //设置顶点信息
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // 设置清除颜色以及深度测试
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //从本地内存中获得矩阵
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!u_MvpMatrix) { 
    console.log('Failed to get the storage location of uniform variable');
    return;
  }

  // 计算视图投影矩阵
  var viewProjMatrix = new Matrix4();
  //赋值
  viewProjMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 100.0);
  viewProjMatrix.lookAt(3.0, 3.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  //设置现在的角度
  var currentAngle = [0.0, 0.0]; // Current rotation angle ([x-axis, y-axis] degrees)
  initEventHandlers(canvas, currentAngle);

  //设置贴图
  if (!initTextures(gl)) {
    console.log('Failed to intialize the texture.');
    return;
  }

  var tick = function() {   // Start drawing
    draw(gl, n, viewProjMatrix, u_MvpMatrix, currentAngle);
    requestAnimationFrame(tick, canvas);
  };
  tick();
}

function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([   // Texture coordinates
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
      0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
      1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  //创建索引顶点着色器
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    return -1;
  }

  //
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) return -1; // Vertex coordinates
  if (!initArrayBuffer(gl, texCoords, 2, gl.FLOAT, 'a_TexCoord')) return -1;// Texture coordinates

  // 绑定空缓存
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  //写入索引缓存器
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}



function initEventHandlers(canvas, currentAngle) {
  var dragging = false;         // Dragging or not
  var lastX = -1, lastY = -1;   // Last position of the mouse

  canvas.onmousedown = function(ev) {   // Mouse is pressed
    var x = ev.clientX, y = ev.clientY;
    //计算画布边界
    var rect = ev.target.getBoundingClientRect();
    //在画布边界里面的时候所作的操作
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      lastX = x; lastY = y;
      dragging = true;
    }
  };



  //当鼠标放开的时候  拖拽功能变为false
  canvas.onmouseup = function(ev) { dragging = false;  }; // Mouse is released
  //当鼠标移动的时候判断转多少度
  canvas.onmousemove = function(ev) { // Mouse is moved
    var x = ev.clientX, y = ev.clientY;
    if (dragging) {
      var factor = 100/canvas.height; // The rotation ratio
      var dx = factor * (x - lastX);
      var dy = factor * (y - lastY);
      // Limit x-axis rotation angle to -90 to 90 degrees
      currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
      currentAngle[1] = currentAngle[1] + dx;
    }
    lastX = x, lastY = y;
  };
}



var g_MvpMatrix = new Matrix4(); // Model view projection matrix
function draw(gl, n, viewProjMatrix, u_MvpMatrix, currentAngle) {
  // Caliculate The model view projection matrix and pass it to u_MvpMatrix
  g_MvpMatrix.set(viewProjMatrix);
  g_MvpMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // Rotation around x-axis
  g_MvpMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // Rotation around y-axis
  gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);     // Clear buffers
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);   // Draw the cube
}

function initArrayBuffer(gl, data, num, type, attribute) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  //设置顶点
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  //开启缓存
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function initTextures(gl) {
  //创建一个图片
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  //找到本地的采样器
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  //
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  //创建图片资源
  var image = new Image();
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  //当图像加载完成时，注册要调用的事件处理程序 
  image.onload = function(){ loadTexture(gl, texture, u_Sampler, image); };
  // 传入照片地址
  image.src = '../resources/sky.jpg';

  return true;
}

function loadTexture(gl, texture, u_Sampler, image) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // 反转图片Y轴
  //激活纹理unit0
  gl.activeTexture(gl.TEXTURE0);
  // 绑定纹理
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 设置纹理参数
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // 设置图片绑定纹理
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Pass the texure unit 0 to u_Sampler
  gl.uniform1i(u_Sampler, 0);
}
