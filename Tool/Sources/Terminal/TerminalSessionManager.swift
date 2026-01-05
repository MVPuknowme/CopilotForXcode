import Foundation
import Combine

public class TerminalSessionManager {
    public static let shared = TerminalSessionManager()
    private var sessions: [String: TerminalSession] = [:]

    public func createSession(for terminalId: String) -> TerminalSession {
        if let existingSession = sessions[terminalId] {
            return existingSession
        } else {
            let newSession = TerminalSession()
            sessions[terminalId] = newSession
            return newSession
        }
    }

    public func getSession(for terminalId: String) -> TerminalSession? {
        return sessions[terminalId]
    }

    public func clearSession(for terminalId: String) {
        sessions[terminalId]?.cleanup()
        sessions.removeValue(forKey: terminalId)
    }
}
