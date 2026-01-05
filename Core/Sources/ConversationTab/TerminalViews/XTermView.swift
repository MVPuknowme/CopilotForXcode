import SwiftUI
import Logger
import WebKit
import Terminal

struct XTermView: NSViewRepresentable {
    @ObservedObject var terminalSession: TerminalSession
    var onTerminalInput: (String) -> Void

    var terminalOutput: String {
        terminalSession.terminalOutput
    }

    func makeNSView(context: Context) -> WKWebView {
        let webpagePrefs = WKWebpagePreferences()
        webpagePrefs.allowsContentJavaScript = true
        let preferences = WKWebViewConfiguration()
        preferences.defaultWebpagePreferences = webpagePrefs
        preferences.userContentController.add(context.coordinator, name: "terminalInput")

        let webView = WKWebView(frame: .zero, configuration: preferences)
        webView.navigationDelegate = context.coordinator
        #if DEBUG
            webView.configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        #endif

        // Load the terminal bundle resources
        let terminalBundleBaseURL = Bundle.main.bundleURL.appendingPathComponent("Contents/Resources/webViewDist/terminal")
        let htmlFileURL = terminalBundleBaseURL.appendingPathComponent("terminal.html")
        webView.loadFileURL(htmlFileURL, allowingReadAccessTo: terminalBundleBaseURL)
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        // When terminalOutput changes, send the new data to the terminal
        if context.coordinator.lastOutput != terminalOutput {
            let newOutput = terminalOutput.suffix(from:
                terminalOutput.index(terminalOutput.startIndex,
                offsetBy: min(context.coordinator.lastOutput.count, terminalOutput.count)))

            if !newOutput.isEmpty {
                context.coordinator.lastOutput = terminalOutput
                if context.coordinator.isWebViewLoaded {
                    context.coordinator.writeToTerminal(text: String(newOutput), webView: webView)
                } else {
                    context.coordinator.pendingOutput = (context.coordinator.pendingOutput ?? "") + String(newOutput)
                }
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: XTermView
        var lastOutput: String = ""
        var isWebViewLoaded = false
        var pendingOutput: String?

        init(_ parent: XTermView) {
            self.parent = parent
            super.init()
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            isWebViewLoaded = true
            if let pending = pendingOutput {
                writeToTerminal(text: pending, webView: webView)
                pendingOutput = nil
            }
        }

        func writeToTerminal(text: String, webView: WKWebView) {
            let escapedOutput = text
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\r\\n")
                .replacingOccurrences(of: "\r", with: "\\r")

            let jsCode = "writeToTerminal('\(escapedOutput)');"
            DispatchQueue.main.async {
                webView.evaluateJavaScript(jsCode) { _, error in
                    if let error = error {
                        Logger.client.info("XTerm: Error writing to terminal: \(error)")
                    }
                }
            }
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "terminalInput", let input = message.body as? String {
                DispatchQueue.main.async {
                    self.parent.onTerminalInput(input)
                }
            }
        }
    }
}
