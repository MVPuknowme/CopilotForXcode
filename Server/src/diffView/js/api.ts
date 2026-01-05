// api.ts - Public API for external use
import { initDiffEditor, updateDiffContent, getEditor, setEditorTheme, updateDiffStats } from './monaco-diff-editor';
import { updateFileMetadata } from './ui-controller';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Interface for the DiffViewer API
 */
interface DiffViewerAPI {
    init: (
        originalContent: string,
        modifiedContent: string,
        path: string | null,
        status: string | null,
        options?: monaco.editor.IDiffEditorConstructionOptions
    ) => void;
    update: (
        originalContent: string,
        modifiedContent: string,
        path: string | null,
        status: string | null
    ) => void;
    handleResize: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
    followSystemTheme: () => void;
}

/**
 * The public API that will be exposed to the global scope
 */
const DiffViewer: DiffViewerAPI = {
    /**
     * Initialize the diff editor with content
     * @param {string} originalContent - Content for the original side
     * @param {string} modifiedContent - Content for the modified side
     * @param {string} path - File path
     * @param {string} status - File edit status
     * @param {Object} options - Optional configuration for the diff editor
     */
    init: function(
        originalContent: string,
        modifiedContent: string,
        path: string | null,
        status: string | null,
        options?: monaco.editor.IDiffEditorConstructionOptions
    ): void {
        // Initialize editor
        initDiffEditor(originalContent, modifiedContent, options || {});
        
        // Update file metadata and UI
        updateFileMetadata(path, status);
    },
    
    /**
     * Update the diff editor with new content
     * @param {string} originalContent - Content for the original side
     * @param {string} modifiedContent - Content for the modified side
     * @param {string} path - File path
     * @param {string} status - File edit status
     */
    update: function(
        originalContent: string,
        modifiedContent: string,
        path: string | null,
        status: string | null
    ): void {
        // Update editor content
        updateDiffContent(originalContent, modifiedContent);
        
        // Update file metadata and UI
        updateFileMetadata(path, status);

        // Update diff stats
        updateDiffStats();
    },
    
    /**
     * Handle resize events
     */
    handleResize: function(): void {
        const editor = getEditor();
        if (editor) {
            const container = document.getElementById('container');
            if (container) {
                const headerHeight = 40;
                const topPadding = 4;
                const bottomPadding = 40;

                const availableHeight = window.innerHeight - headerHeight - topPadding - bottomPadding;
                container.style.height = `${availableHeight}px`;
            }

            editor.layout();
        }
    },

    /**
     * Set the theme for the editor
     */
    setTheme: function(theme: 'light' | 'dark'): void {
        setEditorTheme(theme);
    },

    /**
     * Follow the system theme
     */
    followSystemTheme: function(): void {
        // Set initial theme based on system preference
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEditorTheme(isDarkMode ? 'dark' : 'light');
        
        // Add listener for theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                setEditorTheme(event.matches ? 'dark' : 'light');
            });
        }
    }
};

export default DiffViewer;
