/**
 * 1. 将GIF按字节读取然后转换为base64(见之前的github第一版)
 * 2. 将base64输入到gifuct-js(见demo)
 * 3. 读取指定的帧(frameIndex直接控制, 然后renderFrame, 见demo)
 * 4. canvas是看不见的, 把canvas转换成base64然后输出到看得见的Image标签(Canvas.toDataURL)
 * 5. 把Image标签的图片保存到相册(具体实现待定)
 */

var giflib = require("gifuct-js.js");
var figlib = require("fig.js");
var upng = require("UPNG.js");
var GIF = global.GIF;
var gif;
var FIG = global.fig;
var figgif;
var currentFrame = 0;
var base64Strings = [];
var allFrames = [];
var frameDelays = [];
var t;
var pageInstance = {};
var isReset = true;
function timedCount() {
  pageInstance.fwHandler();
  t = setTimeout(timedCount, frameDelays[currentFrame]);
}


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

function dataURLtoFile(dataurl, filename) {//将base64转换为文件
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

function confirmEnding(str, target) {
  // 请把你的代码写在这里
  var start = str.length - target.length;
  var arr = str.substr(start, target.length);
  if (arr == target) {
    return true;
  }
  return false;
}

Page({
  data: {
    title: "GIF逐帧浏览和提取单帧 V0.3 BY 鄙人 使用gifuct-js",
    btn1: "导入",
    btn2: "重置",
    btn3: "保存该帧",
    btn4: "保存全部\r\n(开发中)",
    max: 0,
    canvasWidth: 167,
    canvasHeight: 142
  },

  onLoad: function() {
    console.log(giflib.GIF);
    pageInstance = this;
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
        if (!confirmEnding(res.tempFilePaths[0], ".gif")) {
          wx.showToast({
            title: '错误: 只能导入.gif后缀的图片!',
            icon: "none"
          })
          return;
        }
        wx.showLoading({
          title: '读取中!'
        });
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
            allFrames = gif.decompressFrames(true);
            console.log(gif);
            console.log(allFrames);
            var frameArray = [];
            for (var i in allFrames) {
              frameArray.push(parseInt(i)+1);
              frameDelays.push(allFrames[i].delay);
            }
            
            
            that.setData({
              canvasWidth: gif.raw.lsd.width,
              canvasHeight: gif.raw.lsd.height,
              array: frameArray,
              totalFrames: frameArray.length - 1
            });

            // ctx.setFillStyle('rgb(255, 0, 0)')
            // ctx.fillRect(10, 10, 150, 100)
            // ctx.draw()
            // ctx.fillRect(50, 50, 150, 100)
            // ctx.draw(true)
            // debugger;
            
            that.setData({ index: 1 });
            //wx.createCanvasContext("renderer").draw();
            wx.canvasPutImageData({
              canvasId: 'renderer',
              data: allFrames[0].patch,
              x: allFrames[currentFrame].dims.left,
              y: allFrames[currentFrame].dims.top,
              width: gif.raw.lsd.width,
              success: function () {
                wx.hideLoading();
                isReset = false;
              }
            })
            /*
            for (var l = 0 ; l < gif.raw.frames.length; l++ ) {
              wx.canvasPutImageData({
                canvasId: 'bufferCanvas',
                data: gif.decompressFrames(true)[l].patch,
                x: gif.decompressFrames(true)[l].dims.left,
                y: gif.decompressFrames(true)[l].dims.top,
                width: gif.raw.lsd.width,
                success: function() {
                  wx.canvasGetImageData({
                    canvasId: 'bufferCanvas',
                    x: gif.decompressFrames(true)[l].dims.left,
                    y: gif.decompressFrames(true)[l].dims.top,
                    width: gif.raw.lsd.width,
                    height: gif.raw.lsd.height,
                    success: function (res) {
                      let pngData = upng.encode([res.data.buffer], res.width, res.height)
                      // 4. base64编码
                      let base64 = wx.arrayBufferToBase64(pngData)
                      base64Strings.push(base64);
                      // debugger;
                    }
                  })
                }
              })

              
            }
            */
            
            // setTimeout(function () {console.log(base64Strings) } , 5000);

            console.log(gif);
            var demoBase64Array = upng.encode([allFrames[0].patch], gif.raw.lsd.width, gif.raw.lsd.height);
            console.log(demoBase64Array);
            console.log(wx.arrayBufferToBase64(demoBase64Array));
            
            // console.log()

            ///////////////////////////////////////////////////////
            /*
            var bufferCanvas;
            wx.createSelectorQuery().select('#bufferCanvas').fields({
              dataset: true,
              size: true,
              scrollOffset: true,
              properties: ['getContext'],
              computedStyle: ['margin', 'backgroundColor'],
              context: true
            }, function (res) {
              bufferCanvas = res;
              FIG.load({
                base64BytesArray: base64Bytes,
                offScreenCanvas: bufferCanvas,
                oncomplete: function (gifs) {
                  console.log(gifs[0])
                  console.log(gifs[0].frames[0].canvas)
                  figgif = gifs[0];
                  

                  //////////////////////
                  
                }
              })
            }).exec();
            */
            
            

            
          }
        })
      }
    })
  },

  resetHandler: function (e) {
    isReset = true;
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
    var theFrame = allFrames[currentFrame];
    // wx.createCanvasContext("renderer").draw();
    wx.canvasPutImageData({
      canvasId: 'renderer',
      data: theFrame.patch,
      x: theFrame.dims.left,
      y: theFrame.dims.top,
      width: theFrame.dims.width
    })
  },

  saveHandler: function () {
    if (isReset) {
      wx.showToast({
        title: '错误: 还没有导入GIF!',
        icon: "none"
      });
      return;
    }
    wx.canvasGetImageData({
      canvasId: 'renderer',
      x: 0,
      y: 0,
      width: gif.raw.lsd.width,
      height: gif.raw.lsd.height,
      success(res) {
        console.log(res)
        console.log(res.width) // 100
        console.log(res.height) // 100
        console.log(res.data instanceof Uint8ClampedArray) // true
        console.log(res.data.length) // 100 * 100 * 4
      }
    })
    if (!gif) {
      wx.showToast({
        title: '错误: 还没有导入GIF!',
        icon: "none"
      });
      return;
    }
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

  saveAllHandler: function () {
    wx.showToast({
      title: '开发中',
      icon: "none"
    })
    /*
    var p = Promise.all(allFrames.map(frame => {
      return new Promise(function(resolve, reject) {
        wx.canvasPutImageData({
          canvasId: 'bufferCanvas',
          data: frame.patch,
          x: 0,
          y: 0,
          width: gif.raw.lsd.width,
          success: (res) => {
            wx.canvasToTempFilePath({
              x: 0,
              y: 0,
              width: gif.raw.lsd.width, //导出图片的宽
              height: gif.raw.lsd.height, //导出图片的高
              destWidth: gif.raw.lsd.width,
              destHeight: gif.raw.lsd.height,
              canvasId: 'bufferCanvas',
              success: function (res2) {
                console.log("simulate save itered frame")
                wx.saveImageToPhotosAlbum({
                  filePath: res2.tempFilePath,
                })
              }
            });
          }
        })
      })
    }));
    p.then(function(results){
      console.log(results);
    }).catch(function(err) {
      console.log(err);
    })
    */
  },

  fwHandler: function() {
    if (currentFrame < gif.raw.frames.length - 2) {
      currentFrame++;
    } else {
      currentFrame = 0;
    }
    this.setData({ index: currentFrame + 1 });
    var theFrame = allFrames[currentFrame];
    // wx.createCanvasContext("renderer").draw();
    wx.canvasPutImageData({
      canvasId: 'renderer',
      data: theFrame.patch,
      x: theFrame.dims.left,
      y: theFrame.dims.top,
      width: theFrame.dims.width,
    })
  },

  bwHandler: function () {
    if (currentFrame > 0) {
      currentFrame--;
    } else {
      currentFrame = gif.raw.frames.length - 2;
    }
    this.setData({ index: currentFrame + 1 });
    var theFrame = allFrames[currentFrame];
    // wx.createCanvasContext("renderer").draw();
    wx.canvasPutImageData({
      canvasId: 'renderer',
      data: theFrame.patch,
      x: theFrame.dims.left,
      y: theFrame.dims.top,
      width: theFrame.dims.width
    })
  },

  playHandler: function () {
    t = setTimeout(timedCount, frameDelays[currentFrame]);
    
  },

  pauseHandler: function () {
    clearTimeout(t);
  },

  slider4change: function(e) {
    currentFrame = e.detail.value;
    this.setData({
      index: parseInt(e.detail.value) + 1
    })
    var theFrame = allFrames[currentFrame];
    // wx.createCanvasContext("renderer").draw();
    wx.canvasPutImageData({
      canvasId: 'renderer',
      data: theFrame.patch,
      x: theFrame.dims.left,
      y: theFrame.dims.top,
      width: theFrame.dims.width
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


