// index.ts - Main entry point for the Monaco Editor diff view
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { initDiffEditor } from './js/monaco-diff-editor';
import { setupUI } from './js/ui-controller';
import DiffViewer from './js/api';

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading indicator as Monaco is directly imported
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }

    // Set up UI elements and event handlers
    setupUI();

    // Make sure the editor follows the system theme
    DiffViewer.followSystemTheme();

    // Handle window resize events
    window.addEventListener('resize', () => {
        DiffViewer.handleResize();
    });
});

// Define DiffViewer on the window object
declare global {
    interface Window {
        DiffViewer: typeof DiffViewer;
    }
}

// Expose the MonacoDiffViewer API to the global scope
window.DiffViewer = DiffViewer;

// Export the MonacoDiffViewer for webpack
export default DiffViewer;
