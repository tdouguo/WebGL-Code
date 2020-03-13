//顶点着色器
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  //传入的纹理坐标
  'attribute vec2 a_TexCoord;\n' +
  //传给像素着色器
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

//像素着色器
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  //得到sampler2D采样器
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

function main() {
  //从HTML文件中找到Webgl
  var canvas = document.getElementById('webgl');

  // 用WebGL渲染上下文
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

  //设置缓存
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //清楚颜色
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //设置图片
  if (!initTextures(gl, n)) {
    console.log('Failed to intialize the texture.');
    return;
  }
}

function initVertexBuffers(gl) {
  //传入数据
  var verticesTexCoords = new Float32Array([
    // Vertex coordinates, texture coordinate
    -0.5,  0.5,   0.0, 1.0,
    -0.5, -0.5,   0.0, 0.0,
     0.5,  0.5,   1.0, 1.0,
     0.5, -0.5,   1.0, 0.0,
  ]);
  //有四个点
  var n = 4; // The number of vertices

  // Create the buffer object
  //创建缓存区
  var vertexTexCoordBuffer = gl.createBuffer();
  if (!vertexTexCoordBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  //绑定缓存区
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  //将数据传入缓存区
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);
  //获得每个值的位数
  var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
  //关联着色器中的值和我们定义的值
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  //传入值规则
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
  //激活缓存区队列
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  //关联值
  var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoord < 0) {
    console.log('Failed to get the storage location of a_TexCoord');
    return -1;
  }
  //传入值
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
  //激活缓存区队列
  gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object

  return n;
}
//初始化图片
function initTextures(gl, n) {
  //创建一个texture
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  // 获得U_sampler的存储位置
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }
  //创建image
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  //在加载图像时调用事件处理程序 
  //加载图片
  image.onload = function(){ loadTexture(gl, n, texture, u_Sampler, image); };
  // Tell the browser to load an image
  //告诉浏览器加载图像 
  image.src = '../resources/sky.jpg';

  return true;
}

function loadTexture(gl, n, texture, u_Sampler, image) {
  //
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // 翻转图像的Y轴 
  // 开启0号纹理单元 
  gl.activeTexture(gl.TEXTURE0);
  // 将纹理对象绑定到目标
  gl.bindTexture(gl.TEXTURE_2D, texture);

  //设置纹理参数 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // 设置纹理图像 
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // 将纹理单元0设置到取样器 
  gl.uniform1i(u_Sampler, 0);
  
  gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, n); // Draw the rectangle
}
