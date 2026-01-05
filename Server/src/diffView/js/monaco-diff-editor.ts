// monaco-diff-editor.ts - Monaco Editor diff view core functionality
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

// Editor state
let diffEditor: monaco.editor.IStandaloneDiffEditor | null = null;
let originalModel: monaco.editor.ITextModel | null = null;
let modifiedModel: monaco.editor.ITextModel | null = null;
let resizeObserver: ResizeObserver | null = null;
const DEFAULT_EDITOR_OPTIONS: monaco.editor.IDiffEditorConstructionOptions = {
    renderSideBySide: false,
    readOnly: true,
    // Enable automatic layout adjustments
    automaticLayout: true,
    glyphMargin: false,
    // Collapse unchanged regions
    folding: true,
    hideUnchangedRegions: {
        enabled: true,
        revealLineCount: 20,
        minimumLineCount: 2,
        contextLineCount: 2

    },
    // Disable overview ruler and related features
    renderOverviewRuler: false,
    overviewRulerBorder: false,
    overviewRulerLanes: 0,
    scrollBeyondLastLine: false,
    scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        alwaysConsumeMouseWheel: false,
    },
    lineHeight: 24,
}

/**
 * Initialize the Monaco diff editor
 * @param {string} originalContent - Content for the original side
 * @param {string} modifiedContent - Content for the modified side
 * @param {Object} options - Optional configuration for the diff editor
 * @returns {Object} The diff editor instance
 */
function initDiffEditor(
    originalContent: string, 
    modifiedContent: string, 
    options: monaco.editor.IDiffEditorConstructionOptions = {}
): monaco.editor.IStandaloneDiffEditor | null {
    try {
        // Default options
        const editorOptions: monaco.editor.IDiffEditorConstructionOptions = {
            ...DEFAULT_EDITOR_OPTIONS,
            lineNumbersMinChars: calculateLineNumbersMinChars(originalContent, modifiedContent),
            ...options
        };

        // Create the diff editor if it doesn't exist yet
        if (!diffEditor) {
            const container = document.getElementById("container");
            if (!container) {
                throw new Error("Container element not found");
            }

            // Set initial container size to viewport height
            // const headerHeight = 40;
            // container.style.height = `${window.innerHeight - headerHeight}px`;
            // Set initial container size to viewport height with precise calculations
            const visibleHeight = window.innerHeight;
            const headerHeight = 40;
            const topPadding = 4;
            const bottomPadding = 40;
            const availableHeight = visibleHeight - headerHeight - topPadding - bottomPadding;
            container.style.height = `${Math.floor(availableHeight)}px`;
            container.style.overflow = "hidden"; // Ensure container doesn't have scrollbars
            
            diffEditor = monaco.editor.createDiffEditor(
                container,
                editorOptions
            );
            
            // Add resize handling
            setupResizeHandling();

            // Initialize theme
            initializeTheme();
        } else {
            // Apply any new options
            diffEditor.updateOptions(editorOptions);
        }

        // Create and set models
        updateModels(originalContent, modifiedContent);
        
        return diffEditor;
    } catch (error) {
        console.error("Error initializing diff editor:", error);
        return null;
    }
}

/**
 * Setup proper resize handling for the editor
 */
function setupResizeHandling(): void {
    window.addEventListener('resize', () => {
        if (diffEditor) {
            diffEditor.layout();
        }
    });
    
    if (window.ResizeObserver && !resizeObserver) {
        const container = document.getElementById('container');
        
        if (container) {
            resizeObserver = new ResizeObserver(() => {
                if (diffEditor) {
                    diffEditor.layout()
                }
            });
            resizeObserver.observe(container);
        }
    }
}

/**
 * Create or update the models for the diff editor
 * @param {string} originalContent - Content for the original side
 * @param {string} modifiedContent - Content for the modified side
 */
function updateModels(originalContent: string, modifiedContent: string): void {
    try {
        // Clean up existing models if they exist
        if (originalModel) {
            originalModel.dispose();
        }
        if (modifiedModel) {
            modifiedModel.dispose();
        }

        // Create new models with the content
        originalModel = monaco.editor.createModel(originalContent || "", "plaintext");
        modifiedModel = monaco.editor.createModel(modifiedContent || "", "plaintext");
        
        // Set the models to show the diff
        if (diffEditor) {
            diffEditor.setModel({
                original: originalModel,
                modified: modifiedModel,
            });

            // Add timeout to give Monaco time to calculate diffs
            setTimeout(() => {
                updateDiffStats();
                adjustContainerHeight();
            }, 100); // 100ms delay allows diff calculation to complete
        }
    } catch (error) {
        console.error("Error updating models:", error);
    }
}

/**
 * Update the diff view with new content
 * @param {string} originalContent - Content for the original side
 * @param {string} modifiedContent - Content for the modified side
 */
function updateDiffContent(originalContent: string, modifiedContent: string): void {
    // If editor exists, update it
    if (diffEditor && diffEditor.getModel()) {
        const model = diffEditor.getModel();
        
        // Update model values
        if (model) {
            model.original.setValue(originalContent || "");
            model.modified.setValue(modifiedContent || "");
        }
    } else {
        // Initialize if not already done
        initDiffEditor(originalContent, modifiedContent);
    }
}

/**
 * Get the current diff editor instance
 * @returns {Object|null} The diff editor instance or null
 */
function getEditor(): monaco.editor.IStandaloneDiffEditor | null {
    return diffEditor;
}

/**
 * Calculate the number of line differences
 * @returns {Object} The number of additions and deletions
 */
function calculateLineDifferences(): { additions: number, deletions: number } {
    if (!diffEditor || !diffEditor.getModel()) {
        return { additions: 0, deletions: 0 };
    }

    let additions = 0;
    let deletions = 0;
    const lineChanges = diffEditor.getLineChanges();
    console.log(">>> Line Changes:", lineChanges);
    if (lineChanges) {
        for (const change of lineChanges) {
            console.log(change);
            if (change.originalEndLineNumber >= change.originalStartLineNumber) {
                deletions += change.originalEndLineNumber - change.originalStartLineNumber + 1;
            }
            if (change.modifiedEndLineNumber >= change.modifiedStartLineNumber) {
                additions += change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;
            }
        }
    }

    return { additions, deletions };
}

/**
 * Update the diff statistics displayed in the UI
 */
function updateDiffStats(): void {
    const { additions, deletions } = calculateLineDifferences();

    const additionsElement = document.getElementById('additions-count');
    const deletionsElement = document.getElementById('deletions-count');

    if (additionsElement) {
        additionsElement.textContent = `+${additions}`;
    }

    if (deletionsElement) {
        deletionsElement.textContent = `-${deletions}`;
    }
}

/**
 * Dynamically adjust container height based on content
 */
function adjustContainerHeight(): void {
    const container = document.getElementById('container');
    if (!container || !diffEditor) return;

    // Always use the full viewport height
    const visibleHeight = window.innerHeight;
    const headerHeight = 40; // Height of the header
    const topPadding = 4; // Top padding
    const bottomPadding = 40; // Bottom padding
    const availableHeight = visibleHeight - headerHeight - topPadding - bottomPadding;

    container.style.height = `${Math.floor(availableHeight)}px`;

    diffEditor.layout();
}

/**
 * Set the editor theme
 * @param {string} theme - The theme to set ('light' or 'dark')
 */
function setEditorTheme(theme: 'light' | 'dark'): void {
    if (!diffEditor) return;
    
    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
}

/**
 * Detect the system theme preference
 * @returns {string} The detected theme ('light' or 'dark')
 */
function detectSystemTheme(): 'light' | 'dark' {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Initialize the theme based on system preference
 * and set up a listener for changes
 */
function initializeTheme(): void {
    const theme = detectSystemTheme();
    setEditorTheme(theme);
    
    // Listen for changes in system theme preference
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            setEditorTheme(event.matches ? 'dark' : 'light');
        });
    }
}

/**
 * Calculate the optimal number of characters for line numbers
 * @param {string} originalContent - Content for the original side
 * @param {string} modifiedContent - Content for the modified side
 * @returns {number} The minimum number of characters needed for line numbers
 */
function calculateLineNumbersMinChars(originalContent: string, modifiedContent: string): number {
    // Count the number of lines in both contents
    const originalLineCount = originalContent ? originalContent.split('\n').length : 0;
    const modifiedLineCount = modifiedContent ? modifiedContent.split('\n').length : 0;
    
    // Get the maximum line count
    const maxLineCount = Math.max(originalLineCount, modifiedLineCount);
    
    // Calculate the number of digits in the max line count
    // Use Math.log10 and Math.ceil to get the number of digits
    // Add 1 to ensure some extra padding
    const digits = maxLineCount > 0 ? Math.floor(Math.log10(maxLineCount) + 1) + 1 : 2;
    
    // Return a minimum of 2 characters, maximum of 5
    return Math.min(Math.max(digits, 2), 5);
}

/**
 * Dispose of the editor and models to clean up resources
 */
function dispose(): void {
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    
    if (originalModel) {
        originalModel.dispose();
        originalModel = null;
    }
    if (modifiedModel) {
        modifiedModel.dispose();
        modifiedModel = null;
    }
    if (diffEditor) {
        diffEditor.dispose();
        diffEditor = null;
    }
}

export {
    initDiffEditor,
    updateDiffContent,
    getEditor,
    dispose,
    setEditorTheme,
    updateDiffStats
};
