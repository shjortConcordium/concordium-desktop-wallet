import axios from 'axios';
import {
    app,
    shell,
    BrowserWindow,
    ipcMain,
    dialog,
    BrowserView,
    Rectangle,
} from 'electron';
import { PrintErrorTypes } from '~/utils/types';
import ipcCommands from '~/constants/ipcCommands.json';
import { ViewResponse, ViewResponseStatus } from '~/preload/preloadTypes';

async function print(body: string, printWindow: BrowserWindow) {
    return new Promise<string | void>((resolve, reject) => {
        if (!printWindow) {
            reject(new Error('Internal error: Unable to print'));
        } else {
            printWindow.loadURL(`data:text/html;charset=utf-8,${body}`);
            const content = printWindow.webContents;
            content.once('did-finish-load', () => {
                content.print({}, (success, errorType) => {
                    if (!success) {
                        if (errorType === PrintErrorTypes.Cancelled) {
                            resolve();
                        }
                        resolve(errorType);
                    } else {
                        resolve();
                    }
                });
            });
        }
    });
}

async function httpsGet(
    urlString: string,
    params: Record<string, string>
): Promise<string> {
    // Setup timeout for axios (it's a little weird, as default timeout
    // settings in axios only concern themselves with response timeout,
    // not a connect timeout).
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => {
        source.cancel();
    }, 60000);

    const searchParams = new URLSearchParams(params);
    let urlGet: string;
    if (Object.entries(params).length === 0) {
        urlGet = urlString;
    } else {
        urlGet = `${urlString}?${searchParams.toString()}`;
    }

    const response = await axios.get(urlGet, {
        cancelToken: source.token,
        maxRedirects: 0,
        // We also want to accept a 302 redirect, as that is used by the
        // identity provider flow
        validateStatus: (status: number) => status >= 200 && status <= 302,
    });
    clearTimeout(timeout);

    return JSON.stringify({
        data: response.data,
        headers: response.headers,
        status: response.status,
    });
}

const redirectUri = 'ConcordiumRedirectToken';
const codeUriKey = 'code_uri=';

function createExternalView(
    browserView: BrowserView,
    window: BrowserWindow,
    location: string,
    rect: Rectangle
): Promise<ViewResponse> {
    return new Promise((resolve) => {
        window.setBrowserView(browserView);
        browserView.setBounds(rect);
        browserView.webContents
            .loadURL(location)
            .then(() => {
                // Ignoring ts as it otherwise blocks us from using a custom
                // event name ('abort').
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                browserView.webContents.once('abort', async () => {
                    resolve({
                        status: ViewResponseStatus.Aborted,
                    });
                });

                return browserView.webContents.on(
                    'will-redirect',
                    async (event, url) => {
                        // If the redirect contains the location of the identity, then do not
                        // follow it, but extract the URL and return it.
                        if (url.includes(redirectUri)) {
                            event.preventDefault();
                            resolve({
                                status: ViewResponseStatus.Success,
                                result: url.substring(
                                    url.indexOf(codeUriKey) + codeUriKey.length
                                ),
                            });
                        }
                    }
                );
            })
            .catch((e) =>
                resolve({ error: e.message, status: ViewResponseStatus.Error })
            );
    });
}

export default function initializeIpcHandlers(
    mainWindow: BrowserWindow,
    printWindow: BrowserWindow,
    browserView: BrowserView
) {
    // Returns the path to userdata.
    ipcMain.handle(ipcCommands.getUserDataPath, async () => {
        return app.getPath('userData');
    });

    // Prints the given body.
    ipcMain.handle(ipcCommands.print, async (_event, body) => {
        return print(body, printWindow);
    });

    ipcMain.handle(ipcCommands.openUrl, (_event, url: string) => {
        shell.openExternal(url);
    });

    ipcMain.handle(
        ipcCommands.httpsGet,
        (_event, url: string, params: Record<string, string>) => {
            return httpsGet(url, params);
        }
    );

    ipcMain.handle(
        ipcCommands.createView,
        (_event, location: string, rect: Rectangle) =>
            createExternalView(browserView, mainWindow, location, rect)
    );
    ipcMain.handle(ipcCommands.removeView, () => {
        browserView.webContents.emit('abort');
        browserView.webContents.removeAllListeners('will-redirect');

        // Load a blank page to prevent flashing of a previous identity
        // provider page.
        browserView.webContents.loadURL('about:blank');
        mainWindow.removeBrowserView(browserView);
    });
    ipcMain.handle(ipcCommands.resizeView, (_event, rect: Rectangle) =>
        browserView.setBounds(rect)
    );

    // Provides access to save file dialog from renderer processes.
    ipcMain.handle(ipcCommands.saveFileDialog, async (_event, opts) => {
        return dialog.showSaveDialog(opts);
    });

    ipcMain.handle(ipcCommands.openFileDialog, async (_event, opts) => {
        return dialog.showOpenDialog(opts);
    });
}
