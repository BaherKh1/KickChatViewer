// main.js - Electron Main Process

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const url = require('url');

let serverProcess;
let mainWindow;

/**
 * Creates the main Electron browser window.
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200, // Set initial width of the window
        height: 800, // Set initial height of the window
        minWidth: 800, // Minimum width
        minHeight: 600, // Minimum height
        icon: path.join(__dirname, 'public', 'favicon.ico'), // Optional: Set app icon
        webPreferences: {
            nodeIntegration: false, // It's safer to keep nodeIntegration false in renderer processes
            contextIsolation: true, // Recommended for security
            preload: path.join(__dirname, 'preload.js'), // Optional: Use a preload script if you need to expose Node.js APIs to renderer
            webSecurity: false, // IMPORTANT: Disable webSecurity for local file access if loading from file:///
                               // In a production app, you might want to serve your frontend via a local server (e.g., Express)
                               // and enable webSecurity. For this setup, we are directly loading the HTML.
        },
        show: false, // Don't show the window until it's ready
    });

    // Load the React app's build output (index.html)
    // This assumes you have run `npm run build` in your React frontend directory,
    // and the `build` folder is copied to the root of your Electron app
    // during the build process (configured in package.json for electron-builder).
    const startUrl = url.format({
        pathname: path.join(__dirname, 'build', 'index.html'),
        protocol: 'file:',
        slashes: true
    });

    mainWindow.loadURL(startUrl);

    // Open the DevTools.
    // Uncomment the line below to open DevTools for debugging during development.
    // mainWindow.webContents.openDevTools();

    // Show window once it's ready to prevent white screen flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

/**
 * Starts the Node.js Express/WebSocket server as a child process.
 */
function startServer() {
    // Determine the path to your server.js
    // In development, it's relative to main.js: `server/server.js`
    // In production (after packaging), it will be inside `resources/app.asar` or similar.
    // We use path.join(__dirname, 'server', 'server.js') which should work in both cases
    // if `electron-builder` is configured to include the `server` directory.
    const serverPath = path.join(__dirname, 'server', 'server.js');

    serverProcess = fork(serverPath, [], {
        stdio: 'inherit', // Pipe child process's stdio to parent for logging
        env: { ...process.env, ELECTRON_RUN_AS_NODE: true } // Important for some libraries within Electron context
    });

    serverProcess.on('exit', (code) => {
        console.log(`Server process exited with code ${code}`);
        if (code !== 0) {
            console.error('Server process crashed. Please check server logs.');
        }
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server process:', err);
    });

    console.log(`Server process started from: ${serverPath}`);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    startServer(); // Start the server first
    createWindow(); // Then create the window
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// Event listener for when the app is about to quit.
// Ensures the server process is killed before the Electron app fully exits.
app.on('will-quit', () => {
    if (serverProcess && !serverProcess.killed) {
        console.log('Terminating server process...');
        serverProcess.kill('SIGTERM'); // Send a termination signal
    }
});

// In this file, you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
