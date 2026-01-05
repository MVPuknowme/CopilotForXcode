import JSONRPC
import Foundation
import Combine
import Logger
import AppKit
import LanguageServerProtocol
import UserNotifications

public protocol ShowMessageRequestHandler {
    func handleShowMessageRequest(
        _ request: ShowMessageRequest,
        callback: @escaping @Sendable (Result<MessageActionItem?, JSONRPCResponseError<JSONValue>>) async -> Void
    )
}

public final class ShowMessageRequestHandlerImpl: NSObject, ShowMessageRequestHandler, UNUserNotificationCenterDelegate {
    public static let shared = ShowMessageRequestHandlerImpl()
    
    private var isNotificationSetup = false
    
    private override init() {
        super.init()
    }
    
    @MainActor
    private func setupNotificationCenterIfNeeded() async {
        guard !isNotificationSetup else { return }
        guard Bundle.main.bundleIdentifier != nil else {
            // Skip notification setup in test environment
            return
        }
        
        isNotificationSetup = true
        UNUserNotificationCenter.current().delegate = self
        _ = try? await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound])
    }

    public func handleShowMessageRequest(
        _ request: ShowMessageRequest,
        callback: @escaping @Sendable (Result<MessageActionItem?, JSONRPCResponseError<JSONValue>>) async -> Void
    ) {
        guard let params = request.params else { return }
        Logger.gitHubCopilot.debug("Received Show Message Request: \(params)")
        Task { @MainActor in
            await setupNotificationCenterIfNeeded()
            
            let actionCount = params.actions?.count ?? 0
            
            // Use notification for messages with no action, alert for messages with actions
            if actionCount == 0 {
                await showMessageRequestNotification(params)
                await callback(.success(nil))
            } else {
                let selectedAction = showMessageRequestAlert(params)
                await callback(.success(selectedAction))
            }
        }
    }
    
    @MainActor
    func showMessageRequestNotification(_ params: ShowMessageRequestParams) async {
        let content = UNMutableNotificationContent()
        content.title = "GitHub Copilot for Xcode"
        content.body = params.message
        content.sound = .default
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )
        
        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            Logger.gitHubCopilot.error("Failed to show notification: \(error)")
        }
    }
    
    @MainActor
    func showMessageRequestAlert(_ params: ShowMessageRequestParams) -> MessageActionItem? {
        let alert = NSAlert()

        alert.messageText = "GitHub Copilot"
        alert.informativeText = params.message
        alert.alertStyle = params.type == .info ? .informational : .warning
        
        let actions = params.actions ?? []
        for item in actions {
            alert.addButton(withTitle: item.title)
        }
        
        let response = alert.runModal()
        
        // Map the button response to the corresponding action
        // .alertFirstButtonReturn = 1000, .alertSecondButtonReturn = 1001, etc.
        let buttonIndex = response.rawValue - NSApplication.ModalResponse.alertFirstButtonReturn.rawValue
        
        guard buttonIndex >= 0 && buttonIndex < actions.count else {
            return nil
        }
        
        return actions[buttonIndex]
    }
    
    // MARK: - UNUserNotificationCenterDelegate
    
    // This method is called when a notification is delivered while the app is in the foreground
    public func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show the notification banner even when app is in foreground
        completionHandler([.banner, .list, .badge, .sound])
    }
}
