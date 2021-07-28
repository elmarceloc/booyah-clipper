// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require("electron");

const path = require("path");

var mainWindow;

// https://github.com/kribblo/node-ffmpeg-installer/issues/26
const ffmpegPath = path
  .join(__dirname, "\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe")
  .replace("app.asar", "app.asar.unpacked");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 760,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: __dirname + "/icon.ico",
    //   autoHideMenuBar: true,
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  mainWindow.webContents.on("new-window", function (e, url) {
    e.preventDefault();
    require("electron").shell.openExternal(url);
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

var lastVOD = ''

ipcMain.on("clip", (event, last, from, duration, clip_name) => {
  console.log(`CLIP from ${from} for ${duration} secounds`);

  if(last){
    clip_video(event, lastVOD, from, duration, clip_name)
    return
  }

  dialog
    .showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Videos", extensions: ["mkv", "avi", "mp4", ".mpv", "wmv"] },
      ],
    })
    .then((result) => {
      if (result.canceled === false) {
        var filepath = ''

        filepath = result.filePaths[0];
        lastVOD = filepath


        clip_video(event, filepath, from, duration, clip_name)
        
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

function clip_video(event,filepath,from,duration, clip_name){
  ffmpeg(filepath)
      .setStartTime(from) // "00:00:03"
      .setDuration(duration)
      .output( path.join(app.getPath('videos'),clip_name + '.mp4'))
      .on("end", function (err) {
        if (!err) {
          console.log("conversion Done");
          event.returnValue = 'ok'

          mainWindow.webContents.send('status', {status: true, path: path.join(app.getPath('videos'),clip_name + '.mp4')});

        }
      })
      .on("error", function (err) {
        console.log("error: ", err);
        event.returnValue = 'err'
        mainWindow.webContents.send('status', {status: false});

      })
      .run();
}