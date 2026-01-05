// ui-controller.ts - UI event handlers and state management
import { DiffViewMessageHandler } from '../../shared/webkit';
/**
 * UI state and file metadata
 */
let filePath: string | null = null;
let fileEditStatus: string | null = null;

/**
 * Interface for messages sent to Swift handlers
 */
interface SwiftMessage {
    event: string;
    data: {
        filePath: string | null;
        [key: string]: any;
    };
}

/**
 * Initialize and set up UI elements and their event handlers
 * @param {string} initialPath - The initial file path
 * @param {string} initialStatus - The initial file edit status
 */
function setupUI(initialPath: string | null = null, initialStatus: string | null = null): void {
    filePath = initialPath;
    fileEditStatus = initialStatus;

    if (filePath) {
        showFilePath(filePath);
    }
    
    const keepButton = document.getElementById('keep-button');
    const undoButton = document.getElementById('undo-button');
    const choiceButtons = document.getElementById('choice-buttons');

    if (!keepButton || !undoButton || !choiceButtons) {
        console.error("Could not find UI elements");
        return;
    }

    // Set initial UI state
    updateUIStatus(initialStatus);

    // Setup event listeners
    keepButton.addEventListener('click', handleKeepButtonClick);
    undoButton.addEventListener('click', handleUndoButtonClick);
}

/**
 * Update the UI based on file edit status
 * @param {string} status - The current file edit status
 */
function updateUIStatus(status: string | null): void {
    fileEditStatus = status;
    const choiceButtons = document.getElementById('choice-buttons');
    
    if (!choiceButtons) return;
    
    // Hide buttons if file has been modified
    if (status && status !== "none") {
        choiceButtons.classList.add('hidden');
    } else {
        choiceButtons.classList.remove('hidden');
    }
}

/**
 * Update the file metadata
 * @param {string} path - The file path
 * @param {string} status - The file edit status
 */
function updateFileMetadata(path: string | null, status: string | null): void {
    filePath = path;
    updateUIStatus(status);
    if (filePath) {
        showFilePath(filePath)
    }
}

/**
 * Handle the "Keep" button click
 */
function handleKeepButtonClick(): void {
    // Send message to Swift handler
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.swiftHandler) {
        const message: SwiftMessage = {
            event: 'keepButtonClicked',
            data: {
                filePath: filePath
            }
        };
        window.webkit.messageHandlers.swiftHandler.postMessage(message);
    } else {
        console.log('Keep button clicked, but no message handler found');
    }
    
    // Hide the choice buttons
    const choiceButtons = document.getElementById('choice-buttons');
    if (choiceButtons) {
        choiceButtons.classList.add('hidden');
    }
}

/**
 * Handle the "Undo" button click
 */
function handleUndoButtonClick(): void {
    // Send message to Swift handler
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.swiftHandler) {
        const message: SwiftMessage = {
            event: 'undoButtonClicked',
            data: {
                filePath: filePath
            }
        };
        window.webkit.messageHandlers.swiftHandler.postMessage(message);
    } else {
        console.log('Undo button clicked, but no message handler found');
    }
    
    // Hide the choice buttons
    const choiceButtons = document.getElementById('choice-buttons');
    if (choiceButtons) {
        choiceButtons.classList.add('hidden');
    }
}

/**
 * Get the current file path
 * @returns {string} The current file path
 */
function getFilePath(): string | null {
    return filePath;
}

/**
 * Show the current file path
 */
function showFilePath(path: string): void {
    const filePathElement = document.getElementById('file-path');
    const fileName = path.split('/').pop() ?? '';
    if (filePathElement) {
        filePathElement.textContent = fileName
    }
}

/**
 * Get the current file edit status
 * @returns {string} The current file edit status
 */
function getFileEditStatus(): string | null {
    return fileEditStatus;
}

export {
    setupUI,
    updateUIStatus,
    updateFileMetadata,
    getFilePath,
    getFileEditStatus
};