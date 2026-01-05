/**
 * Type definitions for WebKit message handlers used in WebView communication
 */

/**
 * Base WebKit message handler interface
 */
export interface WebkitMessageHandler {
    postMessage(message: any): void;
}

/**
 * Terminal-specific message handler
 */
export interface TerminalMessageHandler extends WebkitMessageHandler {
    postMessage(message: string): void;
}

/**
 * DiffView-specific message handler
 */
export interface DiffViewMessageHandler extends WebkitMessageHandler {
    postMessage(message: object): void;
}

/**
 * WebKit message handlers container interface
 */
export interface WebkitMessageHandlers {
    terminalInput: TerminalMessageHandler;
    swiftHandler: DiffViewMessageHandler;
    [key: string]: WebkitMessageHandler | undefined;
}

/**
 * Main WebKit interface exposed by WebViews
 */
export interface WebkitHandler {
    messageHandlers: WebkitMessageHandlers;
}

/**
 * Add webkit to the global Window interface
 */
declare global {
    interface Window {
        webkit: WebkitHandler;
    }
}