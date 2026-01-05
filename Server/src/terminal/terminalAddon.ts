import { FitAddon } from '@xterm/addon-fit';
import { Terminal, ITerminalAddon } from '@xterm/xterm';
import { TerminalMessageHandler } from '../shared/webkit';

interface TermSize {
    cols: number;
    rows: number;
}

interface TerminalPosition {
    row: number;
    col: number;
}

// https://xtermjs.org/docs/api/vtfeatures/
// https://en.wikipedia.org/wiki/ANSI_escape_code
const VT = {
    ESC: '\x1b',
    CSI: '\x1b[',
    UP_ARROW: '\x1b[A',
    DOWN_ARROW: '\x1b[B',
    RIGHT_ARROW: '\x1b[C',
    LEFT_ARROW: '\x1b[D',
    HOME_KEY: ['\x1b[H', '\x1bOH'],
    END_KEY: ['\x1b[F', '\x1bOF'],
    DELETE_REST_OF_LINE: '\x1b[K',
    CursorUp: (n = 1) => `\x1b[${n}A`,
    CursorDown: (n = 1) => `\x1b[${n}B`,
    CursorForward: (n = 1) => `\x1b[${n}C`,
    CursorBack: (n = 1) => `\x1b[${n}D`
};

/**
 * Key code constants
 */
const KeyCodes = {
    CONTROL_C: 3,
    CONTROL_D: 4,
    ENTER: 13,
    BACKSPACE: 8,
    DELETE: 127
};

export class TerminalAddon implements ITerminalAddon {
    private term: Terminal | null;
    private fitAddon: FitAddon;
    private inputBuffer: string;
    private cursor: number;
    private promptInLastLine: string;
    private termSize: TermSize;

    constructor() {
        this.term = null;
        this.fitAddon = new FitAddon();
        this.inputBuffer = '';
        this.cursor = 0;
        this.promptInLastLine = '';
        this.termSize = {
            cols: 0,
            rows: 0,
        };
    }

    dispose(): void {
        this.fitAddon.dispose();
    }

    activate(terminal: Terminal): void {
        this.term = terminal;
        this.termSize = {
            cols: terminal.cols,
            rows: terminal.rows,
        };
        this.fitAddon.activate(terminal);
        this.term.onData(this.handleData.bind(this));
        this.term.onResize(this.handleResize.bind(this));
    }

    fit(): void {
        this.fitAddon.fit();
    }

    private handleData(data: string): void {
        // If the input is a longer string (e.g., from paste), and it contains newlines
        if (data.length > 1 && !data.startsWith(VT.ESC)) {
            const lines = data.split(/(\r\n|\n|\r)/g);

            let lineIndex = 0;
            const processLine = () => {
                if (lineIndex >= lines.length) return;

                const line = lines[lineIndex];
                if (line === '\n' || line === '\r' || line === '\r\n') {
                    if (this.cursor > 0) {
                        this.clearInputLine();
                        this.cursor = 0;
                        this.renderInputLine(this.inputBuffer);
                    }
                    window.webkit.messageHandlers.terminalInput.postMessage(this.inputBuffer + '\n');
                    this.inputBuffer = '';
                    this.cursor = 0;
                    lineIndex++;
                    setTimeout(processLine, 100);
                    return;
                }

                this.handleSingleLine(line);
                lineIndex++;
                processLine();
            };

            processLine();
            return;
        }

        // Handle escape sequences for special keys
        if (data.startsWith(VT.ESC)) {
            this.handleEscSequences(data);
            return;
        }

        this.handleSingleLine(data);
    }

    private handleSingleLine(data: string): void {
        if (data.length === 0) return;

        const char = data.charCodeAt(0);
        // Handle control characters
        if (char < 32 || char === 127) {
            // Handle Enter key (carriage return)
            if (char === KeyCodes.ENTER) {
                if (this.cursor > 0) {
                    this.clearInputLine();
                    this.cursor = 0;
                    this.renderInputLine(this.inputBuffer);
                }
                window.webkit.messageHandlers.terminalInput.postMessage(this.inputBuffer + '\n');
                this.inputBuffer = '';
                this.cursor = 0;
            }
            else if (char === KeyCodes.CONTROL_C || char === KeyCodes.CONTROL_D) {
                if (this.cursor > 0) {
                    this.clearInputLine();
                    this.cursor = 0;
                    this.renderInputLine(this.inputBuffer);
                }
                window.webkit.messageHandlers.terminalInput.postMessage(this.inputBuffer + data);
                this.inputBuffer = '';
                this.cursor = 0;
            }
            // Handle backspace or delete
            else if (char === KeyCodes.BACKSPACE || char === KeyCodes.DELETE) {
                if (this.cursor > 0) {
                    this.clearInputLine();
    
                    // Delete character at cursor position - 1
                    const beforeCursor = this.inputBuffer.substring(0, this.cursor - 1);
                    const afterCursor = this.inputBuffer.substring(this.cursor);
                    const newInput = beforeCursor + afterCursor;
                    this.cursor--;
                    this.renderInputLine(newInput);
                }
            }
            return;
        }

        this.clearInputLine();

        // Insert character at cursor position
        const beforeCursor = this.inputBuffer.substring(0, this.cursor);
        const afterCursor = this.inputBuffer.substring(this.cursor);
        const newInput = beforeCursor + data + afterCursor;
        this.cursor += data.length;
        this.renderInputLine(newInput);
    }

    private handleResize(data: { cols: number; rows: number }): void {
        this.clearInputLine();
        this.termSize = {
            cols: data.cols,
            rows: data.rows,
        };
        this.renderInputLine(this.inputBuffer);
    }

    private clearInputLine(): void {
        if (!this.term) return;
        // Move to beginning of the current line
        this.term.write('\r');
        const cursorPosition = this.calcCursorPosition();
        const inputEndPosition = this.calcLineWrapPosition(this.promptInLastLine.length + this.inputBuffer.length);
        // If cursor is not at the end of input, move to the end
        if (cursorPosition.row < inputEndPosition.row) {
            this.term.write(VT.CursorDown(inputEndPosition.row - cursorPosition.row));
        } else if (cursorPosition.row > inputEndPosition.row) {
            this.term.write(VT.CursorUp(cursorPosition.row - inputEndPosition.row));
        }
        
        // Clear from the last line upwards
        this.term.write('\r' + VT.DELETE_REST_OF_LINE);
        for (let i = inputEndPosition.row - 1; i >= 0; i--) {
            this.term.write(VT.CursorUp(1));
            this.term.write('\r' + VT.DELETE_REST_OF_LINE);
        }
    };

    // Function to render the input line considering line wrapping
    private renderInputLine(newInput: string): void {
        if (!this.term) return;
        this.inputBuffer = newInput;
        // Write prompt and input
        this.term.write(this.promptInLastLine + this.inputBuffer);
        const cursorPosition = this.calcCursorPosition();
        const inputEndPosition = this.calcLineWrapPosition(this.promptInLastLine.length + this.inputBuffer.length);
        // If the last input char is at the end of the terminal width,
        // need to print an extra empty line to display the cursor.
        if (inputEndPosition.col == 0) {
            this.term.write(' ');
            this.term.write(VT.CursorBack(1));
            this.term.write(VT.DELETE_REST_OF_LINE);
        }

        if (this.inputBuffer.length === this.cursor) {
            return;
        }
        
        // Move the cursor from the input end to the expected cursor row
        if (cursorPosition.row < inputEndPosition.row) {
            this.term.write(VT.CursorUp(inputEndPosition.row - cursorPosition.row));
        }
        this.term.write('\r');
        if (cursorPosition.col > 0) {
            this.term.write(VT.CursorForward(cursorPosition.col));
        }
    };

    private calcCursorPosition(): TerminalPosition {
        return this.calcLineWrapPosition(this.promptInLastLine.length + this.cursor);
    }

    private calcLineWrapPosition(textLength: number): TerminalPosition {
        if (!this.term) {
            return { row: 0, col: 0 };
        }
        const row = Math.floor(textLength / this.termSize.cols);
        const col = textLength % this.termSize.cols;

        return { row, col };
    }

    /**
     * Handle ESC sequences
     */
    private handleEscSequences(data: string): void {
        if (!this.term) return;
        switch (data) {
            case VT.UP_ARROW:
                // TODO: Could implement command history here
                break;
                
            case VT.DOWN_ARROW:
                // TODO: Could implement command history here
                break;
                
            case VT.RIGHT_ARROW:
                if (this.cursor < this.inputBuffer.length) {
                    this.clearInputLine();
                    this.cursor++;
                    this.renderInputLine(this.inputBuffer);
                }
                break;
                
            case VT.LEFT_ARROW:
                if (this.cursor > 0) {
                    this.clearInputLine();
                    this.cursor--;
                    this.renderInputLine(this.inputBuffer);
                }
                break;
        }
        
        // Handle Home key variations
        if (VT.HOME_KEY.includes(data)) {
            this.clearInputLine();
            this.cursor = 0;
            this.renderInputLine(this.inputBuffer);
        }
        
        // Handle End key variations
        if (VT.END_KEY.includes(data)) {
            this.clearInputLine();
            this.cursor = this.inputBuffer.length;
            this.renderInputLine(this.inputBuffer);
        }
    };

    /**
     * Remove OSC escape sequences from text
     */
    private removeOscSequences(text: string): string {
        // Remove basic OSC sequences
        let filteredText = text.replace(/\u001b\]\d+;[^\u0007\u001b]*[\u0007\u001b\\]/g, '');
        
        // More comprehensive approach for nested sequences
        return filteredText.replace(/\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g, '');
    };

    /**
     * Process terminal output and update prompt tracking
     */
    processTerminalOutput(text: string): void {
        if (typeof text !== 'string') return;
        
        const lastNewline = text.lastIndexOf('\n');
        const lastCarriageReturn = text.lastIndexOf('\r');
        const lastControlChar = Math.max(lastNewline, lastCarriageReturn);
        let newPromptText = lastControlChar !== -1 ? text.substring(lastControlChar + 1) : text;
        
        // Filter out OSC sequences
        newPromptText = this.removeOscSequences(newPromptText);
        
        this.promptInLastLine = lastControlChar !== -1 ?
            newPromptText : this.promptInLastLine + newPromptText;
    };
}
