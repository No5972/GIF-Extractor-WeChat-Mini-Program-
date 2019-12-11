/**
 * 1. 将GIF按字节读取然后转换为base64(见之前的github第一版)
 * 2. 将base64输入到gifuct-js(见demo)
 * 3. 读取指定的帧(frameIndex直接控制, 然后renderFrame, 见demo)
 * 4. canvas是看不见的, 把canvas转换成base64然后输出到看得见的Image标签(Canvas.toDataURL)
 * 5. 把Image标签的图片保存到相册(具体实现待定)
 */

var giflib = require("gifuct-js.js");
var GIF = global.GIF;
var gif;
var currentFrame = 0;


function base64ToUint8Array (base64String) {
  　　const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

Page({
  data: {
    title: "GIF逐帧浏览和提取单帧 V0.3 BY 鄙人 使用gifuct-js",
    btn1: "导入",
    btn2: "重置",
    btn3: "保存该帧",
    canvasWidth: 167,
    canvasHeight: 142
  },

  onLoad: function() {
    console.log(giflib.GIF);
  },

  base64ToUint8Array: function (base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = this._atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for(let i = 0; i<rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  

  importHandler: function() {
    var that = this;
    console.log("simulate")
    wx.chooseImage({
      count: 1,
      success: function(res) {
        console.log(res);
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePaths[0],
          encoding: "base64",
          success: function (res2) {
            var base64String = res2.data;
            var base64Header = "data:image/gif;base64,";
            base64String = JSON.stringify(base64String);
            base64String = base64String.substring(1, base64String.length - 1);
            var base64 = base64Header + base64String ;
            
            // console.log(base64);
            // that.setData({ gifPath: base64Header + base64String});
            console.log("simulate convert to bytes begin");
            var base64Bytes = that.base64ToUint8Array(base64String.replace(/[\r\n]/g, ""));
            console.log("simulate convert to bytes finish");
            gif = new GIF(base64Bytes);
            console.log(gif);
            console.log(gif.decompressFrames(true));
            var frameArray = [];
            for (var i in gif.decompressFrames(true)) {
              frameArray.push(parseInt(i)+1);
            }
            
            that.setData({
              canvasWidth: gif.raw.lsd.width,
              canvasHeight: gif.raw.lsd.height,
              array: frameArray
            });

            // ctx.setFillStyle('rgb(255, 0, 0)')
            // ctx.fillRect(10, 10, 150, 100)
            // ctx.draw()
            // ctx.fillRect(50, 50, 150, 100)
            // ctx.draw(true)
            // debugger;
            
            that.setData({ index: 1 });
            // wx.createCanvasContext("renderer").draw();
            wx.canvasPutImageData({
              canvasId: 'renderer',
              data: gif.decompressFrames(true)[0].patch,
              x: gif.decompressFrames(true)[currentFrame].dims.left,
              y: gif.decompressFrames(true)[currentFrame].dims.top,
              width: gif.raw.lsd.width
            })
            
            // console.log()
          }
        })
      }
    })
  },

  resetHandler: function (e) {
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  bindPickerChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    currentFrame = e.detail.value;
    this.setData({
      index: parseInt(e.detail.value) + 1
    })
    // wx.createCanvasContext("renderer").draw();
    wx.canvasPutImageData({
      canvasId: 'renderer',
      data: gif.decompressFrames(true)[currentFrame].patch,
      x: gif.decompressFrames(true)[currentFrame].dims.left,
      y: gif.decompressFrames(true)[currentFrame].dims.top,
      width: gif.decompressFrames(true)[currentFrame].dims.width
    })
  },

  saveHandler: function () {
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: gif.raw.lsd.width, //导出图片的宽
      height: gif.raw.lsd.height, //导出图片的高
      destWidth: gif.raw.lsd.width,
      destHeight: gif.raw.lsd.height,
      canvasId: 'renderer',
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
        })
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: function (res) {
        wx.showToast({
          title: '系统繁忙，请重试',
          icon: 'success',
          duration: 2000
        })
      }
    });
  },

  fwHandler: function() {
    if (currentFrame < gif.raw.frames.length - 2) {
      currentFrame++;
    } else {
      currentFrame = 0;
    }
    this.setData({ index: currentFrame + 1 });
    // wx.createCanvasContext("renderer").draw();
    wx.canvasPutImageData({
      canvasId: 'renderer',
      data: gif.decompressFrames(true)[currentFrame].patch,
      x: gif.decompressFrames(true)[currentFrame].dims.left,
      y: gif.decompressFrames(true)[currentFrame].dims.top,
      width: gif.decompressFrames(true)[currentFrame].dims.width
    })
  },

  bwHandler: function () {
    if (currentFrame > 0) {
      currentFrame--;
    } else {
      currentFrame = gif.raw.frames.length - 2;
    }
    this.setData({ index: currentFrame + 1 });
    // wx.createCanvasContext("renderer").draw();
    wx.canvasPutImageData({
      canvasId: 'renderer',
      data: gif.decompressFrames(true)[currentFrame].patch,
      x: gif.decompressFrames(true)[currentFrame].dims.left,
      y: gif.decompressFrames(true)[currentFrame].dims.top,
      width: gif.decompressFrames(true)[currentFrame].dims.width
    })
  },

  _atob: function (s) {
    const base64hash = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    s = s.replace(/\s|=/g, '');
    var cur,
    prev,
    mod,
    i = 0,
    result =[];

    while(i <s.length) {
      cur = base64hash.indexOf(s.charAt(i));
      mod = i % 4;

      switch (mod) {
        case 0:
          //TODO
          break;
        case 1:
          result.push(String.fromCharCode(prev << 2 | cur >> 4));
          break;
        case 2:
          result.push(String.fromCharCode((prev & 0x0f) << 4 | cur >> 2));
          break;
        case 3:
          result.push(String.fromCharCode((prev & 3) << 6 | cur));
          break;

      }

      prev = cur;
      i++;
    }

  return result.join('');
  }
})


