// FramebufferObject.js (c) matsuda and kanda
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

//像素着色器
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

// 屏幕大小
var OFFSCREEN_WIDTH = 256;
var OFFSCREEN_HEIGHT = 256;

function main() {
  // 获得画布
  var canvas = document.getElementById('webgl');

  //用WebGl绘制上下文
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

  // 获取属性变量和一致变量的存储位置 
  var program = gl.program; //获得系统gl
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  if (program.a_Position < 0 || program.a_TexCoord < 0 || !program.u_MvpMatrix) {
    console.log('Failed to get the storage location of a_Position, a_TexCoord, u_MvpMatrix');
    return;
  }

  // 设置顶点信息，cube里面有buffer，顶点buffer
  var cube = initVertexBuffersForCube(gl);
  var plane = initVertexBuffersForPlane(gl);
  if (!cube || !plane) {
    console.log('Failed to set the vertex information');
    return;
  }

  // 初始化texture
  var texture = initTextures(gl);
  if (!texture) {
    console.log('Failed to intialize the texture.');
    return;
  }

  // Initialize framebuffer object (FBO)
  //初始化帧缓存对象
  var fbo = initFramebufferObject(gl);
  if (!fbo) {
    console.log('Failed to intialize the framebuffer object (FBO)');
    return;
  }

  //开启深度缓冲
  gl.enable(gl.DEPTH_TEST);   //  gl.enable(gl.CULL_FACE);

  var viewProjMatrix = new Matrix4();   // 准备好视图投影矩阵
  //设置矩阵
  viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1.0, 100.0);
  viewProjMatrix.lookAt(0.0, 0.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
  //帧缓存
  var viewProjMatrixFBO = new Matrix4();   // 帧缓存矩阵
  viewProjMatrixFBO.setPerspective(30.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);
  viewProjMatrixFBO.lookAt(0.0, 2.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

  //开始画
  var currentAngle = 0.0; // Current rotation angle (degrees)
  var tick = function() {
    currentAngle = animate(currentAngle);  // 计算旋转角度
    //传入渲染程序，
    draw(gl, canvas, fbo, plane, cube, currentAngle, texture, viewProjMatrix, viewProjMatrixFBO);
    window.requestAnimationFrame(tick, canvas);
  };
  tick();
}

//初始化顶点坐标
function initVertexBuffersForCube(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  // 顶点坐标
  var vertices = new Float32Array([
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
  ]);

  //UV坐标
  var texCoords = new Float32Array([
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
      0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
      1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
      1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
      0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
  ]);

  // 索引坐标
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ])

  var o = new Object();  // Create the "Object" object to return multiple objects.

  //创建两个缓存区和一个索引缓存区
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null; 
//传入索引点数
  o.numIndices = indices.length;

  // 解绑缓存区
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

function initVertexBuffersForPlane(gl) {
  // Create face
  //  v1------v0
  //  |        | 
  //  |        |
  //  |        |
  //  v2------v3

  // Vertex coordinates
  var vertices = new Float32Array([
    1.0, 1.0, 0.0,  -1.0, 1.0, 0.0,  -1.0,-1.0, 0.0,   1.0,-1.0, 0.0    // v0-v1-v2-v3
  ]);

  // Texture coordinates
  var texCoords = new Float32Array([1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0]);

  // Indices of the vertices
  var indices = new Uint8Array([0, 1, 2,   0, 2, 3]);

  var o = new Object(); // Create the "Object" object to return multiple objects.

  // Write vertex information to buffer object
  o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
  o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
  o.indexBuffer = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
  if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null; 

  o.numIndices = indices.length;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  //创建一个buffer
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // 绑定缓冲区，写入缓存区
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  buffer.type = type;

  return buffer;
}

function initTextures(gl) {
  //创建一个texture
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the Texture object');
    return null;
  }

  // 获得存储在本地的u_Sampler
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return null;
  }

  var image = new Image();  //创造一个image对象
    if (!image) {
    console.log('Failed to create the Image object');
    return null;
  }
  // 当图像加载完成时，注册要调用的事件处理程序 
  image.onload = function() {
    //将image中的信息写入Texture
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // Pass the texure unit 0 to u_Sampler
    //通过0号通道图片的采样器
    gl.uniform1i(u_Sampler, 0);
    //解绑
    gl.bindTexture(gl.TEXTURE_2D, null); // Unbind the texture object
  };

  // 开始加载图片
  image.src = '../resources/sky_cloud.jpg';

  return texture;
}
//初始化帧缓存数据
function initFramebufferObject(gl) {
  var framebuffer, texture, depthBuffer;

  // 定义错误处理函数 
  var error = function() {
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    if (texture) gl.deleteTexture(texture);
    if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
    return null;
  }

  //创建一个帧缓存FBO
  framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.log('Failed to create frame buffer object');
    return error();
  }

  // 创建纹理对象并设置其大小和参数 
  texture = gl.createTexture(); // 创建一个贴图纹理对象
  if (!texture) {
    console.log('Failed to create texture object');
    return error();
  }
  gl.bindTexture(gl.TEXTURE_2D, texture); //绑定类型
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  framebuffer.texture = texture; //存储纹理对象 store存储，将帧缓存区中的颜色关联对象存储好纹理对象

  // 创建渲染对象并设置其大小和参数
  depthBuffer = gl.createRenderbuffer(); //创建一个渲染缓冲区，将帧缓存区的深度关联对象绑定
  if (!depthBuffer) {
    console.log('Failed to create renderbuffer object');
    return error();
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // 绑定类型
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

  //将纹理和渲染缓冲区对象附加到FBO 
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  // 检查FBO是否配置正确
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (gl.FRAMEBUFFER_COMPLETE !== e) {
    console.log('Frame buffer object is incomplete: ' + e.toString());
    return error();
  }

  // 释放缓存区
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);


  return framebuffer;
}
function draw(gl, canvas, fbo, plane, cube, angle, texture, viewProjMatrix, viewProjMatrixFBO) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);              // 将绘图目的地更改为FBO 
  gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // 设置FBO的视口 

  gl.clearColor(0.2, 0.2, 0.4, 1.0); // Set clear color (the color is slightly changed)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  //清除FBO 

  drawTexturedCube(gl, gl.program, cube, angle, texture, viewProjMatrixFBO);   //画立方体 

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);        // 将绘图目标更改为颜色缓冲区 
  gl.viewport(0, 0, canvas.width, canvas.height);  // Set the size of viewport back to that of <canvas>

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer

  drawTexturedPlane(gl, gl.program, plane, angle, fbo.texture, viewProjMatrix);  // Draw the plane
}

// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();

function drawTexturedCube(gl, program, o, angle, texture, viewProjMatrix) {
  //计算模型rotate
  g_modelMatrix.setRotate(20.0, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);

  //计算模型视图项目矩阵，并将其传递给UE-MVP-矩阵 
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);
  //画图片Object
  drawTexturedObject(gl, program, o, texture);
}

function drawTexturedPlane(gl, program, o, angle, texture, viewProjMatrix) {
  //创建mvp
  g_modelMatrix.setTranslate(0, 0, 1);
  g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);

  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);
  //画贴图
  drawTexturedObject(gl, program, o, texture);
}
//
function drawTexturedObject(gl, program, o, texture) {
  //分配缓冲对象并启用赋值 
  initAttributeVariable(gl, program.a_Position, o.vertexBuffer);    // Vertex coordinates
  initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);  // Texture coordinates

  // 将纹理对象绑定到目标 
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  //绑定索引缓存 画
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
  gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}

// Assign the buffer objects and enable the assignment
function initAttributeVariable(gl, a_attribute, buffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

function drawTexturedCube2(gl, o, angle, texture, viewpProjMatrix, u_MvpMatrix) {
  //计算模型矩阵
  g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
  g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
  g_modelMatrix.scale(1, 1, 1);

  // 计算mvp矩阵比那个将他传给该穿的值
  g_mvpMatrix.set(vpMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

  drawTexturedObject(gl, o, texture);
}

var ANGLE_STEP = 30;   //旋转角度（度）的增量 
var last = Date.now(); // Last time that this function was called
function animate(angle) {
  var now = Date.now();   // Calculate the elapsed time
  var elapsed = now - last;
  last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle % 360;
}
