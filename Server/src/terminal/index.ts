import '@xterm/xterm/css/xterm.css';
import { Terminal } from '@xterm/xterm';
import { TerminalAddon } from './terminalAddon';

declare global {
    interface Window {
        initializeTerminal: () => Terminal;
        writeToTerminal: (text: string) => void;
        clearTerminal: () => void;
    }
}

window.initializeTerminal = function (): Terminal {
    const term = new Terminal({
        cursorBlink: true,
        theme: {
            background: '#1e1e1e',
            foreground: '#cccccc',
            cursor: '#ffffff',
            selectionBackground: 'rgba(128, 128, 128, 0.4)'
        },
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 13
    });

    const terminalAddon = new TerminalAddon();
    term.loadAddon(terminalAddon);

    const terminalElement = document.getElementById('terminal');
    if (!terminalElement) {
        throw new Error('Terminal element not found');
    }
    term.open(terminalElement);
    terminalAddon.fit();

    // Handle window resize
    window.addEventListener('resize', () => {
        terminalAddon.fit();
    });

    // Expose terminal API methods
    window.writeToTerminal = function (text: string): void {
        term.write(text);
        terminalAddon.processTerminalOutput(text);
    };

    window.clearTerminal = function (): void {
        term.clear();
    };

    return term;
}
